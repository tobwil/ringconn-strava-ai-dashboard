
export interface GPXPoint {
  time: Date;
  lat: number;
  lon: number;
  ele: number;
  power?: number;
  hr?: number;
  cad?: number;
}

export interface ZoneStats {
  z1: number; // Minutes in zone
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

export interface ActivitySummary {
  id: string; // Unique ID for list keys
  date: string;
  timestamp: number; // For sorting
  durationMinutes: number;
  distanceKm: number; // Calculated via Haversine
  totalElevationGain: number; // Calculated sum of positive delta
  avgHr: number;
  maxHr: number;
  avgPower: number;
  maxPower: number;
  avgCadence: number;
  efficiency: number; // Power / HR ratio
  hrZones: ZoneStats;
  points: GPXPoint[]; // Raw points (not stored in history to save space)
  aiAnalysis?: GeminiAnalysisResult; // Cache the AI result if available
}

// Lightweight version for LocalStorage (legacy), but IndexedDB can hold points.
export interface HistoryEntry extends Omit<ActivitySummary, 'points'> {
  points?: GPXPoint[];
}

export interface UserProfile {
  name: string;
  mainGoal: string;
  missionDeadline?: string; // YYYY-MM-DD
  birthdate: string; // YYYY-MM-DD
  height: number; // cm
  weight: number; // kg
  createdAt: number;
  apiKey?: string; // Google Gemini API Key
  language?: 'en' | 'de' | 'es' | 'fr';
}

export interface SleepBreakdown {
  deep: number;
  light: number;
  rem: number;
  awake: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  timestamp: number;
  // RingConn Data
  steps?: number;
  calories?: number;
  sleepScore?: number; // Mapped from Sleep Ratio
  sleepBreakdown?: SleepBreakdown;
  weight?: number;
  hrv?: number; // ms
  spo2?: number; // %
  stress?: number; // 0-100
  restingHr?: number; // bpm (Avg HR from RingConn)
  notes?: string;
}

export interface ManualEntryData {
  sleepScore?: number;
  stressLevel?: number; // 1-10
  subjectiveFeeling?: string;
  notes?: string;
}

export interface GeminiAnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  tone: string;
  progressCheck: string; // New field for goal tracking
}

export interface GlobalCoachResult {
  status: 'ON TRACK' | 'BEHIND' | 'AT RISK';
  trajectoryAnalysis: string; // "Your efficiency is up 5% this month..."
  keyWeakness: string; // "Lack of long steady rides."
  focusNextWeek: string;
}

export enum AppView {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  INPUTS = 'INPUTS',
  LOGBOOK = 'LOGBOOK',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  ANALYSIS = 'ANALYSIS',
}
