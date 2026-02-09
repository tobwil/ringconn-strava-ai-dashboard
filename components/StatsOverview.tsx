import React from 'react';
import NeoCard from './NeoCard';
import { HistoryEntry, DailyLog } from '../types';
import { getDailyLogs } from '../services/storage';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsOverviewProps {
    history: HistoryEntry[];
    logs: DailyLog[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ history, logs }) => {
    const now = new Date();

    const getStatsForPeriod = (startDaysAgo: number, endDaysAgo: number) => {
        const startCutoff = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000).getTime();
        const endCutoff = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000).getTime();

        // Filter helper: Timestamp must be LESS than startCutoff (newer) and GREATER than endCutoff (older)
        const inRange = (ts: number) => ts <= startCutoff && ts > endCutoff;

        // Strava Data
        const relevantHistory = history.filter(h => inRange(h.timestamp));
        const dist = relevantHistory.reduce((acc, curr) => acc + (curr.distanceKm || 0), 0);
        const ele = relevantHistory.reduce((acc, curr) => acc + (curr.totalElevationGain || 0), 0);

        // RingConn Data
        const relevantLogs = logs.filter(l => inRange(l.timestamp));
        const steps = relevantLogs.reduce((acc, curr) => acc + (curr.steps || 0), 0);
        const cals = relevantLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);

        // Averages
        const spo2Logs = relevantLogs.filter(l => l.spo2 !== undefined && l.spo2 > 0);
        const avgSpo2 = spo2Logs.length > 0 ? spo2Logs.reduce((acc, curr) => acc + (curr.spo2 || 0), 0) / spo2Logs.length : 0;

        return { dist, ele, steps, cals, avgSpo2 };
    };

    const currentWeek = getStatsForPeriod(0, 7);
    const prevWeek = getStatsForPeriod(7, 14);

    const currentMonth = getStatsForPeriod(0, 30);
    const prevMonth = getStatsForPeriod(30, 60);

    const currentYear = getStatsForPeriod(0, 365);

    // Helper component for Trend Arrow
    const TrendIndicator = ({ current, previous, inverse = false }: { current: number, previous: number, inverse?: boolean }) => {
        if (previous === 0) return <span className="text-[10px] text-gray-400 font-mono">-</span>;

        const diff = current - previous;
        const pct = (diff / previous) * 100;

        if (Math.abs(pct) < 1) return <Minus className="w-3 h-3 text-gray-400" />;

        const isUp = diff > 0;
        // Ideally, more distance is Good (Green). But maybe more weight is Bad. 
        // For now, let's assume Up is "Action" (Green) unless specified.
        const isGood = inverse ? !isUp : isUp;
        const ColorIcon = isGood ? TrendingUp : TrendingDown;
        const colorClass = isGood ? 'text-green-600' : 'text-red-500';

        return (
            <div className={`flex items-center gap-1 ${colorClass}`}>
                <ColorIcon className="w-3 h-3" />
                <span className="text-[10px] font-bold font-mono">{Math.abs(pct).toFixed(0)}%</span>
            </div>
        );
    };

    const StatRow = ({ label, val, unit, prevVal }: { label: string, val: string | number, unit?: string, prevVal?: number }) => (
        <div className="flex justify-between items-end border-b-2 border-dashed border-gray-300 pb-1 last:border-0 h-10">
            <div className="flex flex-col justify-end">
                <span className="text-[10px] md:text-xs font-bold text-gray-500 leading-none mb-1">{label}</span>
                {prevVal !== undefined && (
                    <TrendIndicator current={Number(val)} previous={prevVal} />
                )}
            </div>
            <span className="text-xl md:text-2xl font-black">{val} <span className="text-[10px] text-gray-400 font-normal">{unit}</span></span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <NeoCard title="LAST 7 DAYS" color="#FFFFFF">
                <div className="flex flex-col gap-1">
                    <StatRow label="DISTANCE" val={currentWeek.dist.toFixed(1)} unit="km" prevVal={prevWeek.dist} />
                    <StatRow label="ELEVATION" val={currentWeek.ele} unit="m" prevVal={prevWeek.ele} />
                    <StatRow label="STEPS" val={(currentWeek.steps / 1000).toFixed(1)} unit="k" prevVal={prevWeek.steps / 1000} />
                    <StatRow label="CALORIES" val={(currentWeek.cals / 1000).toFixed(1)} unit="k" prevVal={prevWeek.cals / 1000} />
                    <StatRow label="AVG SPO2" val={currentWeek.avgSpo2 > 0 ? currentWeek.avgSpo2.toFixed(1) : '-'} unit="%" />
                </div>
            </NeoCard>

            <NeoCard title="LAST 30 DAYS" color="#FFFFFF">
                <div className="flex flex-col gap-1">
                    <StatRow label="DISTANCE" val={currentMonth.dist.toFixed(0)} unit="km" prevVal={prevMonth.dist} />
                    <StatRow label="ELEVATION" val={currentMonth.ele} unit="m" prevVal={prevMonth.ele} />
                    <StatRow label="STEPS" val={(currentMonth.steps / 1000).toFixed(0)} unit="k" prevVal={prevMonth.steps / 1000} />
                    <StatRow label="CALORIES" val={(currentMonth.cals / 1000).toFixed(0)} unit="k" prevVal={prevMonth.cals / 1000} />
                    <StatRow label="AVG SPO2" val={currentMonth.avgSpo2 > 0 ? currentMonth.avgSpo2.toFixed(1) : '-'} unit="%" />
                </div>
            </NeoCard>

            <NeoCard title="LAST 365 DAYS" color="#00F0FF">
                <div className="flex flex-col gap-1">
                    <StatRow label="DISTANCE" val={currentYear.dist.toFixed(0)} unit="km" />
                    <StatRow label="ELEVATION" val={(currentYear.ele / 1000).toFixed(1)} unit="km" />
                    <StatRow label="STEPS" val={(currentYear.steps / 1000000).toFixed(2)} unit="m" />
                    <StatRow label="CALORIES" val={(currentYear.cals / 1000).toFixed(0)} unit="k" />
                </div>
            </NeoCard>
        </div>
    );
};

export default StatsOverview;