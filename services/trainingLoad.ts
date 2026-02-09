import { ActivitySummary, HistoryEntry, UserProfile, DailyLog } from '../types';

// Constants for Banister Impulse (TRIMP)
// We simplify TSS estimation based on TRIMP if power is missing, or use Efficiency Factor if available.
// Actually, TRIMP is better for purely HR-based analysis without FTP.

// Calculate TRIMP for a single activity
export const calculateTRIMP = (activity: HistoryEntry | ActivitySummary, userProfile?: UserProfile): number => {
    // Needs avgHR and Duration.
    // Needs user MaxHR and RestingHR.

    // Default values if profile missing
    const age = userProfile ? new Date().getFullYear() - new Date(userProfile.birthdate).getFullYear() : 30;
    const maxHr = 220 - age;
    const restingHr = 60; // Default or could check logs, but passed profile is safer/faster here.

    if (!activity.avgHr || !activity.durationMinutes) return 0;

    const durationMin = activity.durationMinutes;
    const avgHr = activity.avgHr;

    // Heart Rate Reserve (HRR) ratio
    // HR_res = (AvgHR - RestingHR) / (MaxHR - RestingHR)
    const hrReserve = Math.max(0, (avgHr - restingHr) / (maxHr - restingHr));

    // Banister TRIMP formula
    // Duration * HR_res * 0.64 * exp(1.92 * HR_res)
    // 0.64 and 1.92 are generic factors (often slightly different for men/women, using men's generic for now)
    const isMale = true; // simplifying
    const factor = isMale ? 1.92 : 1.67;

    const trimp = durationMin * hrReserve * 0.64 * Math.exp(factor * hrReserve);

    return Math.round(trimp);
};

export interface FitnessMetric {
    date: string;
    timestamp: number;
    dailyLoad: number; // TSS/TRIMP for that day
    ctl: number;   // Fitness (42d avg)
    atl: number;   // Fatigue (7d avg)
    tsb: number;   // Form (CTL - ATL)
}

// Calculate Metrics over time
export const calculateFitnessMetrics = (history: HistoryEntry[], userProfile?: UserProfile): FitnessMetric[] => {
    if (history.length === 0) return [];

    // 1. Sort history
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const startTs = sorted[0].timestamp;
    const endTs = new Date().getTime(); // up to today

    // 2. Create a daily timeline from start date to today
    const dayMs = 24 * 60 * 60 * 1000;
    const timeline: FitnessMetric[] = [];

    // We need to initialize EWMA (Exponential Weighted Moving Average)
    // Starting values often assume 0 or some base. Let's assume 0.
    let currentCtl = 0;
    let currentAtl = 0;

    // Time constants
    const ctlDecay = Math.exp(-1 / 42); // 42 days
    const atlDecay = Math.exp(-1 / 7);  // 7 days

    const startDate = new Date(startTs);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endTs);
    endDate.setHours(0, 0, 0, 0);

    // Map history to Dictionary for fast lookup
    const historyMap = new Map<string, number>();
    sorted.forEach(h => {
        const d = new Date(h.timestamp).toISOString().split('T')[0];
        const load = calculateTRIMP(h, userProfile);
        const current = historyMap.get(d) || 0;
        historyMap.set(d, current + load);
    });

    for (let d = startDate.getTime(); d <= endDate.getTime(); d += dayMs) {
        const dateStr = new Date(d).toISOString().split('T')[0];
        const dailyLoad = historyMap.get(dateStr) || 0;

        // Update EWMA
        // CTL_today = CTL_yesterday * decay + Load * (1 - decay)
        currentCtl = (currentCtl * ctlDecay) + (dailyLoad * (1 - ctlDecay));
        currentAtl = (currentAtl * atlDecay) + (dailyLoad * (1 - atlDecay));

        const tsb = currentCtl - currentAtl;

        timeline.push({
            date: dateStr,
            timestamp: d,
            dailyLoad,
            ctl: Math.round(currentCtl),
            atl: Math.round(currentAtl),
            tsb: Math.round(tsb)
        });
    }

    return timeline;
};
