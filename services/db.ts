import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { UserProfile, HistoryEntry, DailyLog } from '../types';

interface RingConnDB extends DBSchema {
    users: {
        key: string; // 'current'
        value: UserProfile;
    };
    history: {
        key: string;
        value: HistoryEntry;
        indexes: { 'by-date': string };
    };
    logs: {
        key: number; // timestamp
        value: DailyLog;
        indexes: { 'by-date': string };
    };
}

const DB_NAME = 'ringconn-strava-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RingConnDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<RingConnDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Users store (singleton mostly)
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users');
                }

                // History store
                if (!db.objectStoreNames.contains('history')) {
                    const historyStore = db.createObjectStore('history', { keyPath: 'id' });
                    historyStore.createIndex('by-date', 'date');
                }

                // Logs store
                if (!db.objectStoreNames.contains('logs')) {
                    const logsStore = db.createObjectStore('logs', { keyPath: 'timestamp' });
                    logsStore.createIndex('by-date', 'date');
                }
            },
        });
    }
    return dbPromise;
};

export const getDB = () => initDB();
