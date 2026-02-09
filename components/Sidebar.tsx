import React, { useState } from 'react';
import { AppView, UserProfile } from '../types';
import { LayoutDashboard, Upload, BookOpen, Trophy, LogOut, User, Key, Save, Edit2, HelpCircle, Globe, Database, Settings } from 'lucide-react';
import HelpModal from './HelpModal';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  userProfile: UserProfile;
  onReset: () => void;
  onExport: () => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onEditProfile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userProfile, onReset, onExport, onUpdateProfile, onEditProfile }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [apiKey, setApiKey] = useState(userProfile.apiKey || '');
  const [isSaving, setIsSaving] = useState(false);

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'DASHBOARD', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: AppView.INPUTS, label: 'INPUTS', icon: <Upload className="w-5 h-5" /> },
    { id: AppView.LOGBOOK, label: 'LOGBOOK', icon: <BookOpen className="w-5 h-5" /> },
    { id: AppView.ACHIEVEMENTS, label: 'LEVELS', icon: <Trophy className="w-5 h-5" /> },
  ];

  const handleSaveKey = async () => {
    if (!onUpdateProfile) return;
    setIsSaving(true);
    await onUpdateProfile({ ...userProfile, apiKey: apiKey.trim() });
    setIsSaving(false);
    setShowSettings(false);
  };

  return (
    <div className="w-full md:w-64 bg-white border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col justify-between shrink-0">
      <div>
        <div className="p-6 border-b-4 border-black bg-[#FFDE59]">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none">
            MISSION<br />COMPLETE
          </h1>
        </div>

        <div className="p-4 border-b-4 border-black bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mb-1 overflow-hidden">
              <User className="w-4 h-4 shrink-0" />
              <span className="font-bold text-sm truncate">{userProfile.name.toUpperCase()}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={onEditProfile}
                className="text-xs hover:bg-gray-200 p-1 rounded flex items-center gap-1"
                title="Edit Mission/Goal"
              >
                <span className="text-[10px] font-bold">EDIT</span>
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`text-xs p-1 rounded transition-colors ${showSettings ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
                title="Settings (API, Language, Backup)"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="font-mono text-xs text-gray-600 truncate mb-2">
            {userProfile.mainGoal}
          </div>

          {showSettings && (
            <div className="mt-2 text-xs border-t border-gray-300 pt-2 animate-in slide-in-from-top-2">
              <label className="font-bold block mb-1 flex items-center gap-1">
                <Key className="w-3 h-3" /> AI API KEY
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full p-1 border border-black mb-1 font-mono text-xs"
              />
              <button
                onClick={handleSaveKey}
                disabled={isSaving}
                className="w-full bg-black text-white py-1 font-bold flex items-center justify-center gap-1 hover:bg-gray-800 disabled:opacity-50"
              >
                {isSaving ? 'SAVING...' : <><Save className="w-3 h-3" /> SAVE KEY</>}
              </button>
              <p className="text-[9px] text-gray-500 mt-1 leading-tight">
                Your key is stored locally in your browser database.
              </p>
              <label className="font-bold block mb-1 flex items-center gap-1 mt-2">
                <Globe className="w-3 h-3" /> AI LANGUAGE
              </label>
              <select
                value={userProfile.language || 'en'}
                onChange={async (e) => {
                  if (onUpdateProfile) {
                    await onUpdateProfile({ ...userProfile, language: e.target.value as any });
                  }
                }}
                className="w-full p-1 border border-black mb-1 font-mono text-xs bg-white"
              >
                <option value="en">ENGLISH</option>
                <option value="de">DEUTSCH</option>
                <option value="es">ESPAÑOL</option>
                <option value="fr">FRANÇAIS</option>
              </select>

              <label className="font-bold block mb-1 flex items-center gap-1 mt-2">
                <Database className="w-3 h-3" /> DATA BACKUP
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => document.getElementById('restore-input')?.click()}
                  className="flex-1 bg-red-100 text-red-900 border border-red-300 py-1 font-bold flex items-center justify-center gap-1 hover:bg-red-200"
                >
                  <Upload className="w-3 h-3" /> RESTORE
                </button>
                <input
                  id="restore-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    // We need a way to call importBackup here. 
                    // Since Sidebar doesn't have direct access to services usually, 
                    // we might need to pass a handler or just import it directly since this is a simple client-side app.
                    // Ideally strictly passed via props, but for now direct import is pragmatic.
                    // Actually, let's keep it clean. We will emit an event or handled locally? 
                    // Checking imports... Sidebar usually imports types. 
                    // I will import importBackup from services/storage.
                    if (confirm("Restore will OVERWRITE all current data. Continue?")) {
                      const { importBackup } = await import('../services/storage');
                      const success = await importBackup(text);
                      if (success) {
                        onReset(); // Trigger reload/reset (actually onReset clears data, we want reload. 
                        // Ideally we reload window
                        window.location.reload();
                      } else {
                        alert("Import failed. Check file format.");
                      }
                    }
                  }}
                />
              </div>

            </div>
          )}
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`
                flex items-center gap-3 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap md:whitespace-normal
                ${currentView === item.id
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'}
                border-r-2 md:border-r-0 md:border-b-2 border-black last:border-r-0 md:last:border-b-0
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t-4 border-black hidden md:block">
        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black transition-colors mb-2"
        >
          <HelpCircle className="w-4 h-4" /> HELP & FAQ
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" /> RESET DATA
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mt-2"
        >
          <Upload className="w-4 h-4 rotate-180" /> EXPORT DATA
        </button>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div >
  );
};

export default Sidebar;