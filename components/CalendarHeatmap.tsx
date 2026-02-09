import React from 'react';
import { HistoryEntry, DailyLog } from '../types';
import NeoCard from './NeoCard';

interface CalendarHeatmapProps {
  history: HistoryEntry[];
  logs: DailyLog[];
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ history, logs }) => {
  // Config
  const numWeeks = 24; // Approx 6 months
  const boxSize = "w-3 h-3 md:w-4 md:h-4";
  
  // Data Preparation
  const today = new Date();
  const weeks: { days: Date[]; monthLabel?: string }[] = [];
  
  // Align start date to the Sunday X weeks ago
  const endDate = new Date(today);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (numWeeks * 7));
  
  // Adjust to previous Sunday to ensure rows align (Sunday to Saturday)
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  // Fast Lookups
  const activityMap = new Set(history.map(h => new Date(h.timestamp).toDateString()));
  const logMap = new Set(logs.map(l => new Date(l.timestamp).toDateString()));

  let currentLoopDate = new Date(startDate);

  for (let w = 0; w < numWeeks; w++) {
    const weekDays: Date[] = [];
    let monthLabel = undefined;

    for (let d = 0; d < 7; d++) {
        // Capture Month Label on the first week or when month changes 
        // We check if the Monday of this week starts a new month for better visual alignment
        if (d === 0) {
            const currentMonth = currentLoopDate.toLocaleString('default', { month: 'short' });
            const prevWeekDate = new Date(currentLoopDate);
            prevWeekDate.setDate(prevWeekDate.getDate() - 7);
            const prevMonth = prevWeekDate.toLocaleString('default', { month: 'short' });
            
            if (w === 0 || currentMonth !== prevMonth) {
                monthLabel = currentMonth;
            }
        }

        weekDays.push(new Date(currentLoopDate));
        currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }
    weeks.push({ days: weekDays, monthLabel });
  }

  return (
    <NeoCard title="CONSISTENCY GRID" color="#FFFFFF" expandable={true} initialOpen={true}>
      <div className="flex flex-col overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex min-w-max">
            {/* Y-Axis Labels (Days) */}
            <div className="flex flex-col justify-end gap-1 mr-2 pb-6 text-[9px] md:text-[10px] font-bold text-gray-400 leading-none pt-4">
                <span className="h-3 md:h-4"></span> {/* Sun */}
                <span className="h-3 md:h-4 flex items-center">Mon</span>
                <span className="h-3 md:h-4"></span>
                <span className="h-3 md:h-4 flex items-center">Wed</span>
                <span className="h-3 md:h-4"></span>
                <span className="h-3 md:h-4 flex items-center">Fri</span>
                <span className="h-3 md:h-4"></span>
            </div>

            {/* The Grid */}
            <div className="flex flex-col">
                {/* X-Axis Labels (Months) */}
                <div className="flex gap-1 mb-1 h-4 relative">
                    {weeks.map((week, i) => (
                        <div key={i} className={`w-3 md:w-4 gap-1 text-[9px] md:text-[10px] font-bold text-gray-500`}>
                            {week.monthLabel && <span>{week.monthLabel}</span>}
                        </div>
                    ))}
                </div>

                {/* Heatmap Columns */}
                <div className="flex gap-1">
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-1">
                            {week.days.map((d, dIndex) => {
                                const dateStr = d.toDateString();
                                const hasActivity = activityMap.has(dateStr);
                                const hasLog = logMap.has(dateStr);

                                let bg = 'bg-gray-100 border-gray-200';
                                if (hasActivity && hasLog) bg = 'bg-black border-black';
                                else if (hasActivity) bg = 'bg-[#5454FF] border-black';
                                else if (hasLog) bg = 'bg-[#FF914D] border-black';
                                else bg = 'bg-gray-100 border-gray-300'; 

                                const isFuture = d > today;
                                if (isFuture) bg = 'opacity-0';

                                return (
                                    <div 
                                        key={dIndex} 
                                        className={`${boxSize} border ${bg} transition-all hover:scale-125`}
                                        title={`${d.toLocaleDateString()}: ${hasActivity ? 'Training ' : ''}${hasLog ? 'Log' : ''}`}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex gap-4 mt-4 text-[10px] md:text-xs font-bold text-gray-500 justify-end">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-100 border border-gray-300"></div> NONE</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#5454FF] border border-black"></div> TRAINING</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#FF914D] border border-black"></div> LOG</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-black border border-black"></div> BOTH</div>
          </div>
      </div>
    </NeoCard>
  );
};

export default CalendarHeatmap;