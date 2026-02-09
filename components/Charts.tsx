import React from 'react';
import { LineChart, Line, ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { GPXPoint } from '../types';
import NeoCard from './NeoCard';

interface ChartsProps {
  data: GPXPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-black p-2 shadow-neo-sm font-mono text-xs z-50">
        <p className="font-bold border-b border-black mb-1">{label}</p>
        {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2" style={{backgroundColor: entry.color || entry.stroke || entry.fill}}></div>
                <p>
                    <span className="font-bold">{entry.name}:</span> {Math.round(entry.value)}
                </p>
            </div>
        ))}
      </div>
    );
  }
  return null;
};

const Charts: React.FC<ChartsProps> = ({ data }) => {
  // Map data without sampling (User request: "alle datenpunkte")
  const chartData = data.map(pt => ({
    time: pt.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hr: pt.hr,
    power: pt.power,
    cad: pt.cad,
    ele: pt.ele
  }));

  return (
    <div className="space-y-8">
        <NeoCard title="PERFORMANCE (HR & POWER)" color="#FFFFFF" expandable={true} initialOpen={true}>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="time" stroke="#000" tick={{fontSize: 10}} minTickGap={60} />
                        <YAxis yAxisId="left" stroke="#FF66C4" tick={{fontSize: 10}} label={{ value: 'HR', angle: -90, position: 'insideLeft', fill: '#FF66C4' }} domain={['dataMin - 5', 'auto']} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} stroke="#5454FF" label={{ value: 'PWR', angle: 90, position: 'insideRight', fill: '#5454FF' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{paddingTop: '10px'}}/>
                        <Line yAxisId="left" type="monotone" dataKey="hr" stroke="#FF66C4" strokeWidth={1.5} dot={false} name="Heart Rate" />
                        <Line yAxisId="right" type="monotone" dataKey="power" stroke="#5454FF" strokeWidth={1.5} dot={false} name="Power" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </NeoCard>

        <NeoCard title="TERRAIN & MECHANICS" color="#FFFFFF" expandable={true} initialOpen={true}>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="time" stroke="#000" tick={{fontSize: 10}} minTickGap={60} />
                        <YAxis yAxisId="left" stroke="#1e1e1e" tick={{fontSize: 10}} label={{ value: 'ELE (m)', angle: -90, position: 'insideLeft' }} domain={['dataMin - 10', 'auto']} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} stroke="#d97706" label={{ value: 'CAD', angle: 90, position: 'insideRight', fill: '#d97706' }} domain={[0, 130]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{paddingTop: '10px'}}/>
                        <Area yAxisId="left" type="monotone" dataKey="ele" fill="#e5e5e5" stroke="#1e1e1e" strokeWidth={1} name="Elevation" />
                        <Line yAxisId="right" type="monotone" dataKey="cad" stroke="#d97706" strokeWidth={1.5} dot={false} name="Cadence" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </NeoCard>
    </div>
  );
};

export default Charts;