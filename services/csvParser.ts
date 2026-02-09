import { DailyLog, SleepBreakdown } from '../types';

export const parseRingConnCSV = (content: string): DailyLog[] => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim());

    // Detect file type based on headers, but now we use a generic parser that pulls whatever it finds?
    // Or specific parsers? A generic parser is better if files are mixed.
    // However, Sleep is interval-based (Start/End time) while others are Daily summaries (Date).

    // Check for Interval Sleep file first
    if (headers.includes('start time') && headers.includes('end time')) {
        return parseSleepCSV(lines);
    }

    // Otherwise, assume Daily Summary format (Date, ...)
    // We can extract ALL available metrics from this single file.
    return parseDailySummaryCSV(lines, headers);
};

const parseDailySummaryCSV = (lines: string[], headers: string[]): DailyLog[] => {
    // Map headers to indices
    const idxDate = headers.findIndex(h => h.includes('date'));
    const idxSteps = headers.findIndex(h => h.includes('steps'));
    const idxCals = headers.findIndex(h => h.includes('calories'));

    // HR can be "Avg. Heart Rate", "Avg(bpm)", "Heart Rate"
    const idxHr = headers.findIndex(h => h.includes('heart rate') || (h.includes('avg') && h.includes('bpm')));

    // SpO2 can be "Avg(%)", "SpO2", "Blood Oxygen"
    // Be careful not to match other % columns if any. usually SpO2 is unique enough.
    const idxSpo2 = headers.findIndex(h => h.includes('spo2') || h.includes('oxygen') || (h.includes('avg') && h.includes('%')));

    // Stress
    const idxStress = headers.findIndex(h => h.includes('stress'));

    // HRV
    const idxHrv = headers.findIndex(h => h.includes('hrv') || h.includes('rssd'));

    if (idxDate === -1) {
        console.error("No Date column found in CSV");
        return [];
    }

    const logs: DailyLog[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length <= idxDate) continue;

        const date = cols[idxDate];
        // Validate date format YYYY-MM-DD
        if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

        const log: DailyLog = {
            date,
            timestamp: new Date(date).getTime(),
        };

        if (idxSteps !== -1) {
            const val = parseInt(cols[idxSteps]);
            if (!isNaN(val)) log.steps = val;
        }

        if (idxCals !== -1) {
            const val = parseInt(cols[idxCals]);
            if (!isNaN(val)) log.calories = val;
        }

        if (idxHr !== -1) {
            const val = parseInt(cols[idxHr]);
            if (!isNaN(val)) log.restingHr = val;
        }

        if (idxSpo2 !== -1) {
            const val = parseInt(cols[idxSpo2]);
            if (!isNaN(val)) log.spo2 = val;
        }

        if (idxStress !== -1) {
            const val = parseInt(cols[idxStress]);
            if (!isNaN(val)) log.stress = val;
        }

        if (idxHrv !== -1) {
            const val = parseInt(cols[idxHrv]);
            if (!isNaN(val)) log.hrv = val;
        }

        logs.push(log);
    }
    return logs;
};

const parseSleepCSV = (lines: string[]): DailyLog[] => {
    // Format: Start Time,End Time,Sleep Stage

    // Headers might vary, map them too?
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim());
    const idxStart = headers.findIndex(h => h.includes('start'));
    const idxEnd = headers.findIndex(h => h.includes('end'));
    const idxStage = headers.findIndex(h => h.includes('stage') || h.includes('type'));

    if (idxStart === -1 || idxEnd === -1) return [];

    const dailyMap: Record<string, SleepBreakdown> = {};

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length <= idxEnd) continue;

        const start = new Date(cols[idxStart]);
        const end = new Date(cols[idxEnd]);
        const stage = idxStage !== -1 ? cols[idxStage].toLowerCase() : '';

        if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

        // Calculate minutes
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

        // Assign to End Date
        const dateKey = end.toISOString().split('T')[0];

        if (!dailyMap[dateKey]) dailyMap[dateKey] = { deep: 0, light: 0, rem: 0, awake: 0 };

        if (stage.includes('deep')) dailyMap[dateKey].deep += durationMinutes;
        else if (stage.includes('light')) dailyMap[dateKey].light += durationMinutes;
        else if (stage.includes('rem')) dailyMap[dateKey].rem += durationMinutes;
        else if (stage.includes('awake')) dailyMap[dateKey].awake += durationMinutes;
    }

    return Object.keys(dailyMap).map(date => {
        const breakdown = dailyMap[date];
        const totalSleep = breakdown.deep + breakdown.light + breakdown.rem;
        return {
            date,
            timestamp: new Date(date).getTime(),
            sleepBreakdown: breakdown,
            sleepScore: Math.min(100, Math.round((totalSleep / 480) * 100))
        };
    });
};
