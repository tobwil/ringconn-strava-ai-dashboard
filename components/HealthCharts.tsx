import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceArea } from 'recharts';
import { DailyLog, UserProfile } from '../types';
import NeoCard from './NeoCard';
import { calculateAge } from '../services/storage';
import { Info } from 'lucide-react';

interface HealthChartsProps {
    logs: DailyLog[];
    userProfile?: UserProfile;
}

const getHealthyRanges = (age: number) => {
    if (age < 30) return { hrv: [40, 75], rhr: [48, 70] };
    if (age < 40) return { hrv: [35, 65], rhr: [50, 72] };
    if (age < 50) return { hrv: [30, 60], rhr: [52, 75] };
    return { hrv: [25, 55], rhr: [55, 78] };
};

const HealthCharts: React.FC<HealthChartsProps> = ({ logs, userProfile }) => {
    const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp).slice(-30); // Last 30 entries

    if (sortedLogs.length === 0) return null;

    const data = sortedLogs.map(l => ({
        date: l.date.split('.').slice(0, 2).join('.'), // DD.MM format
        hrv: l.hrv,
        rhr: l.restingHr,
        sleep: l.sleepScore, // Now mapped from RingConn Sleep Ratio
        deep: l.sleepBreakdown?.deep || 0,
        rem: l.sleepBreakdown?.rem || 0,
        light: l.sleepBreakdown?.light || 0,
        awake: l.sleepBreakdown?.awake || 0,
        steps: l.steps,
        spo2: l.spo2
    }));

    const age = userProfile ? calculateAge(userProfile.birthdate) : 30;
    const ranges = getHealthyRanges(age);

    return (
        <div className="grid grid-cols-1 gap-6 mb-8">
            {/* HRV CHART */}
            <NeoCard title="HEART RATE VARIABILITY (HRV)" color="#FFFFFF">
                <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-200 p-2 text-xs text-blue-800">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>The highlighted background represents the <strong>Standard Range</strong> for typical healthy adults aged {Math.floor(age / 10) * 10}-{Math.floor(age / 10) * 10 + 9}. Your personal baseline may vary.</span>
                </div>
                <div className="h-[250px] w-full">
                    <h4 className="text-sm font-black mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-[#8C52FF] inline-block border border-black"></span> HRV (ms)
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#000" dy={10} />
                            <YAxis
                                stroke="#8C52FF"
                                domain={[
                                    (dataMin: number) => Math.min(dataMin || ranges.hrv[0], ranges.hrv[0] - 5),
                                    (dataMax: number) => Math.max(dataMax || ranges.hrv[1], ranges.hrv[1] + 5)
                                ]}
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0 0 black' }} />
                            <ReferenceArea
                                y1={ranges.hrv[0]}
                                y2={ranges.hrv[1]}
                                fill="#8C52FF"
                                fillOpacity={0.15}
                                label={{ position: 'insideTopRight', value: 'STANDARD RANGE (AGE)', fill: '#8C52FF', fontSize: 9, fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="hrv" stroke="#8C52FF" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: 'black' }} name="HRV" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </NeoCard>

            {/* RHR CHART */}
            <NeoCard title="RESTING HEART RATE (RHR)" color="#FFFFFF">
                <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-200 p-2 text-xs text-blue-800">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>The highlighted background represents the <strong>Standard Range</strong> for typical healthy adults aged {Math.floor(age / 10) * 10}-{Math.floor(age / 10) * 10 + 9}. Your personal baseline may vary.</span>
                </div>
                <div className="h-[250px] w-full">
                    <h4 className="text-sm font-black mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-[#FF66C4] inline-block border border-black"></span> RESTING HR (bpm)
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#000" dy={10} />
                            <YAxis
                                stroke="#FF66C4"
                                domain={[
                                    (dataMin: number) => Math.min(dataMin || ranges.rhr[0], ranges.rhr[0] - 5),
                                    (dataMax: number) => Math.max(dataMax || ranges.rhr[1], ranges.rhr[1] + 5)
                                ]}
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0 0 black' }} />
                            <ReferenceArea
                                y1={ranges.rhr[0]}
                                y2={ranges.rhr[1]}
                                fill="#FF66C4"
                                fillOpacity={0.15}
                                label={{ position: 'insideBottomRight', value: 'STANDARD RANGE (AGE)', fill: '#FF66C4', fontSize: 9, fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="rhr" stroke="#FF66C4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: 'black' }} name="RHR" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </NeoCard>

            {/* SLEEP ARCHITECTURE */}
            <NeoCard title="SLEEP COMPOSITION" color="#FFFFFF">
                <div className="h-[280px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#000" dy={10} />
                            <YAxis tick={{ fontSize: 10 }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                            <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0 0 black' }} />
                            <Legend />
                            <Bar dataKey="deep" stackId="a" fill="#5454FF" name="Deep" />
                            <Bar dataKey="rem" stackId="a" fill="#8C52FF" name="REM" />
                            <Bar dataKey="light" stackId="a" fill="#93c5fd" name="Light" />
                            <Bar dataKey="awake" stackId="a" fill="#fca5a5" name="Awake" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </NeoCard>

            {/* ADDITIONAL METRICS: SpO2 */}
            <NeoCard title="BLOOD OXYGEN (SpO2)" color="#FFFFFF">
                <div className="h-[250px] w-full">
                    <h4 className="text-sm font-black mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-[#00C2FF] inline-block border border-black"></span> SPO2 (%)
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#000" dy={10} />
                            <YAxis
                                stroke="#00C2FF"
                                domain={[90, 100]}
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0 0 black' }} />
                            <Line type="monotone" dataKey="spo2" stroke="#00C2FF" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: 'black' }} name="SpO2" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </NeoCard>
        </div>
    );
};

export default HealthCharts;