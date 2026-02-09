import React, { useState, useEffect } from 'react';
import NeoCard from './NeoCard';
import NeoButton from './NeoButton';
import { UserProfile } from '../types';
import { Check, Info } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  existingProfile?: UserProfile | null;
}

const MISSION_PRESETS = [
  "Lose Weight",
  "Get Fit",
  "Improve FTP",
  "Ride 100km",
  "Finish First Race",
  "Build Consistency",
  "Recover from Injury",
  "Improve Endurance",
  "Climb Faster"
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, existingProfile }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Track selected presets to highlight buttons
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

  useEffect(() => {
    if (existingProfile) {
      setName(existingProfile.name || '');
      setGoal(existingProfile.mainGoal);
      setDeadline(existingProfile.missionDeadline || '');
      setBirthdate(existingProfile.birthdate);
      setWeight(existingProfile.weight ? existingProfile.weight.toString() : '');
      setHeight(existingProfile.height ? existingProfile.height.toString() : '');
    }
  }, [existingProfile]);

  const togglePreset = (preset: string) => {
    let newSelected = [...selectedPresets];
    if (newSelected.includes(preset)) {
      newSelected = newSelected.filter(p => p !== preset);
    } else {
      newSelected.push(preset);
    }
    setSelectedPresets(newSelected);

    if (newSelected.length > 0) {
      setGoal(newSelected.join(" & "));
    } else {
      setGoal('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !birthdate) return;

    const profile: UserProfile = {
      name: name.trim() || 'OPERATOR',
      mainGoal: goal,
      missionDeadline: deadline,
      birthdate: birthdate,
      weight: weight ? parseFloat(weight) : 0,
      height: height ? parseInt(height) : 0,
      createdAt: existingProfile ? existingProfile.createdAt : Date.now(),
      apiKey: existingProfile?.apiKey // Preserve API Key if editing
    };

    onComplete(profile);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-0 py-2">
      <NeoCard className="w-full max-w-2xl p-6 md:p-8 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black" color="#FFDE59">
        <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-center pt-2">
          {existingProfile ? 'Mission Control' : 'Init Protocol'}
        </h2>
        <p className="text-xl font-bold mb-8 text-center">
          {existingProfile ? 'Update your parameters.' : 'Baseline metrics required for analysis.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="font-bold block mb-2">CODENAME / NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="OPERATOR"
              className="w-full p-3 border-4 border-black font-mono shadow-neo focus:outline-none focus:shadow-none transition-all bg-white text-black placeholder:text-gray-500 uppercase font-bold"
            />
          </div>

          <div>
            <label className="font-bold block mb-2">PRIMARY OBJECTIVE (MULTI-SELECT)</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {MISSION_PRESETS.map(preset => {
                const isSelected = selectedPresets.includes(preset) || goal.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => togglePreset(preset)}
                    className={`
                                text-xs font-mono border-2 border-black px-3 py-2 transition-all flex items-center gap-1
                                ${isSelected ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}
                            `}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {preset}
                  </button>
                );
              })}
            </div>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Or define your own target..."
              className="w-full h-24 p-4 text-lg font-mono border-4 border-black shadow-neo focus:outline-none focus:shadow-none transition-all resize-none bg-white text-black placeholder:text-gray-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold block mb-1">DEADLINE <span className="text-xs font-normal opacity-60">(OPTIONAL)</span></label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-3 border-4 border-black font-mono shadow-neo focus:outline-none focus:shadow-none transition-all bg-white text-black placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">BIRTHDATE <span className="text-xs text-red-500">*</span></label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full p-3 border-4 border-black font-mono shadow-neo focus:outline-none focus:shadow-none transition-all bg-white text-black placeholder:text-gray-500"
                required
              />
              <div className="mt-2 flex items-start gap-2 text-xs bg-white border border-black p-2">
                <Info className="w-4 h-4 shrink-0 text-[#5454FF]" />
                <span><strong>Why mandatory?</strong> Used to visualize your "Standard Range" for vital signs (HRV, RHR) based on your specific age group.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold block mb-1">WEIGHT (kg) <span className="text-xs font-normal opacity-60">(OPTIONAL)</span></label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-3 border-4 border-black font-mono shadow-neo focus:outline-none focus:shadow-none transition-all bg-white text-black placeholder:text-gray-500"
                step="0.1"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">HEIGHT (cm) <span className="text-xs font-normal opacity-60">(OPTIONAL)</span></label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-3 border-4 border-black font-mono shadow-neo focus:outline-none focus:shadow-none transition-all bg-white text-black placeholder:text-gray-500"
              />
            </div>
          </div>

          <NeoButton type="submit" className="w-full text-2xl py-4">
            {existingProfile ? 'UPDATE MISSION' : 'CONFIRM & ENTER'}
          </NeoButton>
        </form>
      </NeoCard>
    </div>
  );
};

export default Onboarding;