import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ZoneStats } from '../types';
import NeoCard from './NeoCard';

interface ZoneChartProps {
  zones: ZoneStats;
}

const ZoneChart: React.FC<ZoneChartProps> = ({ zones }) => {
  const data = [
    { name: 'Z1', min: zones.z1, color: '#9ca3af' }, // Gray
    { name: 'Z2', min: zones.z2, color: '#60a5fa' }, // Blue
    { name: 'Z3', min: zones.z3, color: '#4ade80' }, // Green
    { name: 'Z4', min: zones.z4, color: '#facc15' }, // Yellow
    { name: 'Z5', min: zones.z5, color: '#f87171' }, // Red
  ];

  return (
    <NeoCard title="INTENSITY DISTRIBUTION" color="#FFFFFF" expandable={true} initialOpen={true}>
      <div className="h-[250px] w-full">
        <p className="text-xs mb-2 font-bold opacity-60">TIME IN ZONES (MINUTES)</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#000" tick={{fontWeight: 'bold'}} />
            <YAxis stroke="#000" />
            <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0 0 black' }}
            />
            <Bar dataKey="min" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="black" strokeWidth={2} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </NeoCard>
  );
};

export default ZoneChart;