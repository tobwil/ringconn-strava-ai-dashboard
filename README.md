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

## 🚀 One-Click Run (Locally)

This project is built with **React**, **Vite**, and **Tailwind CSS**.

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

### 3. Get Coached
- **Global Coach**: Click "Ask Coach" on the dashboard for a strategic review of your last 30 days.
- **Session Audit**: Go to **ANALYSIS**, select a workout, and get a detailed breakdown of that specific session's effectiveness.

## 🔒 Data Privacy & Security

We take a **Local-First** approach:
- **Storage**: All `History`, `Logs`, and `UserProfile` data lives in your browser's `IndexedDB`.
- **API Calls**: Data is only sent to Google Gemini when you explicitly click "Analyze". Only relevant, anonymized metrics (HR Zones, duration, sleep score) are sent.
- **Backup**: You can **Export** your full database as a JSON file and **Restore** it anytime from the Settings (Gear Icon).

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
