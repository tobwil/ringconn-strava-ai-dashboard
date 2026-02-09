# 🏃‍♂️ RingConn x Strava AI Coach Dashboard

> A strict, local-first performance dashboard combining **RingConn** recovery data with **Strava** training loads. Powered by **Google Gemini**.

![Dashboard Preview](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6) 
*(Note: Replace with actual screenshot)*

## ✨ Features

- **Brutalist AI Coach**: Connects to Google Gemini to analyze your training vs. recovery. It tells you if you are "ON TRACK", "BEHIND", or "AT RISK".
- **Advanced Metrics**: Calculates **Fitness (CTL)**, **Fatigue (ATL)**, and **Readiness (TSB)** using standard Banister TRIMP & Coggan formulas.
- **Health Integration**: Imports **RingConn** CSV exports to track Sleep, HRV, SpO2, and Stress.
- **Local-First Privacy**:
  - All data stored in **IndexedDB** in your browser.
  - API Keys stored encrypted locally.
  - No external database. You own your data.
- **Multi-Language AI**: Coach speaks **English, German, Spanish, or French**.

## 🎯 The Mission

Fitness apps today are cluttered. They want you to be "social", they want you to subscribe, they want to sell you plans. 

**This dashboard is different.**
- It is **Brutalist**: No fluff, just raw data and direct advice.
- It is **Private**: Your health data is yours. It lives on your device.
- It is **Holistic**: It understands that *Rest* (RingConn) is just as important as *Strain* (Strava).

## 🧠 How it Works

The app combines two data streams to calculate your **Readiness**:

1.  **Training Load (Strava)**:
    -   We calculate TRIMP (Training Impulse) for every activity based on Heart Rate Zones.
    -   **Fitness (CTL)**: 42-day rolling average of your load.
    -   **Fatigue (ATL)**: 7-day rolling average of your load.

2.  **Recovery (RingConn)**:
    -   We track Sleep Score, HRV, and Resting Heart Rate.
    -   These modulate your readiness. High load + Poor sleep = **High Risk**.

3.  **The AI Coach**:
    -   Gemini analyzes the correlation between your *Subjective Feeling* (Daily Check-in) and your *Objective Metrics*.
    -   It acts as a stern but fair coach, keeping you accountable to your specific goal.

## 🚀 One-Click Run (Locally)

## ⚡ Tech Stack

-   **Frontend**: React (Vite), TypeScript, Tailwind CSS
-   **Charts**: Recharts
-   **Icons**: Lucide React
-   **Database**: IndexedDB (via `idb` library)
-   **AI**: Google Generative AI SDK (Gemini 2.5 Flash)

### Prerequisites
- Node.js (v18+)
- A **Google Gemini API Key** (Get it free at [Google AI Studio](https://aistudio.google.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/tobwil/ringconn-strava-dashboard.git

# Enter directory
cd ringconn-strava-dashboard

# Install dependencies
npm install

# Start Dev Server
npm run dev
```

Open `http://localhost:5173` (or the port shown in terminal).

## 🛠 Usage Guide

### 1. Import Data
- **Strava**: Export your activities as `.gpx` from Strava and drag-and-drop them into the **INPUTS** view.
- **RingConn**: Export your health data as `.csv` from the RingConn app and drop it into **INPUTS**.

### 2. Set Up AI
- Go to the Sidebar.
- Click the **Gear Icon** (Settings) next to the "EDIT" button.
- Enter your **Google Gemini API Key**.
- Select your preferred **Language**.

### 3. Get Coached (Optional)
- **Global Coach**: Click "Ask Coach" on the dashboard for a strategic review of your last 30 days.
- **Session Audit**: Go to **ANALYSIS**, select a workout, and get a detailed breakdown of that specific session's effectiveness.

> **Note:** The AI features are completely optional. The dashboard works perfectly as a metrics tracker (CTL, ATL, TSB, Trends) without an API Key.

## 🔒 Data Privacy & Security

We take a **Local-First** approach:
- **IndexedDB Storage**: Your data is stored in a structured database inside your browser. It persists even if you close the tab.
- **No Cloud Sync**: We do not have a backend server. If you clear your browser cookies/data, your dashboard will be wiped.
- **Backup Strategy**: 
  - Go to **Settings** (Gear Icon).
  - Click **EXPORT DATA**. This saves a JSON file with your entire history and logs.
  - Use **RESTORE DATA** to load this file on a different device or browser.
- **API Calls**: Data is only sent to Google Gemini when you explicitly click "Analyze". Only relevant, anonymized metrics (HR Zones, duration, sleep score) are sent.

## 🤝 Contributing

Contributions are welcome!
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ by [Your Name]*
