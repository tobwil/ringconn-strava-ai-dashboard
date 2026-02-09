import React, { useState, useMemo } from 'react';
import { ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Line, Cell } from 'recharts';
import { HistoryEntry, DailyLog } from '../types';
import NeoCard from './NeoCard';
import { Info } from 'lucide-react';

interface CorrelationLabProps {
    history: HistoryEntry[];
    logs: DailyLog[];
}

type MetricOption = {
    key: string;
    label: string;
    source: 'LOG' | 'ACTIVITY';
    unit: string;
    better: 'high' | 'low';
};

const METRICS: MetricOption[] = [
    { key: 'sleepScore', label: 'Sleep Score', source: 'LOG', unit: '', better: 'high' },
    { key: 'stressLevel', label: 'Stress Level', source: 'LOG', unit: '', better: 'low' },
    { key: 'spo2', label: 'SpO2', source: 'LOG', unit: '%', better: 'high' },
    { key: 'hrv', label: 'HRV', source: 'LOG', unit: 'ms', better: 'high' },
    { key: 'restingHr', label: 'Resting HR', source: 'LOG', unit: 'bpm', better: 'low' },
    { key: 'weight', label: 'Weight', source: 'LOG', unit: 'kg', better: 'low' },
    { key: 'efficiency', label: 'Efficiency (EF)', source: 'ACTIVITY', unit: '', better: 'high' },
    { key: 'distanceKm', label: 'Distance', source: 'ACTIVITY', unit: 'km', better: 'high' },
    { key: 'avgHr', label: 'Avg HR', source: 'ACTIVITY', unit: 'bpm', better: 'low' },
    { key: 'totalElevationGain', label: 'Elevation', source: 'ACTIVITY', unit: 'm', better: 'high' },
];

