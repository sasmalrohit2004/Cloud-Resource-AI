# ☁️ Cloud Resource AI
### Machine Learning–Driven Cloud Resource Utilization Prediction & Decision Support System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 📖  What is this project?

In cloud platforms like AWS, Google Cloud, or Azure, servers frequently encounter sudden surges in traffic. 

Normally, monitoring tools only trigger alarms **after** a server's CPU or RAM has already spiked to 95%—which is often too late to stop websites from crashing, buffering, or timing out. On the flip side, leaving oversized servers running when nobody is visiting wastes thousands of dollars.

**Cloud Resource AI** is an intelligent assistant for cloud operations teams:
- 🔮 **Forecasts Demand ~15 Minutes in Advance**: It predicts future CPU and RAM load using machine learning so teams can scale up *before* slowdowns occur.
- 🚨 **Spots Hidden Anomalies**: It uses unsupervised AI to detect unusual patterns (like silent memory leaks or runaway processes) that standard threshold monitors miss.
- 💡 **Offers Clear, Actionable Recommendations**: It tells engineers exactly whether to scale up, scale down to save costs, or investigate a workload.
- 🎛️ **Interactive Workload Simulator**: Anyone can drag sliders or click preset scenarios (e.g., *Black Friday Spike*, *Idle Night*, *Memory Anomaly*) to observe live ML forecasts without touching real cloud infrastructure.

---

## 🌟 Key Features

| Feature | Description |
|:---|:---|
| **🔮 15-Minute Horizon Forecast** | Dual Random Forest regressors forecast CPU and RAM utilization 3 intervals (~15 minutes) ahead with high accuracy (**RAM $R^2 = 0.94$**). |
| **🚨 Unsupervised Anomaly Detection** | Isolation Forest scans multivariate vectors to flag abnormal behavior even when traditional limits haven't tripped. |
| **💡 Decoupled Recommendation Engine** | Maps live predictions and anomaly flags to clear advisories: `NORMAL`, `LOW_UTILIZATION`, `HIGH_USAGE_EXPECTED`, and `CRITICAL`. |
| **🎛️ Interactive Workload Console** | Test scenarios in real-time with one-click presets or custom sliders (Active Users, Request Rate, Disk, Network). |
| **📊 Real-Time Interactive Graphs** | Interactive SVG telemetry charts (powered by Recharts) visualize diurnal trends, actuals, and forecasts. |
| **🔐 Role-Based Access Control** | Operator portal supporting distinct roles (`Cloud Engineer`, `DevOps Lead`, `System Admin`, `Viva Evaluator`) with session security. |
| **🛡️ Zero-Crash In-Memory Fallback** | Runs seamlessly with local MongoDB or automatically falls back to an in-memory database—no installation friction. |

---

## 🏗️ System Architecture

```
                                 USER / OPERATOR
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │            REACT + VITE WEB INTERFACE                │
             │  • Real-time Telemetry Dashboard (CPU, RAM, Net)     │
             │  • 15-Minute Forecast Cards & Confidence Metrics     │
             │  • Actionable Recommendation & Status Indicators     │
             │  • Interactive Workload Simulator & Presets          │
             │  • Role-Based Operator Sign-In / Registration        │
             └──────────────────────────┬───────────────────────────┘
                                        │ REST API (JSON)
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │                FASTAPI BACKEND SERVICE               │
             │  • /api/health             • /api/metrics/current    │
             │  • /api/auth/login         • /api/metrics/history    │
             │  • /api/auth/register      • /api/predict            │
             │  • /api/dashboard/summary  • /api/model/performance  │
             └──────┬───────────────────┬───────────────────┬───────┘
                    │                   │                   │
                    ▼                   ▼                   ▼
         ┌───────────────────┐ ┌─────────────────┐ ┌───────────────────┐
         │ PREDICTION ENGINE │ │ ANOMALY ENGINE  │ │  ADVISORY RULES   │
         │  • Random Forest  │ │ • Isolation     │ │ • Critical (≥90%) │
         │    Regressors     │ │   Forest        │ │ • High (≥80%)     │
         │  • Lag & Rolling  │ │ • Multivariate  │ │ • Low (<30%)      │
         │    Features       │ │   Outlier Score │ │ • Normal Health   │
         └──────────┬────────┘ └────────┬────────┘ └─────────┬─────────┘
                    │                   │                    │
                    └───────────────────┼────────────────────┘
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │                  PERSISTENCE LAYER                   │
             │  • Primary: MongoDB (mongodb://localhost:27017)      │
             │  • Resilient Fallback: Thread-Safe In-Memory Store   │
             └──────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Run in 5 Minutes)

### Prerequisites
- **Python 3.10 or newer**
- **Node.js 18 or newer** (with npm)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/cloud-resource-ai.git
cd cloud-resource-ai
```

---

### Step 2: Start the Backend (FastAPI)

1. Open your terminal in the project root:
   ```bash
   # Create and activate a virtual environment
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows:
   python -m venv venv
   venv\Scripts\activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   # On macOS/Linux:
   PYTHONPATH=backend python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8008 --reload

   # On Windows (Command Prompt):
   set PYTHONPATH=backend
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8008 --reload
   ```

*The backend is now live at `http://127.0.0.1:8008`. You can view the interactive Swagger documentation at `http://127.0.0.1:8008/docs`.*

---

### Step 3: Start the Frontend (React + Vite)

1. Open a **new** terminal window in the project root:
   ```bash
   npm install
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   *(or `http://localhost:5173` depending on your environment).*

---

### Step 4: Sign In or Register

When you first open the app, you will be greeted by the **Operator Gateway**:

