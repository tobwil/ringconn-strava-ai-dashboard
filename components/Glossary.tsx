import React, { useState } from 'react';
import NeoCard from './NeoCard';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const Glossary: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 font-bold text-sm bg-white border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
            >
                <HelpCircle className="w-4 h-4" />
                {isOpen ? 'HIDE DICTIONARY' : 'METRIC DICTIONARY'}
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isOpen && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4">
                    <NeoCard className="bg-yellow-100">
                        <h3 className="font-black text-lg mb-2">TRAINING METRICS</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Efficiency (EF):</strong> Power / HR. Higher is better.</p>
                            <p><strong>Zones:</strong> Z1 (Rec) to Z5 (VO2 Max). Time in zone drives adaptation.</p>
                            <p><strong>Fitness (CTL):</strong> 42-day avg load. "How much have I trained recently?"</p>
                            <p><strong>Fatigue (ATL):</strong> 7-day avg load. "How tired am I right now?"</p>
                        </div>
                    </NeoCard>
                    <NeoCard className="bg-blue-100">
                        <h3 className="font-black text-lg mb-2">RECOVERY (RINGCONN)</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>HRV:</strong> Heart Rate Variability. High = Fresh. Low = Stressed.</p>
                            <p><strong>RHR:</strong> Resting Heart Rate. Lower is generally better.</p>
                            <p><strong>SpO2:</strong> Blood Oxygen. Should be 95%+. Drops may indicate illness.</p>
                            <p><strong>Readiness (TSB):</strong> Fitness - Fatigue. Positive = Fresh. Negative = Overload.</p>
                        </div>
                    </NeoCard>
                    <NeoCard className="bg-green-100">
                        <h3 className="font-black text-lg mb-2">SLEEP SCORES</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Sleep Score:</strong> Overall quality (0-100).</p>
                            <p><strong>Deep Sleep:</strong> Physical restoration. Essential for muscles.</p>
                            <p><strong>REM Sleep:</strong> Mental restoration. Essential for focus/skill.</p>
                        </div>
                    </NeoCard>
                    <NeoCard className="bg-gray-100 col-span-1 md:col-span-3">
                        <h3 className="font-black text-lg mb-2">THE MATH (HOW IT WORKS)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div>
                                <p><strong>Daily Load (TRIMP):</strong> Based on Heart Rate Reserve.</p>
                                <p className="text-gray-500">Load = Duration * Ratio * 0.64 * e^(1.92 * Ratio)</p>
                            </div>
                            <div>
                                <p><strong>Fitness (CTL):</strong> 42-Day Weighted Average.</p>
                                <p className="text-gray-500">Today = Yesterday + (Load - Yesterday) * (1/42)</p>
                            </div>
                            <div>
                                <p><strong>Fatigue (ATL):</strong> 7-Day Weighted Average.</p>
                                <p className="text-gray-500">Today = Yesterday + (Load - Yesterday) * (1/7)</p>
                            </div>
                            <div>
                                <p><strong>Readiness (TSB):</strong> Simple Subtraction.</p>
                                <p className="text-gray-500">Form = Fitness - Fatigue</p>
                            </div>
                        </div>
                    </NeoCard>
                </div>
            )}
        </div>
    );
};

export default Glossary;