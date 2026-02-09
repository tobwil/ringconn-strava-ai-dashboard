import React, { useState } from 'react';
import NeoCard from './NeoCard';
import { X, Cpu, Upload, Lock, HelpCircle } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'START' | 'AI' | 'PRIVACY'>('START');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl border-4 border-black shadow-neo animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center bg-[#FFDE59] border-b-4 border-black p-4">
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <HelpCircle className="w-6 h-6" /> HELP & FAQ
                    </h2>
                    <button onClick={onClose} className="hover:bg-black hover:text-white p-1 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-4 border-black bg-gray-100">
                    <button
                        onClick={() => setActiveTab('START')}
                        className={`flex-1 p-3 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'START' ? 'bg-white text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        <Upload className="w-4 h-4" /> START
                    </button>
                    <button
                        onClick={() => setActiveTab('AI')}
                        className={`flex-1 p-3 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'AI' ? 'bg-white text-black' : 'text-gray-500 hover:bg-gray-200'} border-l-2 border-r-2 border-black`}
                    >
                        <Cpu className="w-4 h-4" /> AI & PROMPTS
                    </button>
                    <button
                        onClick={() => setActiveTab('PRIVACY')}
                        className={`flex-1 p-3 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'PRIVACY' ? 'bg-white text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        <Lock className="w-4 h-4" /> DATA & PRIVACY
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 h-[400px] overflow-y-auto">
                    {activeTab === 'START' && (
                        <div className="space-y-4">
                            <h3 className="font-black text-xl">Data Import Guide</h3>
                            <NeoCard className="bg-yellow-50 p-4 border-2 mb-4">
                                <p className="text-sm font-bold">This dashboard needs two things: Your Workouts (Strava) and your Recovery (RingConn).</p>
                            </NeoCard>

                            <h4 className="font-bold text-lg">1. Workouts (GPX)</h4>
                            <p className="text-sm">Go to "INPUTS" and drag & drop <code>.gpx</code> files. You can export these from Strava (Export Original) on their website.</p>

                            <h4 className="font-bold text-lg mt-4">2. Health Metrics (CSV)</h4>
                            <p className="text-sm">Export your data from the RingConn App as CSV. Import it in the "INPUTS" section.</p>

                            <h4 className="font-bold text-lg mt-4">3. Backup & Restore (JSON)</h4>
                            <p className="text-sm">In the Sidebar Settings (Gear Icon), you can:</p>
                            <ul className="list-disc list-inside text-sm ml-2">
                                <li><strong>EXPORT:</strong> Save a full backup of your database (IndexedDB).</li>
                                <li><strong>RESTORE:</strong> Load a backup JSON file to restore everything.</li>
                            </ul>
                            <NeoCard className="bg-blue-50 p-4 border-2 mt-4">
                                <p className="text-sm font-bold">Use this to move data between devices or browsers!</p>
                            </NeoCard>
                        </div>
                    )}

                    {activeTab === 'AI' && (
                        <div className="space-y-4">
                            <h3 className="font-black text-xl">AI Logic & Prompts</h3>
                            <p className="text-sm">
                                The AI features are <strong>optional</strong>. The dashboard calculates all metrics (Fitness, Fatigue, Trends) locally without an API Key.
                            </p>
                            <p className="text-sm">
                                If you enable AI, we use <strong>Google Gemini 2.5 Flash</strong>. We want you to know exactly what it sees.
                            </p>

                            <div className="border-2 border-black p-3 bg-gray-50">
                                <h4 className="font-bold flex items-center gap-2 mb-2"><Cpu className="w-4 h-4" /> What Data is Sent?</h4>
                                <ul className="text-xs space-y-1">
                                    <li>✅ <strong>USED:</strong> Date, Efficiency (Power/HR), Duration, HR Zones, Sleep Score, HRV, RHR, SpO2, Stress.</li>
                                    <li>❌ <strong>IGNORED:</strong> GPS Coordinates, Temperature, Equipment, Calories (mostly).</li>
                                </ul>
                            </div>

                            <div className="border-2 border-black p-3 bg-gray-50 mt-4">
                                <h4 className="font-bold flex items-center gap-2 mb-2"><Cpu className="w-4 h-4" /> The "System Prompt"</h4>
                                <p className="text-xs mb-2">This is the exact instruction sent to the AI (Google Gemini):</p>
                                <div className="bg-black text-white p-2 text-[10px] font-mono rounded overflow-x-auto">
                                    "Role: Head Coach. Goal: [User Goal].<br />
                                    Data: Last 20 Trainings + Last 7 Days Health Avg (Sleep, HRV).<br />
                                    Task: Create a strategic status report.<br />
                                    1. Status: ON TRACK / BEHIND / AT RISK.<br />
                                    2. Trajectory: Is fitness (Efficiency) rising?<br />
                                    3. Weakness: What is missing? (e.g. Zone 2)<br />
                                    4. Focus: Command for next week."
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PRIVACY' && (
                        <div className="space-y-4">
                            <h3 className="font-black text-xl">Your Data is Yours</h3>
                            <p className="text-sm">
                                This application is <strong>Local-First</strong>.
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm font-medium">
                                <li>All health and training data is stored in your browser (IndexedDB).</li>
                                <li>No data is sent to any external server <strong>except</strong> when you strictly request an AI Analysis.</li>
                                <li>Your API Key is stored encrypted in your browser.</li>
                            </ul>
                            <NeoCard className="bg-red-50 mt-4 p-4 border-2">
                                <p className="text-xs font-bold text-red-800">WARNING: Clearing your browser data will delete your dashboard history. Use "EXPORT DATA" regularly to create backups.</p>
                            </NeoCard>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
