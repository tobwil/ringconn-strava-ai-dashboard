import React, { useState, useEffect, useCallback } from 'react';
import { ActivitySummary, ManualEntryData, GeminiAnalysisResult, AppView, UserProfile, HistoryEntry, GlobalCoachResult, DailyLog } from './types';
import { parseGPX } from './services/gpxParser';
import { parseRingConnCSV } from './services/csvParser';
import { analyzeHealthData, analyzeGlobalProgress } from './services/geminiService';
import { getUserProfile, getHistory, addToHistory, saveUserProfile, clearData, calculateAge, getDaysUntil, getDailyLogs, deleteActivity, deleteDailyLog, migrateFromLocalStorage, exportAllData, saveBulkDailyLogs } from './services/storage';
import { MOCK_MANUAL_DATA } from './constants';

import NeoCard from './components/NeoCard';
import NeoButton from './components/NeoButton';
import FileUpload from './components/FileUpload';
import Charts from './components/Charts';
import ZoneChart from './components/ZoneChart';
import Onboarding from './components/Onboarding';
import TrendCharts from './components/TrendCharts';
import DailyCheckIn from './components/DailyCheckIn';
import StatsOverview from './components/StatsOverview';
import HealthCharts from './components/HealthCharts';
import LogbookManager from './components/LogbookManager';
import Glossary from './components/Glossary';
import CalendarHeatmap from './components/CalendarHeatmap';
import CorrelationLab from './components/CorrelationLab';
import Sidebar from './components/Sidebar';
import Achievements from './components/Achievements';
import FitnessChart from './components/FitnessChart';
import { ToastContainer, Toast, ToastType } from './components/Toast';
import { calculateFitnessMetrics, FitnessMetric } from './services/trainingLoad';

