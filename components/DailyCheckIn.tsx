import React, { useState } from 'react';
import NeoCard from './NeoCard';
import NeoButton from './NeoButton';
import { DailyLog, UserProfile } from '../types';
import { saveBulkDailyLogs } from '../services/storage';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { ToastType } from './Toast';

interface DailyCheckInProps {
    userProfile: UserProfile;
    onUpdate: () => void;
    addToast: (msg: string, type: ToastType) => void;
}

const DailyCheckIn: React.FC<DailyCheckInProps> = ({ onUpdate, addToast }) => {
    const [processedCount, setProcessedCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRingConnImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        const fileReaders: Promise<string>[] = [];
        const fileNames: string[] = [];

        // Read all files
        for (let i = 0; i < files.length; i++) {
            fileNames.push(files[i].name);
            const promise = new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsText(files[i]);
            });
            fileReaders.push(promise);
        }

        Promise.all(fileReaders).then((contents) => {
            processFiles(contents);
        });
    };

    const processFiles = async (fileContents: string[]) => {
        const logsMap = new Map<string, DailyLog>();

        const getLog = (dateStr: string, timestamp: number): DailyLog => {
            if (!logsMap.has(dateStr)) {
                logsMap.set(dateStr, { date: dateStr, timestamp });
            }
            return logsMap.get(dateStr)!;
        };

        let successCount = 0;

        fileContents.forEach((content) => {
            const lines = content.trim().split('\n');
            if (lines.length < 2) return;
            const header = lines[0];

            // IDENTIFY FILE TYPE BASED ON HEADER

            // 1. ACTIVITY FILE (Date, Steps, Calories)
            if (header.includes('Steps') && header.includes('Calories')) {
                for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(',');
                    if (row.length < 3) continue;
                    const dateStr = row[0].trim();
                    const steps = parseInt(row[1]);
                    const cal = parseInt(row[2]);

                    if (dateStr) {
                        const log = getLog(dateStr, new Date(dateStr).getTime());
                        log.steps = isNaN(steps) ? undefined : steps;
                        log.calories = isNaN(cal) ? undefined : cal;
                    }
                }
                successCount++;
            }
            // 2. SLEEP FILE (Start Time, ..., Sleep Time Ratio, ..., Sleep Stages)
            else if (header.includes('Sleep Time Ratio') && header.includes('Sleep Stages')) {
                // Indices
                const headers = header.split(',').map(h => h.trim());
                const idxEnd = headers.indexOf('End Time');
                const idxRatio = headers.findIndex(h => h.includes('Sleep Time Ratio'));
                const idxAwake = headers.findIndex(h => h.includes('Awake(min)'));
                const idxRem = headers.findIndex(h => h.includes('REM(min)'));
                const idxLight = headers.findIndex(h => h.includes('Light Sleep(min)'));
                const idxDeep = headers.findIndex(h => h.includes('Deep Sleep(min)'));

                for (let i = 1; i < lines.length; i++) {
                    // CSV split handling (basic)
                    const row = lines[i].split(',');
                    if (idxEnd === -1) continue;

                    const endTimeStr = row[idxEnd]; // "2026-02-08 05:27:24"
                    if (!endTimeStr) continue;

                    // Use End Time for the Date of the log (Wake up day)
                    const endDate = new Date(endTimeStr);
                    if (isNaN(endDate.getTime())) continue;
                    const dateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

                    const log = getLog(dateStr, endDate.getTime());

                    // Parse Ratio (remove %)
                    const ratioStr = row[idxRatio]?.replace('%', '');
                    if (ratioStr) log.sleepScore = parseInt(ratioStr);

                    // Parse Stages
                    log.sleepBreakdown = {
                        awake: parseInt(row[idxAwake]) || 0,
                        rem: parseInt(row[idxRem]) || 0,
                        light: parseInt(row[idxLight]) || 0,
                        deep: parseInt(row[idxDeep]) || 0,
                    };
                }
                successCount++;
            }
            // 3. VITALS FILE (Date, Avg. Heart Rate, Spo2, HRV)
            else if (header.includes('Avg. Heart Rate') && header.includes('Avg. HRV')) {
                const headers = header.split(',').map(h => h.trim());
                const idxDate = headers.findIndex(h => h.toLowerCase().includes('date'));
                const idxHr = headers.findIndex(h => h.includes('Avg. Heart Rate'));
                const idxSpo2 = headers.findIndex(h => h.includes('Avg. Spo2'));
                const idxHrv = headers.findIndex(h => h.includes('Avg. HRV'));

                for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(',');
                    const dateStr = row[idxDate]?.trim();

                    if (dateStr) {
                        const log = getLog(dateStr, new Date(dateStr).getTime());
                        log.restingHr = idxHr !== -1 ? parseFloat(row[idxHr]) : undefined;
                        log.spo2 = idxSpo2 !== -1 ? parseFloat(row[idxSpo2]) : undefined;
                        log.hrv = idxHrv !== -1 ? parseFloat(row[idxHrv]) : undefined;
                    }
                }
                successCount++;
            }
        });

        if (logsMap.size > 0) {
            try {
                await saveBulkDailyLogs(Array.from(logsMap.values()));
                setProcessedCount(logsMap.size);
                addToast(`Synced ${logsMap.size} days from ${successCount} files.`, 'success');
                // onUpdate calls refreshData which is async, but we don't need to await it here specifically
                // unless we want UI to block even longer.
                onUpdate();
            } catch (e) {
                console.error(e);
                addToast("Failed to save data to database.", 'error');
            }
        } else {
            addToast("No valid data found in files.", 'error');
        }
        setIsProcessing(false);
    };

    return (
        <NeoCard title="RINGCONN UPLOAD" color="#FFFFFF">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-black bg-gray-50 text-center">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
                    <div className="w-10 h-10 border-4 border-white rounded-full"></div>
                </div>

                <h3 className="text-xl font-black mb-2">RINGCONN BULK IMPORT</h3>
                <p className="text-sm font-bold text-gray-500 mb-6 max-w-sm">
                    Select all 3 CSV files (Activity, Sleep, Vitals) exported from the RingConn app at once.
                </p>

                <label className={`cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                        type="file"
                        multiple
                        accept=".csv"
                        onChange={handleRingConnImport}
                        className="hidden"
                        disabled={isProcessing}
                    />
                    <div className="flex items-center gap-2 bg-[#FFDE59] border-4 border-black px-6 py-3 font-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        {isProcessing ? (
                            <>PROCESSING...</>
                        ) : (
                            <><Upload className="w-5 h-5" /> SELECT CSV FILES</>
                        )}
                    </div>
                </label>

                {processedCount > 0 && (
                    <div className="mt-6 flex items-center gap-2 text-green-600 font-bold animate-in zoom-in">
                        <CheckCircle className="w-5 h-5" />
                        <span>Successfully synced {processedCount} days of health data.</span>
                    </div>
                )}

                <div className="mt-8 text-xs text-left w-full max-w-md bg-white border-2 border-black p-3">
                    <p className="font-bold mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> NOTE:</p>
                    <p>Ensure you upload the "Activity", "Sleep", and "Vital Signs" CSVs. The system automatically merges data for the same dates.</p>
                </div>
            </div>
        </NeoCard>
    );
};

export default DailyCheckIn;