#### Option A: 1-Click Demo Logins
You can use the built-in quick-fill buttons or enter:
- **Cloud Admin**: `admin@cloudai.io` / `admin123`
- **Viva Evaluator**: `evaluator@university.edu` / `password123`
- **Cloud Engineer**: `devops@cloudai.io` / `password123`

#### Option B: Register Your Own Account
Click the **"Register Account"** tab, enter your name, email, password, and chosen role. The system will create your account and log you in immediately.

---

## 🤖 Machine Learning Pipeline

### 1. Data Collection & Features
The models analyze 6 multivariate telemetry metrics captured at 5-minute sampling intervals:
- **CPU Usage (%)**: Real-time processor utilization.
- **RAM Usage (%)**: Real-time memory allocation.
- **Disk Usage (%)**: Persistent storage volume utilization.
- **Network Traffic (%)**: Bandwidth ingress/egress saturation.
- **Active Users**: Concurrent active user sessions.
- **Request Rate (req/s)**: Inbound HTTP requests per second.

### 2. Feature Engineering
Time-series dependencies are captured using:
- **Lag Features ($t-1$)**: Previous interval values of CPU, RAM, and request rates.
- **Rolling Window Means ($3$-step)**: Moving average across 15 minutes to smooth transient network blips.
- **Cyclic Calendar Features**: Hour of day and day of the week to capture business-hour diurnal cycles.

### 3. Model Performance (Holdout Test Set)
The models were trained and validated on a strict 80/20 chronological split (1,100 unseen test observations):

| Model | Target Metric | MAE (Error) | RMSE | $R^2$ Score | Practical Meaning |
|:---|:---|:---:|:---:|:---:|:---|
| **Random Forest Regressor** | CPU Usage ($t+3$) | **4.66%** | **6.70%** | **0.74** | On average, CPU predictions are within $\pm 4.6\%$ of the actual load. |
| **Random Forest Regressor** | RAM Usage ($t+3$) | **1.51%** | **2.92%** | **0.94** | Memory usage follows continuous allocation; model explains **94.2%** of all variance. |
| **Isolation Forest** | Multivariate Anomalies | — | — | Contamination: **5.45%** | Successfully flags abnormal traffic/resource mismatches (e.g., runaway threads). |

*(To re-run the ML pipeline from scratch, run `python ml/src/generate_dataset.py`, `python ml/src/preprocess.py`, `python ml/src/train.py`, and `python ml/src/evaluate.py`).*

---

## 🎛️ Testing Scenarios in the Workload Simulator

In the dashboard's **Simulation Console**, select any preset to watch the AI evaluate the situation in real time:

| Preset | Simulated Values | AI Assessment | Recommended Action |
|:---|:---|:---:|:---|
| **Normal Workload** | CPU: 44%, RAM: 52%, 850 users | `NORMAL` | *"Resource utilization is within normal range. Maintain current capacity."* |
| **High Traffic** | CPU: 82%, RAM: 81%, 2800 users | `HIGH_USAGE_EXPECTED` | *"High resource usage expected. Consider increasing available resources."* |
| **Low Utilization** | CPU: 18%, RAM: 26%, 95 users | `LOW_UTILIZATION` | *"Resources appear underutilized. Consider reducing allocated capacity to save costs."* |
| **Critical Load** | CPU: 93%, RAM: 91%, 3900 users | `CRITICAL` | *"Critical resource usage expected. Scale out instances immediately and investigate."* |
| **Anomaly Spike** | CPU: 96%, RAM: 42%, 150 users | `ANOMALY DETECTED` | *"Unusual pattern detected: High CPU with low user traffic. Check for infinite loops or rogue jobs."* |

---

## 📁 Project Directory Structure

```
cloud-resource-ai/
├── backend/                        # FastAPI REST API
│   ├── app/
│   │   ├── database/               # MongoDB driver & in-memory fallback
│   │   ├── routes/                 # REST endpoints (auth, metrics, predict, alerts)
│   │   ├── schemas/                # Pydantic validation schemas
│   │   ├── services/               # ML inference, anomaly, & recommendation engines
│   │   └── main.py                 # FastAPI app entry point
│   ├── requirements.txt            # Python dependencies
│   └── seed_database.py            # Sample metric seeder
├── ml/                             # Machine Learning Pipeline
│   ├── data/                       # Raw and feature-engineered datasets
│   ├── models/                     # Serialized .joblib models & metrics.json
│   └── src/                        # Generation, preprocessing, training & evaluation scripts
├── src/ / frontend/                # React 18 + Vite Frontend
│   ├── components/                 # UI components (Charts, Cards, Simulator, Auth)
│   │   ├── AuthGate.jsx            # Operator login / registration gate
│   │   ├── SimulationPanel.jsx     # Preset workload simulator
│   │   ├── UsageChart.jsx          # Recharts telemetry visualizer
│   │   ├── ModelPerformance.jsx    # Empirical metrics display
│   │   └── ...                     # Navbar, MetricCard, AnomalyCard, etc.
│   ├── pages/                      # Dashboard, Analytics, Reports, Settings
│   ├── services/api.js             # Axios client with offline fallback support
│   └── App.tsx                     # Main React application shell
├── package.json                    # Frontend dependencies & npm scripts
├── vite.config.ts                  # Vite build & reverse proxy configuration
├── metadata.json                   # Project metadata
└── README.md                       # Documentation

---

## 🧪 Running Automated Tests

Run the backend and ML test suite with Pytest:
```bash
pytest backend/tests/ ml/tests/ -v
```
All unit tests will execute and verify API responses, Pydantic schemas, and model inference.

## 📄 License
This project is open-source and released under the [MIT License](LICENSE).
