import { GoogleGenAI, Type } from "@google/genai";
import { ActivitySummary, ManualEntryData, GeminiAnalysisResult, HistoryEntry, GlobalCoachResult } from "../types";
import { GEMINI_MODEL } from "../constants";
import { getUserProfile } from "./storage";

const getAIClient = async () => {
  // Priority: Env Var > User Profile > Error
  // Fix: Use import.meta.env for Vite instead of process.env which can cause "process is not defined"
  const envKey = import.meta.env.VITE_API_KEY;

  if (envKey) return new GoogleGenAI({ apiKey: envKey });

  const user = await getUserProfile();
  if (user?.apiKey) {
    return new GoogleGenAI({ apiKey: user.apiKey });
  }

  throw new Error("API Key missing. Please add it in Settings.");
};

const getLanguageInstruction = (lang?: string) => {
  switch (lang) {
    case 'de': return "ANTWORTE IMMER AUF DEUTSCH. Du bist ein harter, direkter Sportwissenschaftler.";
    case 'es': return "RESPONDE SIEMPRE EN ESPAÑOL. Eres un científico deportivo duro y directo.";
    case 'fr': return "RÉPONDEZ TOUJOURS EN FRANÇAIS. Vous êtes un scientifique du sport brutal et direct.";
    default: return "ANSWER ALWAYS IN ENGLISH. You are a brutal, direct sport scientist."; // Default
  }
};

export const analyzeHealthData = async (
  activity: ActivitySummary,
  manualData: ManualEntryData,
  userGoal: string,
  history: HistoryEntry[],
  dailyLog?: DailyLog, // New: Pass daily log for that day
  language?: string
): Promise<GeminiAnalysisResult> => {
  const ai = await getAIClient();

  // Downsample points
  const sampleRate = Math.max(1, Math.floor(activity.points.length / 50));
  const sampledPoints = activity.points
    .filter((_, idx) => idx % sampleRate === 0)
    .map(p => ({
      t: p.time.toLocaleTimeString(),
      hr: p.hr,
      pwr: p.power,
    }));

  const recentHistory = history.slice(0, 5).map(h => ({
    d: h.date,
    ef: h.efficiency, // New efficiency metric
    dur: h.durationMinutes
  }));

  const langInstruction = getLanguageInstruction(language);

  const prompt = `
    ${langInstruction}
    Ziel: "${userGoal}"
    
    Historie (Datum, Effizienz (Pwr/HR), Dauer):
    ${JSON.stringify(recentHistory)}
    
    Tagesform / Recovery (RingConn):
    ${dailyLog ? JSON.stringify({
    sleep: dailyLog.sleepScore,
    hrv: dailyLog.hrv,
    rhr: dailyLog.restingHr,
    spo2: dailyLog.spo2,
    stress: dailyLog.stress
  }) : "Keine RingConn Daten für diesen Tag."}

    Aktuelle Session:
    - Zonen (min): Z1:${activity.hrZones.z1}, Z2:${activity.hrZones.z2}, Z3:${activity.hrZones.z3}, Z4:${activity.hrZones.z4}, Z5:${activity.hrZones.z5}
    - Effizienz: ${activity.efficiency}
    - Subjektiv: ${manualData.subjectiveFeeling} (Sleep Check: ${manualData.sleepScore || dailyLog?.sleepScore})
    - Zeitreihe: ${JSON.stringify(sampledPoints)}

    Frage: War das Training effektiv für das Ziel? Passe ich in den Trend? Berücksichtige meine Tagesform (Recovery).
  `;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          progressCheck: { type: Type.STRING },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          tone: { type: Type.STRING }
        }
      }
    }
  });

  if (response.text) return JSON.parse(response.text) as GeminiAnalysisResult;
  throw new Error("No response from AI");
};

// Global history analysis
export const analyzeGlobalProgress = async (
  history: HistoryEntry[],
  dailyLogs: DailyLog[], // New: Pass all logs
  userGoal: string,
  language?: string
): Promise<GlobalCoachResult> => {
  const ai = await getAIClient();

  const summaryData = history.slice(0, 20).map(h => ({
    date: h.date,
    duration: h.durationMinutes,
    efficiency: h.efficiency,
    intensity: h.avgHr,
    zones: h.hrZones
  }));

  // Calculate generic recovery trends (last 7 days avg vs prev 7 days)
  const sortedLogs = [...dailyLogs].sort((a, b) => b.timestamp - a.timestamp); // newest first
  const last7 = sortedLogs.slice(0, 7);
  const avgSleep = last7.reduce((acc, l) => acc + (l.sleepScore || 0), 0) / (last7.length || 1);
  const avgHRV = last7.reduce((acc, l) => acc + (l.hrv || 0), 0) / (last7.length || 1);

  const langInstruction = getLanguageInstruction(language);

  const prompt = `
    ${langInstruction}
    Rol: Head Coach.
    Ziel des Athleten: "${userGoal}"
    
    Training (Letzte 20 Einheiten):
    ${JSON.stringify(summaryData)}

    Health & Recovery (Letzte 7 Tage Avg):
    - Sleep Score: ${avgSleep.toFixed(1)}
    - HRV: ${avgHRV.toFixed(1)} ms
    - Full Logs (Letzte 7 Tage): ${JSON.stringify(last7.map(l => ({ d: l.date, s: l.sleepScore, hrv: l.hrv, rhr: l.restingHr })))}

    Aufgabe: Erstelle einen strategischen Statusbericht.
    Berücksichtige, ob der Athlet genug schläft/recovered für das Training.
    
    1. Status: ON TRACK, BEHIND, oder AT RISK (Verletzung/Übertraining/Schlafmangel).
    2. Trajectory: Wie entwickelt sich die Fitness (Effizienz)? Steigt das Volumen passend zum Ziel?
    3. Weakness: Was fehlt? (z.B. zu wenig Zone 2, zu wenig Spitzen, Volumen stagniert, schlechter Schlaf).
    4. Focus: Ein klarer Befehl für die nächste Woche.
  `;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ['ON TRACK', 'BEHIND', 'AT RISK'] },
          trajectoryAnalysis: { type: Type.STRING },
          keyWeakness: { type: Type.STRING },
          focusNextWeek: { type: Type.STRING }
        }
      }
    }
  });

  if (response.text) return JSON.parse(response.text) as GlobalCoachResult;
  throw new Error("No global response");
};
