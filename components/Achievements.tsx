import React from 'react';
import NeoCard from './NeoCard';
import { HistoryEntry } from '../types';
import { Trophy, Mountain, Map, CheckCircle, Lock, Star } from 'lucide-react';

interface AchievementsProps {
  history: HistoryEntry[];
}

const DISTANCE_MILESTONES = [
    { name: "Marathon", value: 42, unit: "km" },
    { name: "London to Paris", value: 460, unit: "km" },
    { name: "Italy Top-to-Bottom", value: 1200, unit: "km" },
    { name: "Route 66", value: 3940, unit: "km" },
    { name: "Great Wall of China", value: 21196, unit: "km" },
    { name: "Earth Equator", value: 40075, unit: "km" },
    { name: "Distance to Moon", value: 384400, unit: "km" },
];

const ELEVATION_MILESTONES = [
    { name: "Burj Khalifa", value: 828, unit: "m" },
    { name: "Mount Olympus", value: 2917, unit: "m" },
    { name: "Mont Blanc", value: 4807, unit: "m" },
    { name: "Kilimanjaro", value: 5895, unit: "m" },
    { name: "Mount Everest", value: 8848, unit: "m" },
    { name: "Mariana Trench Depth", value: 11034, unit: "m" },
    { name: "Olympus Mons (Mars)", value: 21229, unit: "m" },
    { name: "Space (Karman Line)", value: 100000, unit: "m" },
];

const LEVELS = [
    { name: "ROOKIE", xp: 0 },
    { name: "AMATEUR", xp: 1000 },
    { name: "SEMI-PRO", xp: 5000 },
    { name: "PRO", xp: 15000 },
    { name: "ELITE", xp: 50000 },
    { name: "LEGEND", xp: 150000 },
    { name: "GOAT", xp: 500000 },
];

const Achievements: React.FC<AchievementsProps> = ({ history }) => {
  const totalDist = history.reduce((acc, curr) => acc + curr.distanceKm, 0);
  const totalEle = history.reduce((acc, curr) => acc + curr.totalElevationGain, 0);

  // Simple XP Calc: 1km = 10xp, 100m ele = 20xp
  const xp = Math.floor((totalDist * 10) + (totalEle / 100 * 20));
  
  // Current Level Logic
  const currentLevelIndex = LEVELS.findIndex((l, i) => xp >= l.xp && (i === LEVELS.length - 1 || xp < LEVELS[i+1].xp));
  const nextLevel = LEVELS[currentLevelIndex + 1];
  const xpProgress = nextLevel 
    ? ((xp - LEVELS[currentLevelIndex].xp) / (nextLevel.xp - LEVELS[currentLevelIndex].xp)) * 100 
    : 100;

  const renderMilestoneList = (currentValue: number, milestones: typeof DISTANCE_MILESTONES, icon: React.ReactNode, color: string, title: string) => {
    return (
        <NeoCard className="relative overflow-hidden h-full" color="#FFFFFF">
             <div className={`absolute top-0 left-0 w-2 h-full`} style={{backgroundColor: color}}></div>
             <div className="pl-4">
                 <div className="flex items-center gap-2 mb-6">
                    {icon}
                    <h3 className="font-black text-xl">{title}</h3>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {milestones.map((m, idx) => {
                        const isUnlocked = currentValue >= m.value;
                        const isNext = !isUnlocked && (idx === 0 || currentValue >= milestones[idx - 1].value);

                        return (
                            <div 
                                key={m.name} 
                                className={`
                                    border-2 p-3 transition-all
                                    ${isUnlocked ? 'border-black bg-white opacity-100' : 'border-gray-300 bg-gray-50 opacity-50'}
                                    ${isNext ? 'ring-2 ring-offset-2 ring-black opacity-100' : ''}
                                `}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm flex items-center gap-2">
                                        {isUnlocked ? <CheckCircle className="w-4 h-4 text-green-500"/> : <Lock className="w-3 h-3"/>}
                                        {m.name}
                                    </span>
                                    <span className="font-mono text-xs">{m.value} {m.unit}</span>
                                </div>
                                
                                {isNext && (
                                     <div className="w-full bg-gray-200 h-2 mt-2 border border-gray-400">
                                        <div 
                                            className="h-full transition-all duration-1000" 
                                            style={{ width: `${Math.min(100, (currentValue / m.value) * 100)}%`, backgroundColor: color }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
             </div>
        </NeoCard>
    );
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-8">
        {/* RANK SECTION */}
        <NeoCard color="#000000" className="text-white">
            <div className="mb-6 flex justify-between items-center">
                 <h2 className="text-2xl font-black text-[#FFDE59] italic tracking-tighter">PLAYER RANK</h2>
                 <span className="font-mono font-bold text-sm">TOTAL XP: {xp.toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {LEVELS.map((level, i) => {
                    const isUnlocked = xp >= level.xp;
                    const isCurrent = i === currentLevelIndex;
                    
                    return (
                        <div 
                            key={level.name}
                            className={`
                                border-2 p-4 text-center relative overflow-hidden transition-all
                                ${isUnlocked ? 'border-white bg-[#1e1e1e]' : 'border-gray-700 bg-black text-gray-400'}
                                ${isCurrent ? 'ring-4 ring-[#FFDE59] ring-offset-4 ring-offset-black bg-gray-900' : ''}
                            `}
                        >
                            {isCurrent && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#FFDE59]"></div>
                            )}
                            <h3 className={`font-black text-lg ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{level.name}</h3>
                            <p className="text-xs font-mono">{level.xp > 0 ? `${level.xp / 1000}k` : '0'} XP</p>
                            
                            {isCurrent && nextLevel && (
                                <div className="mt-2 w-full bg-gray-700 h-1">
                                    <div 
                                        className="h-full bg-[#FFDE59]" 
                                        style={{ width: `${xpProgress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </NeoCard>

        {/* MILESTONES SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderMilestoneList(totalDist, DISTANCE_MILESTONES, <Map className="w-6 h-6"/>, '#5454FF', 'DISTANCE CLUB')}
            {renderMilestoneList(totalEle, ELEVATION_MILESTONES, <Mountain className="w-6 h-6"/>, '#FF66C4', 'CLIMBING CLUB')}
        </div>
    </div>
  );
};

export default Achievements;