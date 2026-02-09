import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from 'recharts';
import NeoCard from './NeoCard';
import { FitnessMetric } from '../services/trainingLoad';
import { Info, Zap, Battery, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface FitnessChartProps {
    data: FitnessMetric[];
}

const getStatus = (tsb: number, ctl: number) => {
    // If fitness base is very low, TSB is misleading (you are "fresh" because you do nothing)
    if (ctl < 20) return { label: "LOW VOLUME / DETRAINING", color: "text-gray-500", icon: <Battery className="w-6 h-6" />, desc: "Training load is very low. Consistency is key to building a base." };

    if (tsb > 25) return { label: "RECOVERY / TAPERING", color: "text-blue-500", icon: <Battery className="w-6 h-6" />, desc: "Very rested. Good for race tapering, but fitness drops if prolonged." };
    if (tsb > 5) return { label: "PERFORMANCE READY", color: "text-green-500", icon: <CheckCircle className="w-6 h-6" />, desc: "Fresh and fit! You are in the sweet spot for a peak performance." };
    if (tsb >= -10) return { label: "MAINTENANCE / PRODUCTIVE", color: "text-teal-600", icon: <TrendingUp className="w-6 h-6" />, desc: "Balanced load. You are absorbing training well." };
    if (tsb >= -30) return { label: "HIGH STRAIN (BUILD)", color: "text-orange-500", icon: <Zap className="w-6 h-6" />, desc: "Heavy training block. Fitness is building, but fatigue is high." };
    return { label: "OVERLOAD WARNING", color: "text-red-600", icon: <AlertTriangle className="w-6 h-6" />, desc: "Excessive fatigue. High risk of injury/burnout. Take a rest week." };
};

const FitnessChart: React.FC<FitnessChartProps> = ({ data }) => {
    const recentData = useMemo(() => {
        return data.slice(-90); // Last 3 months for better focus
    }, [data]);

    const latest = data[data.length - 1];
    if (!data || data.length === 0) return null;

    const status = getStatus(latest?.tsb || 0, latest?.ctl || 0);

    return (
        <div className="grid grid-cols-1 gap-6 mb-8">
            {/* STATUS HEADER */}
            <NeoCard color="#FFFFFF" className="bg-white">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-full border-4 border-black ${status.color.replace('text-', 'bg-').replace('600', '200').replace('500', '200')} text-black`}>
                        {status.icon}
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${status.color}`}>{status.label}</h3>
                        <p className="font-bold text-gray-600 leading-tight">{status.desc}</p>
                    </div>
                </div>
            </NeoCard>

            {/* Current Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NeoCard className="flex flex-col items-center justify-center p-4 relative overflow-hidden" color="#FFFFFF">
                    <span className="text-xs font-bold text-blue-600 z-10">FITNESS BASE (CTL)</span>
                    <span className="text-4xl font-black z-10">{latest?.ctl || 0}</span>
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-500"></div>
                </NeoCard>
                <NeoCard className="flex flex-col items-center justify-center p-4 relative overflow-hidden" color="#FFFFFF">
                    <span className="text-xs font-bold text-red-500 z-10">RECENT FATIGUE (ATL)</span>
                    <span className="text-4xl font-black z-10">{latest?.atl || 0}</span>
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-red-500"></div>
                </NeoCard>
                <NeoCard className="flex flex-col items-center justify-center p-4 relative overflow-hidden" color={latest?.tsb >= 0 ? '#ccfdcc' : '#fecaca'}>
                    <span className="text-xs font-bold text-gray-700 z-10">READINESS (FORM)</span>
                    <span className="text-4xl font-black z-10">{latest?.tsb > 0 ? '+' : ''}{latest?.tsb || 0}</span>
                    <div className={`absolute bottom-0 left-0 w-full h-2 ${latest?.tsb >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </NeoCard>
            </div>

            {/* MAIN CHART */}
            <NeoCard title="FITNESS & FRESHNESS TREND" color="#FFFFFF">
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={recentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fontWeight: 'bold' }}
                                stroke="#000"
                                dy={10}
                                minTickGap={30}
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${d.getDate()}.${d.getMonth() + 1}`;
                                }}
                            />

                            {/* Left Axis: Load */}
                            <YAxis yAxisId="load" stroke="#9ca3af" tick={{ fontSize: 10 }} domain={['auto', 'auto']} hide />

                            {/* Right Axis: Form */}
                            <YAxis yAxisId="form" orientation="right" stroke="#000" tick={{ fontSize: 10 }} />

                            <Tooltip
                                contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0 0 black' }}
                                labelFormatter={(label) => new Date(label).toDateString()}
                            />

                            <ReferenceLine y={0} yAxisId="form" stroke="#000" />

                            {/* Form Area (TSB) */}
                            <Area
                                yAxisId="form"
                                type="monotone"
                                dataKey="tsb"
                                fill="#fde047"
                                fillOpacity={0.6}
                                stroke="none"
                                name="Readiness"
                            />

                            {/* Fitness Line (CTL) */}
                            <Line
                                yAxisId="load"
                                type="monotone"
                                dataKey="ctl"
                                stroke="#2563eb"
                                strokeWidth={4}
                                dot={false}
                                name="Fitness Base"
                            />
                            {/* Fatigue Line (ATL) - Hidden by default or very subtle */}
                            <Line
                                yAxisId="load"
                                type="monotone"
                                dataKey="atl"
                                stroke="#ef4444"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Fatigue"
                                opacity={0.5}
                            />

                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </NeoCard>
        </div>
    );
};

export default FitnessChart;