const CorrelationLab: React.FC<CorrelationLabProps> = ({ history, logs }) => {
    const [xMetric, setXMetric] = useState<string>('sleepScore');
    const [yMetric, setYMetric] = useState<string>('efficiency');
    const [useSmoothing, setUseSmoothing] = useState<boolean>(false);
    const [useLag, setUseLag] = useState<boolean>(false);

    // Unified Data Map using Normalized Date Key from Timestamp
    const unifiedData = useMemo(() => {
        const map = new Map<string, any>();

        // Helper to format date
        const getKey = (ts: number) => {
            const d = new Date(ts);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        // 1. Process Logs
        logs.forEach(l => {
            const key = getKey(l.timestamp);
            if (!map.has(key)) map.set(key, { date: key, displayDate: l.date, timestamp: l.timestamp });
            const entry = map.get(key);
            Object.keys(l).forEach(k => {
                if (k !== 'date' && k !== 'timestamp') entry[k] = (l as any)[k];
            });
        });

        // 2. Process History (Activities)
        history.forEach(h => {
            const key = getKey(h.timestamp);
            if (!map.has(key)) map.set(key, { date: key, displayDate: h.date, timestamp: h.timestamp });
            const entry = map.get(key);
            Object.keys(h).forEach(k => {
                if (k !== 'date' && k !== 'timestamp') entry[k] = (h as any)[k];
            });
        });

        let data = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);

        // --- APPLY SMOOTHING (7-Day Rolling Avg) ---
        if (useSmoothing) {
            // We need to smooth numeric metrics
            // Simple moving average
            const smoothedData = data.map((d, i, arr) => {
                const start = Math.max(0, i - 6);
                const window = arr.slice(start, i + 1);

                const newObj = { ...d };

                METRICS.forEach(m => {
                    const validPoints = window.filter(w => w[m.key] !== undefined && w[m.key] !== null);
                    if (validPoints.length > 0) {
                        const sum = validPoints.reduce((acc, curr) => acc + Number(curr[m.key]), 0);
                        newObj[m.key] = sum / validPoints.length;
                    }
                });
                return newObj;
            });
            data = smoothedData;
        }

        return data;
    }, [history, logs, useSmoothing]);

    // Calculate counts for X options
    const xOptions = useMemo(() => {
        return METRICS.map(m => {
            const count = unifiedData.filter(d => d[m.key] !== undefined && d[m.key] !== null).length;
            return { ...m, count };
        });
    }, [unifiedData]);

    // Calculate counts for Y options
    const yOptions = useMemo(() => {
        return METRICS.map(m => {
            const count = unifiedData.filter(d =>
                d[xMetric] !== undefined && d[xMetric] !== null &&
                d[m.key] !== undefined && d[m.key] !== null
            ).length;
            return { ...m, count };
        });
    }, [unifiedData, xMetric]);

    const rawData = useMemo(() => {
        // Prepare data for correlation
        // If LAG is enabled:
        // We want to compare X (Day T) vs Y (Day T) normally.
        // If X is Activity and Y is Log (Recovery), maybe we want Activity(T-1) vs Log(T).
        // Or generically: Shift Y data "back" by 1 day? Or X data "forward"?
        // Let's implement generic: "Compare Previous Day's X with Today's Y".
        // So for a data point at Date T: X = Data[T-1].x, Y = Data[T].y

        const processed = [];

        for (let i = 0; i < unifiedData.length; i++) {
            const current = unifiedData[i];
            let xVal = current[xMetric];
            let yVal = current[yMetric];

            if (useLag) {
                // Look for T-1 for X Metric
                if (i > 0) {
                    const prev = unifiedData[i - 1];
                    // Check if consecutive days (approx)
                    const dayDiff = (current.timestamp - prev.timestamp) / (1000 * 60 * 60 * 24);
                    if (dayDiff < 1.5) { // Allow slight variance but basically consecutive
                        xVal = prev[xMetric]; // Use previous day's X
                    } else {
                        xVal = undefined; // Broken chain
                    }
                } else {
                    xVal = undefined;
                }
            }

            if (xVal !== undefined && xVal !== null && yVal !== undefined && yVal !== null) {
                processed.push({
                    x: Number(xVal),
                    y: Number(yVal),
                    date: current.displayDate || current.date
                });
            }
        }
        return processed;
    }, [unifiedData, xMetric, yMetric, useLag]);

    const minPoints = 3;
    const hasEnoughData = rawData.length >= minPoints;

    // --- STATS CALCULATION (Trend Line) ---
    const stats = useMemo(() => {
        if (!hasEnoughData) return null;

        const n = rawData.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        rawData.forEach(p => {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumX2 += p.x * p.x;
            sumY2 += p.y * p.y;
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;

        });

        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
        const r = denominator === 0 ? 0 : numerator / denominator;

        const slope = ((n * sumXY) - (sumX * sumY)) / ((n * sumX2) - (sumX * sumX));
        const intercept = (sumY - slope * sumX) / n;

        // Generate Trend Line Points (Start and End of X range)
        // We add a little buffer to X range for visual niceness
        const buffer = (maxX - minX) * 0.05;
        const x1 = minX;
        const x2 = maxX;
        const trendData = [
            { x: x1, trend: slope * x1 + intercept },
            { x: x2, trend: slope * x2 + intercept }
        ];

        return { r, slope, trendData, minY, maxY };
    }, [rawData, hasEnoughData]);

    const getColor = (val: number) => {
        if (!stats) return '#000000';
        const metric = METRICS.find(m => m.key === yMetric);

        // Normalize value 0-1
        const range = stats.maxY - stats.minY;
        const norm = range === 0 ? 0.5 : (val - stats.minY) / range;

        // If better is low, invert
        const score = metric?.better === 'low' ? 1 - norm : norm;

        // Color Scale: Red (0) -> Yellow (0.5) -> Green (1)
        if (score < 0.5) {
            // Red to Yellow
            // Red: 255, 0, 0
            // Yellow: 255, 255, 0
            const p = score * 2;
            return `rgb(255, ${Math.round(255 * p)}, 0)`;
        } else {
            // Yellow to Green
            // Yellow: 255, 255, 0
            // Green: 0, 255, 0
            const p = (score - 0.5) * 2;
            return `rgb(${Math.round(255 * (1 - p))}, 255, 0)`;
        }
    };

    // Interpretation Text
    const interpretation = useMemo(() => {
        if (!stats) return null;
        const { r } = stats;
        const absR = Math.abs(r);

        let strength = "NO CORRELATION";
        let desc = "These metrics don't seem related.";
        let color = "text-gray-500";

        if (absR > 0.7) {
            strength = "STRONG";
            color = "text-[#5454FF]"; // Blue
        } else if (absR > 0.3) {
            strength = "MODERATE";
            color = "text-[#00F0FF]"; // Cyan
        } else {
            strength = "WEAK";
            color = "text-gray-500";
        }

        const direction = r > 0 ? "POSITIVE" : "NEGATIVE";
        const xLabel = METRICS.find(m => m.key === xMetric)?.label;
        const yLabel = METRICS.find(m => m.key === yMetric)?.label;

        if (absR > 0.3) {
            if (r > 0) desc = `When ${xLabel} goes UP, ${yLabel} also tends to go UP.`;
            else desc = `When ${xLabel} goes UP, ${yLabel} tends to go DOWN.`;
        }

        return { strength, direction, desc, color };
    }, [stats, xMetric, yMetric]);


    // Header Controls
    const controls = (
        <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                {/* X Selector */}
                <div className="flex items-center border-2 border-black bg-white shadow-neo-sm h-8 w-full md:w-auto">
                    <span className="bg-gray-200 px-2 h-full flex items-center font-bold text-xs border-r-2 border-black shrink-0">X AXIS</span>
                    <select
                        value={xMetric}
                        onChange={(e) => setXMetric(e.target.value)}
                        className="font-bold text-xs bg-transparent outline-none px-2 py-1 cursor-pointer w-full md:min-w-[120px]"
                    >
                        {xOptions.map(m => (
                            <option key={m.key} value={m.key} disabled={m.count < minPoints}>
                                {m.label} ({m.count})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Y Selector */}
                <div className="flex items-center border-2 border-black bg-white shadow-neo-sm h-8 w-full md:w-auto">
                    <span className="bg-gray-200 px-2 h-full flex items-center font-bold text-xs border-r-2 border-black shrink-0">Y AXIS</span>
                    <select
                        value={yMetric}
                        onChange={(e) => setYMetric(e.target.value)}
                        className="font-bold text-xs bg-transparent outline-none px-2 py-1 cursor-pointer w-full md:min-w-[120px]"
                    >
                        {yOptions.map(m => (
                            <option key={m.key} value={m.key} disabled={m.count < minPoints}>
                                {m.label} ({m.count})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Advanced Toggles */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className={`w-4 h-4 border-2 border-black ${useSmoothing ? 'bg-black' : 'bg-white'}`}
                        onClick={() => setUseSmoothing(!useSmoothing)}>
                        {useSmoothing && <div className="text-white text-[10px] flex justify-center items-center h-full">✓</div>}
                    </div>
                    <span className="font-bold text-xs">7-DAY AVG (SMOOTHING)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className={`w-4 h-4 border-2 border-black ${useLag ? 'bg-black' : 'bg-white'}`}
                        onClick={() => setUseLag(!useLag)}>
                        {useLag && <div className="text-white text-[10px] flex justify-center items-center h-full">✓</div>}
                    </div>
                    <span className="font-bold text-xs">COMPARE X(YESTERDAY) vs Y(TODAY)</span>
                </label>
            </div>
        </div>
    );
    return (
        <NeoCard title="CORRELATION LAB" color="#FFFFFF" expandable={true} initialOpen={true} actions={controls}>
            {!hasEnoughData ? (
                <div className="h-[250px] w-full border-2 border-dashed border-black flex flex-col items-center justify-center bg-[#f7f7f7] text-gray-500">
                    <p className="font-bold text-sm mb-2 text-black">
                        <span className="bg-[#8acaff] px-1 border border-black">NOT</span> ENOUGH MATCHING DATA POINTS.
                    </p>
                    <div className="text-xs max-w-md text-center px-4 leading-relaxed">
                        <p>We found {unifiedData.length} total days, but only {rawData.length} have data for BOTH metrics.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="h-[300px] w-full bg-white border-2 border-black p-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="x" name={xMetric} stroke="#000" tick={{ fontSize: 10 }} domain={['auto', 'auto']}>
                                    <Label value={METRICS.find(m => m.key === xMetric)?.label} offset={0} position="insideBottom" />
                                </XAxis>
                                <YAxis type="number" dataKey="y" name={yMetric} stroke="#000" tick={{ fontSize: 10 }} domain={['auto', 'auto']}>
                                    <Label value={METRICS.find(m => m.key === yMetric)?.label} angle={-90} position="insideLeft" />
                                </YAxis>
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            // Handle both Scatter and Line tooltips
                                            const p = payload[0];
                                            if (p.dataKey === 'trend') return null; // Don't show tooltip for trend line points

                                            return (
                                                <div className="bg-white border border-black p-2 shadow-neo-sm text-xs z-50">
                                                    <p className="font-bold mb-1 border-b border-gray-200 pb-1">{p.payload.date}</p>
                                                    <p className="font-mono">{p.name}: <span className="font-bold">{p.value}</span></p>
                                                    <p className="font-mono">{payload[1]?.name}: <span className="font-bold">{payload[1]?.value}</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {/* The Dots */}
                                <Scatter name={xMetric} data={rawData} line={false} shape="circle">
                                    {rawData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getColor(entry.y)} stroke="black" strokeWidth={1} />
                                    ))}
                                </Scatter>
                                {/* The Trend Line */}
                                {stats && (
                                    <Line
                                        data={stats.trendData}
                                        type="monotone"
                                        dataKey="trend"
                                        stroke="#5454FF"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={false}
                                        animationDuration={500}
                                    />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Interpretation Box */}
                    {interpretation && (
                        <div className="border-4 border-black p-4 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-black text-white p-2 rounded-full">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={`font-black text-lg ${interpretation.color}`}>
                                        {interpretation.strength} {interpretation.strength !== 'NO CORRELATION' && interpretation.direction} RELATIONSHIP
                                    </h4>
                                    <p className="text-sm font-bold">{interpretation.desc}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-mono text-gray-500 block">PEARSON CORRELATION (r)</span>
                                <span className="text-2xl font-black">{stats?.r.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </NeoCard>
    );
};

export default CorrelationLab;