import { Heart, Activity, Zap, Brain, Upload, ArrowLeft, Trash2, Target, BarChart2, TrendingUp, Edit2, Mountain, X } from 'lucide-react';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>(AppView.ONBOARDING);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [fitnessMetrics, setFitnessMetrics] = useState<FitnessMetric[]>([]);


    const [globalCoach, setGlobalCoach] = useState<GlobalCoachResult | null>(null);
    const [coachLoading, setCoachLoading] = useState(false);

    const [activity, setActivity] = useState<ActivitySummary | null>(null);
    const [manualData, setManualData] = useState<ManualEntryData>(MOCK_MANUAL_DATA);
    const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    // Toast State
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        const init = async () => {
            try {
                await migrateFromLocalStorage();
                await refreshData();
            } catch (e: any) {
                console.error("Initialization failed:", e);
                setError(`Failed to initialize app: ${e.message}`);
                addToast("Critical Error: Failed to load data.", 'error');
            } finally {
                setIsInitializing(false);
            }
        };
        init();
    }, []);

    const refreshData = async () => {
        try {
            const profile = await getUserProfile();
            const loadedHistory = await getHistory();
            const loadedLogs = await getDailyLogs();
            setHistory(loadedHistory);
            setDailyLogs(loadedLogs);

            // Calculate Fitness
            if (loadedHistory.length > 0) {
                const metrics = calculateFitnessMetrics(loadedHistory, profile || undefined);
                setFitnessMetrics(metrics);
            }

            if (profile) {
                setUserProfile(profile);
                if (view === AppView.ONBOARDING) setView(AppView.DASHBOARD);
            } else {
                setView(AppView.ONBOARDING);
            }
        } catch (e) {
            console.error("Failed to refresh data", e);
            addToast("Error loading data from database.", 'error');
        }
    };

    const handleOnboardingComplete = async (profile: UserProfile) => {
        // Save is handled within Onboarding component usually? 
        // Actually no, Onboarding usually calls a prop.
        // Let's check Onboarding component later. 
        // Ideally Onboarding should pass the profile back and we save it.
        // But currently Onboarding might be saving it itself strictly speaking?
        // Let's assume we need to save here or update state.

        // In original code: setUserProfile(profile); view(DASHBOARD);
        // Onboarding likely called saveUserProfile internally? 
        // I will double check Onboarding.tsx in next steps.
        // For now assuming Onboarding handles saving or we do it here.
        // Let's explicitly save here to be safe if Onboarding just returns data.

        // Wait, storage.ts says saveUserProfile matches UserProfile arg.
        await saveUserProfile(profile);
        setUserProfile(profile);
        setIsEditingProfile(false);
        setView(AppView.DASHBOARD);
        addToast("Profile initialized. Welcome aboard.", 'success');
    };

    // Wrapper for profile update from Sidebar/Settings
    const handleProfileUpdate = async (updatedProfile: UserProfile) => {
        await saveUserProfile(updatedProfile);
        setUserProfile(updatedProfile);
        addToast("Profile updated successfully.", 'success');
    };

    const handleFileUpload = async (content: string, filename: string) => {
        try {
            if (filename.toLowerCase().endsWith('.csv')) {
                // RingConn Import
                const logs = parseRingConnCSV(content);
                if (logs.length > 0) {
                    await saveBulkDailyLogs(logs);
                    await refreshData();
                    addToast(`Imported ${logs.length} daily logs from RingConn.`, 'success');
                } else {
                    addToast("No valid logs found in CSV.", 'error');
                }
            } else {
                // Strava GPX Import
                const parsed = parseGPX(content);
                await addToHistory(parsed);
                await refreshData();
                setActivity(parsed);
                setAnalysis(null);
                setView(AppView.ANALYSIS);
                addToast("Activity imported successfully.", 'success');
            }
        } catch (e: any) {
            console.error(e);
            addToast(`Error parsing file: ${e.message}`, 'error');
        }
    };

    const handleSelectHistoryItem = (entry: HistoryEntry) => {
        const summaryActivity: ActivitySummary = {
            ...entry,
            points: entry.points || []
        };
        setActivity(summaryActivity);
        setAnalysis(entry.aiAnalysis || null);
        setView(AppView.ANALYSIS);
    };

    const handleDeleteActivity = async (id: string) => {
        await deleteActivity(id);
        await refreshData();
        addToast("Activity deleted.", 'info');
    };

    const handleDeleteLog = async (timestamp: number) => {
        await deleteDailyLog(timestamp);
        await refreshData();
        addToast("Daily log entry deleted.", 'info');
    };

    const handleAnalyze = async () => {
        if (!activity || !userProfile) return;
        setLoading(true);
        setError(null);
        try {
            // Find finding daily log for this activity
            const logDate = activity.date.split(' ')[0]; // YYYY-MM-DD
            const relevantLog = dailyLogs.find(l => l.date === logDate);

            const result = await analyzeHealthData(activity, manualData, userProfile.mainGoal, history, relevantLog, userProfile.language);
            setAnalysis(result);

            // Re-save activity with analysis (if we had a way to update it in history without full re-write, 
            // but currently history items don't store full analysis? Actually types say they do.
            // Let's simplified and just show it.)

        } catch (e: any) {
            console.error(e);
            setError(e.message || "AI Analysis Failed");
            addToast(e.message || "AI Analysis failed.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalCoach = async () => {
        if (!userProfile?.mainGoal) return;
        setCoachLoading(true);
        try {
            const result = await analyzeGlobalProgress(history, dailyLogs, userProfile.mainGoal, userProfile.language);
            setGlobalCoach(result);
            addToast("Coach analysis complete.", 'success');
        } catch (e: any) {
            console.error(e);
            addToast("Coach failed to think. Check API Key.", 'error');
        } finally {
            setCoachLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const data = await exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `neo-health-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast("Data exported successfully.", 'success');
        } catch (e: any) {
            console.error("Export failed:", e);
            addToast("Failed to export data.", 'error');
        }
    };

    const handleReset = async () => {
        if (confirm("Delete all data? This cannot be undone.")) {
            await clearData();
            window.location.reload();
        }
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-xl font-black">INITIALIZING DATABASE...</p>
                </div>
            </div>
        );
    }

    if (view === AppView.ONBOARDING) {
        return (
            <div className="min-h-screen p-4 bg-[#f7f7f7]">
                <Onboarding onComplete={handleOnboardingComplete} />
                <ToastContainer toasts={toasts} removeToast={removeToast} />
            </div>
        );
    }

    const daysLeft = userProfile?.missionDeadline ? getDaysUntil(userProfile.missionDeadline) : null;

    return (
        <div className="min-h-screen bg-[#f7f7f7] flex flex-col md:flex-row">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {isEditingProfile && userProfile && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                        <Onboarding onComplete={handleOnboardingComplete} existingProfile={userProfile} />
                        <button
                            onClick={() => setIsEditingProfile(false)}
                            className="absolute top-4 right-8 z-50 bg-black text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            title="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {userProfile && (
                <Sidebar
                    currentView={view === AppView.ANALYSIS ? AppView.DASHBOARD : view}
                    onChangeView={setView}
                    userProfile={userProfile}
                    onReset={handleReset}
                    onExport={handleExport}
                    onUpdateProfile={handleProfileUpdate}
                    onEditProfile={() => setIsEditingProfile(true)}
                />
            )}

            <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">

                {/* VIEW: DASHBOARD */}
                {view === AppView.DASHBOARD && userProfile && (
                    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">

                        <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
                            <div>
                                <h2 className="text-4xl font-black mb-1">DASHBOARD</h2>
                                {daysLeft !== null && (
                                    <span className={`font-mono font-bold ${daysLeft < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                        {daysLeft < 0 ? 'DEADLINE PASSED' : `${daysLeft} DAYS LEFT TO MISSION END`}
                                    </span>
                                )}
                            </div>
                        </div>

                        <StatsOverview history={history} logs={dailyLogs} />

                        <div className="mb-10">
                            {globalCoach ? (
                                <NeoCard className="bg-white border-4 border-[#5454FF]" color="#FFFFFF">
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-2xl font-black flex items-center gap-2">
                                            <Brain className="w-8 h-8" /> STRATEGIC REPORT
                                        </h2>
                                        <div className={`px-4 py-2 font-bold text-white text-xl ${globalCoach.status === 'ON TRACK' ? 'bg-green-500' :
                                            globalCoach.status === 'BEHIND' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}>
                                            {globalCoach.status}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <h3 className="font-bold underline mb-1">TRAJECTORY</h3>
                                            <p>{globalCoach.trajectoryAnalysis}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-bold underline mb-1">WEAKNESS</h3>
                                            <p>{globalCoach.keyWeakness}</p>
                                        </div>
                                        <div className="bg-white p-4 border-2 border-black shadow-neo-sm">
                                            <h3 className="font-bold text-[#5454FF] mb-1">NEXT WEEK FOCUS</h3>
                                            <p className="font-bold text-lg">{globalCoach.focusNextWeek}</p>
                                        </div>
                                    </div>
                                </NeoCard>
                            ) : (
                                <div className="flex justify-start mb-8">
                                    {history.length > 2 && (
                                        <NeoButton onClick={handleGlobalCoach} disabled={coachLoading} className="flex gap-2">
                                            {coachLoading ? 'THINKING...' : <><TrendingUp /> ANALYZE OVERALL PROGRESS</>}
                                        </NeoButton>
                                    )}
                                </div>
                            )}
                        </div>

                        <Glossary />

                        <div className="grid grid-cols-1 gap-8 mb-8">
                            <CalendarHeatmap history={history} logs={dailyLogs} />
                            <CorrelationLab history={history} logs={dailyLogs} />

                            <div>
                                <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                                    <Heart className="w-6 h-6" /> HEALTH & RECOVERY
                                </h2>
                                {dailyLogs.length > 0 ? (
                                    <HealthCharts logs={dailyLogs} userProfile={userProfile} />
                                ) : (
                                    <NeoCard color="#FFFFFF" className="text-center py-8">
                                        <p className="font-bold text-gray-500">NO HEALTH LOGS YET.</p>
                                    </NeoCard>
                                )}
                            </div>

                            <div>
                                <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                                    <Activity className="w-6 h-6" /> TRAINING TRENDS
                                </h2>

                                {/* Fitness & Freshness */}
                                {history.length > 0 && fitnessMetrics.length > 0 && (
                                    <FitnessChart data={fitnessMetrics} />
                                )}

                                {history.length > 0 ? (
                                    <TrendCharts history={history} />
                                ) : (
                                    <NeoCard color="#FFFFFF" className="text-center py-12">
                                        <p className="font-bold text-gray-500">NO ACTIVITIES LOGGED YET.</p>
                                    </NeoCard>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: INPUTS */}
                {view === AppView.INPUTS && (
                    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
                        <h2 className="text-4xl font-black mb-8 border-b-4 border-black pb-4">DATA INPUT</h2>
                        <div className="space-y-8">
                            <FileUpload onFileSelect={handleFileUpload} />
                            <DailyCheckIn
                                userProfile={userProfile!}
                                onUpdate={refreshData}
                                addToast={addToast}
                            />
                        </div>
                    </div>
                )}

                {/* VIEW: LOGBOOK */}
                {view === AppView.LOGBOOK && (
                    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
                        <h2 className="text-4xl font-black mb-8 border-b-4 border-black pb-4">LOGBOOK</h2>
                        <LogbookManager
                            history={history}
                            dailyLogs={dailyLogs}
                            onSelectActivity={handleSelectHistoryItem}
                            onDeleteActivity={handleDeleteActivity}
                            onDeleteLog={handleDeleteLog}
                        />
                    </div>
                )}

                {/* VIEW: ACHIEVEMENTS */}
                {view === AppView.ACHIEVEMENTS && (
                    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
                        <h2 className="text-4xl font-black mb-8 border-b-4 border-black pb-4">LEVELS & MILESTONES</h2>
                        <Achievements history={history} />
                    </div>
                )}

                {/* VIEW: ANALYSIS */}
                {view === AppView.ANALYSIS && activity && (
                    <div className="animate-in slide-in-from-right-8 duration-500 max-w-5xl mx-auto">
                        <div className="mb-8">
                            <NeoButton onClick={() => setView(AppView.DASHBOARD)} variant="secondary" className="text-xs px-4 py-2 mb-4 flex items-center gap-2 shadow-neo-sm">
                                <ArrowLeft className="w-4 h-4" /> BACK TO DASHBOARD
                            </NeoButton>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <h2 className="text-3xl md:text-5xl font-black bg-[#FFDE59] px-4 py-2 border-4 border-black shadow-neo break-words max-w-full">
                                    DEEP DIVE: {activity.date}
                                </h2>
                                {activity.points.length === 0 && (
                                    <span className="font-mono text-gray-500 text-sm font-bold bg-white px-2 py-1 border border-black">ARCHIVE VIEW</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <NeoCard className="flex flex-col items-center justify-center text-center" color="#FFFFFF">
                                <Heart className="w-8 h-8 mb-2" />
                                <span className="text-xs font-bold">AVG HR</span>
                                <span className="text-4xl font-black">{activity.avgHr}</span>
                            </NeoCard>
                            <NeoCard className="flex flex-col items-center justify-center text-center" color="#FFFFFF">
                                <Zap className="w-8 h-8 mb-2" />
                                <span className="text-xs font-bold">AVG POWER</span>
                                <span className="text-4xl font-black">{activity.avgPower}</span>
                            </NeoCard>
                            <NeoCard className="flex flex-col items-center justify-center text-center" color="#FFFFFF">
                                <BarChart2 className="w-8 h-8 mb-2" />
                                <span className="text-xs font-bold">EFFICIENCY</span>
                                <span className="text-4xl font-black">{activity.efficiency}</span>
                            </NeoCard>
                            <NeoCard className="flex flex-col items-center justify-center text-center" color="#FFFFFF">
                                <Mountain className="w-8 h-8 mb-2" />
                                <span className="text-xs font-bold">ELEVATION</span>
                                <span className="text-4xl font-black">{activity.totalElevationGain}<span className="text-lg">m</span></span>
                            </NeoCard>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Chart Area */}
                            <div className="lg:col-span-2 space-y-8">
                                {activity.points.length > 0 ? (
                                    <Charts data={activity.points} />
                                ) : (
                                    <NeoCard className="p-8 text-center" color="#f0f0f0">
                                        <p className="font-bold text-gray-500">DETAILED TIMELINE NOT AVAILABLE IN ARCHIVE.</p>
                                        <p className="text-sm">Re-upload GPX file to see second-by-second breakdown.</p>
                                    </NeoCard>
                                )}

                                <ZoneChart zones={activity.hrZones} />

                                {analysis ? (
                                    <div className="animate-in slide-in-from-bottom-10 fade-in duration-700">
                                        <NeoCard title="SESSION AUDIT" color="#FFFFFF">
                                            <div className="space-y-6">
                                                <div className="bg-black text-white p-4 font-bold text-lg border-2 border-dashed border-white">
                                                    "{analysis.tone}"
                                                </div>

                                                <div className="border-4 border-black p-4 bg-white shadow-neo-sm">
                                                    <div className="flex items-center gap-2 mb-2 text-[#00F0FF]">
                                                        <Target className="w-6 h-6" />
                                                        <h3 className="font-black text-lg text-black">IMPACT ON GOAL</h3>
                                                    </div>
                                                    <p className="font-bold text-lg leading-tight">{analysis.progressCheck}</p>
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-bold bg-[#FFDE59] inline-block px-2 mb-2 border-2 border-black">SUMMARY</h3>
                                                    <p className="text-lg leading-relaxed">{analysis.summary}</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold bg-white inline-block px-2 mb-2 border-2 border-black">INSIGHTS</h3>
                                                        <ul className="list-disc list-inside space-y-2 font-medium">
                                                            {analysis.insights.map((insight, i) => (
                                                                <li key={i}>{insight}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold bg-[#FF66C4] inline-block px-2 mb-2 border-2 border-black">NEXT STEPS</h3>
                                                        <ul className="list-decimal list-inside space-y-2 font-medium">
                                                            {analysis.recommendations.map((rec, i) => (
                                                                <li key={i}>{rec}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </NeoCard>
                                    </div>
                                ) : (
                                    <div className="flex justify-center p-8">
                                        {!loading ? (
                                            <NeoButton onClick={handleAnalyze} className="w-full md:w-auto text-xl py-6 flex items-center justify-center gap-3">
                                                <Brain className="w-8 h-8" /> AUDIT THIS SESSION
                                            </NeoButton>
                                        ) : (
                                            <div className="text-center">
                                                <div className="inline-block w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <p className="text-2xl font-black animate-pulse">ANALYZING...</p>
                                            </div>
                                        )}
                                        {error && <p className="text-red-600 font-bold mt-4 bg-white border-2 border-red-600 p-2">{error}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <NeoCard title="SESSION METADATA" color="#ffffff">
                                    <table className="w-full text-left font-mono text-sm">
                                        <tbody>
                                            <tr className="border-b-2 border-gray-200"><th className="py-2">Date</th><td className="text-right">{activity.date}</td></tr>
                                            <tr className="border-b-2 border-gray-200"><th className="py-2">Time in Z4+</th><td className="text-right">{activity.hrZones.z4 + activity.hrZones.z5} min</td></tr>
                                            <tr className="border-b-2 border-gray-200"><th className="py-2">Efficiency</th><td className="text-right">{activity.efficiency}</td></tr>
                                            <tr className="border-b-2 border-gray-200"><th className="py-2">Distance</th><td className="text-right">{activity.distanceKm} km</td></tr>
                                        </tbody>
                                    </table>
                                </NeoCard>

                                <div className="p-4 border-4 border-black bg-[#8C52FF] text-white shadow-neo">
                                    <h3 className="font-bold text-2xl mb-2">DID YOU KNOW?</h3>
                                    <p className="text-sm">Efficiency Factor (Avg Power / Avg HR) is a key indicator of aerobic fitness. If it goes up, you are getting faster for the same effort.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;