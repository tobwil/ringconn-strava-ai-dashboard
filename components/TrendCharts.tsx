import React from 'react';
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ComposedChart } from 'recharts';
import { HistoryEntry } from '../types';
import NeoCard from './NeoCard';

interface TrendChartsProps {
  history: HistoryEntry[];
}

const TrendCharts: React.FC<TrendChartsProps> = ({ history }) => {
  const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
  
  // 1. Efficiency Data
  const efficiencyData = sortedHistory.slice(-15).map(h => ({
    date: h.date.split('.').slice(0,2).join('.'),
    ef: h.efficiency,
  }));

  // 2. Weekly Volume & Zone Distribution
  const recentLoadData = sortedHistory.slice(-10).map(h => ({
    date: h.date.split('.').slice(0,2).join('.'),
    z1: h.hrZones.z1,
    z2: h.hrZones.z2,
    z3: h.hrZones.z3,
    z4: h.hrZones.z4,
    z5: h.hrZones.z5,
    total: h.durationMinutes
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* EFFICIENCY CHART */}
      <NeoCard title="EFFICIENCY (PWR/HR)" color="#FFFFFF" expandable={true} initialOpen={true}>
        <div className="h-[280px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={efficiencyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 11, fontWeight: 'bold'}} stroke="#000" dy={10} />
                    <YAxis 
                        domain={['dataMin - 0.1', 'dataMax + 0.1']} 
                        stroke="#000" 
                        tick={{fontSize: 11}} 
                        tickFormatter={(val) => val.toFixed(2)}
                    />
                    <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0 0 black' }} />
                    <Bar dataKey="ef" fill="#5454FF" name="Efficiency" barSize={4} />
                    <CartesianGrid stroke="#eee" strokeDasharray="5 5"/>
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </NeoCard>

      {/* ZONE DISTRIBUTION */}
       <NeoCard title="RECENT INTENSITY (ZONES)" color="#FFFFFF" expandable={true} initialOpen={true}>
        <div className="h-[280px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={recentLoadData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 11, fontWeight: 'bold'}} stroke="#000" dy={10} />
                    <YAxis stroke="#000" tick={{fontSize: 11}} label={{ value: 'min', angle: -90, position: 'insideLeft' }}/>
                    <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0 0 black' }} cursor={{fill: 'transparent'}} />
                    <Legend verticalAlign="top" height={36}/>
                    
                    {/* Stacked Bars for Context */}
                    <Bar dataKey="z1" stackId="a" fill="#e5e7eb" name="Z1" />
                    <Bar dataKey="z2" stackId="a" fill="#93c5fd" name="Z2" />
                    <Bar dataKey="z3" stackId="a" fill="#86efac" name="Z3" />
                    <Bar dataKey="z4" stackId="a" fill="#fde047" name="Z4" />
                    <Bar dataKey="z5" stackId="a" fill="#fca5a5" name="Z5" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </NeoCard>
    </div>
  );
};

export default TrendCharts;