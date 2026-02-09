import React, { useState } from 'react';
import { HistoryEntry, DailyLog } from '../types';
import { Trash2, ChevronRight, Activity, FileText, Zap } from 'lucide-react';
import NeoButton from './NeoButton';

interface LogbookManagerProps {
  history: HistoryEntry[];
  dailyLogs: DailyLog[];
  onSelectActivity: (entry: HistoryEntry) => void;
  onDeleteActivity: (id: string) => void;
  onDeleteLog: (timestamp: number) => void;
}

const LogbookManager: React.FC<LogbookManagerProps> = ({ 
    history, 
    dailyLogs, 
    onSelectActivity, 
    onDeleteActivity, 
    onDeleteLog 
}) => {
  const [tab, setTab] = useState<'ACTIVITIES' | 'HEALTH'>('ACTIVITIES');

  return (
    <div className="w-full">
        <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setTab('ACTIVITIES')}
                className={`px-4 py-2 font-black border-2 border-black flex items-center gap-2 ${tab === 'ACTIVITIES' ? 'bg-[#5454FF] text-white' : 'bg-white'}`}
            >
                <Activity className="w-4 h-4"/> ACTIVITIES
            </button>
            <button 
                onClick={() => setTab('HEALTH')}
                className={`px-4 py-2 font-black border-2 border-black flex items-center gap-2 ${tab === 'HEALTH' ? 'bg-[#FF914D] text-white' : 'bg-white'}`}
            >
                <FileText className="w-4 h-4"/> DAILY LOGS
            </button>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar border-4 border-black p-4 bg-white shadow-neo">
            {tab === 'ACTIVITIES' && (
                history.length === 0 ? <p className="text-center font-bold text-gray-400">NO ACTIVITIES.</p> :
                history.map((entry) => {
                    const intensePct = ((entry.hrZones.z4 + entry.hrZones.z5) / entry.durationMinutes) * 100;
                    return (
                        <div 
                            key={entry.id} 
                            className="border-2 border-black p-4 bg-gray-50 hover:bg-blue-50 transition-colors group relative"
                        >
                            <div className="flex justify-between items-start">
                                <div className="cursor-pointer flex-grow" onClick={() => onSelectActivity(entry)}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-black bg-black text-white px-2 text-sm">{entry.date}</span>
                                        <span className="text-xs font-bold text-gray-500">{entry.durationMinutes}m | {entry.distanceKm}km</span>
                                    </div>
                                    
                                    <div className="max-w-[200px]" title="Time spent in Zone 4 (Threshold) and Zone 5 (VO2 Max)">
                                         <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1">
                                             <span className="flex items-center gap-1"><Zap className="w-3 h-3"/> INTENSITY (Z4+)</span>
                                             <span>{Math.round(intensePct)}%</span>
                                         </div>
                                         <div className="w-full bg-gray-200 h-2 border border-black overflow-hidden">
                                             <div 
                                                className="h-full bg-[#f87171]" // Red color for intensity
                                                style={{width: `${Math.min(100, intensePct)}%`}}
                                             />
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(confirm('Delete activity?')) onDeleteActivity(entry.id); }}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    );
                })
            )}

            {tab === 'HEALTH' && (
                dailyLogs.length === 0 ? <p className="text-center font-bold text-gray-400">NO LOGS.</p> :
                dailyLogs.map((log) => (
                    <div 
                        key={log.timestamp} 
                        className="border-2 border-black p-4 bg-orange-50 hover:bg-orange-100 transition-colors flex justify-between items-center"
                    >
                        <div>
                             <span className="font-black bg-black text-white px-2 text-sm block w-fit mb-1">{log.date}</span>
                             <div className="text-xs font-mono grid grid-cols-2 gap-x-4">
                                {log.weight && <span>W: {log.weight}kg</span>}
                                {log.sleepScore && <span>Sleep: {log.sleepScore}</span>}
                                {log.hrv && <span>HRV: {log.hrv}</span>}
                                {log.restingHr && <span>RHR: {log.restingHr}</span>}
                             </div>
                             {log.notes && <p className="text-xs italic mt-1 text-gray-600">"{log.notes}"</p>}
                        </div>
                        <button 
                            onClick={() => { if(confirm('Delete log?')) onDeleteLog(log.timestamp); }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default LogbookManager;