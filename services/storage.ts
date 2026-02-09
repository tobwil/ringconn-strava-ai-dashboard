import { ActivitySummary, HistoryEntry, UserProfile, DailyLog } from '../types';
import { initDB } from './db';

const USER_KEY = 'current';

// --- User Profile ---

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const db = await initDB();
  await db.put('users', profile, USER_KEY);
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const db = await initDB();
  return (await db.get('users', USER_KEY)) || null;
};

// --- History ---

export const getHistory = async (): Promise<HistoryEntry[]> => {
  const db = await initDB();
  const allHistory = await db.getAll('history');
  return allHistory.sort((a, b) => b.timestamp - a.timestamp);
};

export const addToHistory = async (activity: ActivitySummary): Promise<void> => {
  const db = await initDB();

  // Create history entry without raw points to save space? 
  // IndexedDB can handle larger objects better than localStorage, but let's keep it lean if needed.
  // actually, let's store points because we might want to re-analyze later without re-uploading.
  // But original code removed points. Let's stick to original behavior for now to be safe,
  // or maybe better: keep points! IndexedDB is great for that. 
  // Wait, the original code explicitly removed points: `const { points, ...historyEntry } = activity;`
  // I will keep it that way to avoid bloating DB too fast, unless requested otherwise.

  // Create history entry. Originally stripped points, but now we keep them for archive details.
  // IndexedDB can handle this.

  // Check if exists
  const existing = await db.get('history', activity.id);
  if (existing) return;

  await db.add('history', activity);
};

export const deleteActivity = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('history', id);
};

// --- Daily Logs ---

export const saveDailyLog = async (log: DailyLog): Promise<void> => {
  const db = await initDB();
  await db.put('logs', log);

  // Also update user weight if provided
  if (log.weight) {
    const user = await getUserProfile();
    if (user) {
      user.weight = log.weight;
      await saveUserProfile(user);
    }
  }
};

export const saveBulkDailyLogs = async (newLogs: DailyLog[]): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction('logs', 'readwrite');
  const store = tx.objectStore('logs');

  for (const log of newLogs) {
    // We could do a merge strategy here if needed, but put() overwrites by key (timestamp)
    // The original code merged by *Date String*. `key` in DB is `timestamp`.
    // We need to be careful. The original code used `date` as the unique identifier logic-wise
    // but stored array sorted by timestamp.

    // Let's look up by date first to maintain logic?
    // The original code said: "Filter out existing log for same date to allow update"
    // So distinct constraint is DATE.
    // IndexedDB key is TIMESTAMP. This is a bit mismatch.
    // If I add a log for "2023-01-01" with ts=100 and then another with ts=200, 
    // simply putting them might duplicate if I use timestamp as key.

    // To replicate "One log per day" logic strictly:
    // We should probably check if a log exists for that date.
    // I added an index 'by-date' in db.ts.

    const index = store.index('by-date');
    const existingEntry = await index.get(log.date);

    if (existingEntry) {
      // Merge or Overwrite? Original: "New overwrites Old" + merge
      // Merge existing with new log
      const merged = { ...existingEntry, ...log };

      // If timestamps differ, delete the old one to avoid duplicates
      if (existingEntry.timestamp !== log.timestamp) {
        await store.delete(existingEntry.timestamp);
      }

      // Save the MERGED entry
      await store.put(merged);
    } else {
      await store.put(log);
    }
  }
  await tx.done;
};

export const getDailyLogs = async (): Promise<DailyLog[]> => {
  const db = await initDB();
  const logs = await db.getAll('logs');
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

export const deleteDailyLog = async (timestamp: number): Promise<void> => {
  const db = await initDB();
  await db.delete('logs', timestamp);
};

// --- Utils ---

export const clearData = async (): Promise<void> => {
  const db = await initDB();
  await db.clear('users');
  await db.clear('history');
  await db.clear('logs');

  // Also clear User Data from local storage just in case
  localStorage.removeItem('neo_user_v1');
  localStorage.removeItem('neo_history_v1');
  localStorage.removeItem('neo_daily_v1');
};

export const exportAllData = async () => {
  const profile = await getUserProfile();
  const history = await getHistory();
  const logs = await getDailyLogs();
  return { profile, history, logs };
};

export const calculateAge = (birthdate: string): number => {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getDaysUntil = (dateString?: string): number | null => {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  // Note: Math.ceil can return -0, maybe normalize? It's fine.
};

// --- Migration ---

// --- Migration ---

export const migrateFromLocalStorage = async () => {
  const db = await initDB();

  // Users
  const userStr = localStorage.getItem('neo_user_v1');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const exists = await db.get('users', USER_KEY);
      if (!exists) {
        await db.put('users', user, USER_KEY);
        console.log("Migrated User.");
      }
    } catch (e) { console.error("Migration user error", e); }
  }

  // History
  const histStr = localStorage.getItem('neo_history_v1');
  if (histStr) {
    try {
      const list = JSON.parse(histStr);
      if (Array.isArray(list)) {
        const tx = db.transaction('history', 'readwrite');
        let count = 0;
        for (const item of list) {
          await tx.store.put(item);
          count++;
        }
        await tx.done;
        console.log(`Migrated ${count} history items.`);
      }
    } catch (e) { console.error("Migration history error", e); }
  }

  // Logs
  const logStr = localStorage.getItem('neo_daily_v1');
  if (logStr) {
    try {
      const list = JSON.parse(logStr);
      if (Array.isArray(list)) {
        const tx = db.transaction('logs', 'readwrite');
        let count = 0;
        for (const item of list) {
          await tx.store.put(item);
          count++;
        }
        await tx.done;
        console.log(`Migrated ${count} logs.`);
      }
    } catch (e) { console.error("Migration logs error", e); }
  }
};

export const importBackup = async (jsonString: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.history || !data.userProfile) {
      throw new Error("Invalid backup file format.");
    }

    const db = await initDB();
    const tx = db.transaction(['history', 'logs', 'users'], 'readwrite');

    // Clear existing
    await tx.objectStore('history').clear();
    await tx.objectStore('logs').clear();
    await tx.objectStore('users').clear();

    // Import Profile
    await tx.objectStore('users').put(data.userProfile, USER_KEY);

    // Import History
    for (const item of data.history) {
      await tx.objectStore('history').put(item);
    }

    // Import Logs
    if (data.dailyLogs) {
      for (const log of data.dailyLogs) {
        await tx.objectStore('logs').put(log);
      }
    }

    await tx.done;
    return true;
  } catch (e) {
    console.error("Import failed:", e);
    return false;
  }
};