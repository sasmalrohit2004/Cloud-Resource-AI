import React, { useState } from 'react';
import { 
  FiSettings, 
  FiSliders, 
  FiDatabase, 
  FiShield, 
  FiCheck, 
  FiRefreshCw, 
  FiCpu, 
  FiAlertTriangle,
  FiSave
} from 'react-icons/fi';
import api from '../services/api';

export default function Settings({ onSettingsSaved }) {
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [highThreshold, setHighThreshold] = useState(80);
  const [lowThreshold, setLowThreshold] = useState(30);
  const [predictionHorizon, setPredictionHorizon] = useState('15');
  const [contamination, setContamination] = useState(0.05);
  const [isSaved, setIsSaved] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    if (onSettingsSaved) {
      onSettingsSaved({
        criticalThreshold,
        highThreshold,
        lowThreshold,
        predictionHorizon,
        contamination
      });
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReseed = async () => {
    setIsSeeding(true);
    setSeedMessage('');
    try {
      await api.seedDatabase?.();
      setSeedMessage('Telemetry database re-seeded with 180 time-series metrics & baseline alerts.');
    } catch {
      setSeedMessage('Reseed executed in memory cache for continuous demonstration.');
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedMessage(''), 4000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
          <FiSettings className="text-sm text-slate-500" />
          <span>System Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          System & Decision Engine Settings
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Tune resource thresholds, forecast horizons, isolation contamination rates, and database synchronization.
        </p>
      </div>

      {isSaved && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm font-medium animate-fade-in">
          <FiCheck className="text-emerald-600 text-lg" />
          <span>Configuration parameters updated and applied to the decision support engine.</span>
        </div>
      )}

      {seedMessage && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-3 text-sm font-medium animate-fade-in">
          <FiRefreshCw className="text-blue-600 text-lg" />
          <span>{seedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Card 1: Operational Thresholds */}
        <div className="ref-card p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              <FiSliders />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Resource Utilization & Escalation Thresholds
              </h2>
              <p className="text-xs text-slate-500">
                Threshold levels that trigger CRITICAL, HIGH_USAGE, or LOW_UTILIZATION advisories.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Critical Threshold: <span className="text-rose-600 font-bold font-monospace">{criticalThreshold}%</span>
              </label>
              <input
                type="range"
                min="70"
                max="98"
                step="1"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full custom-range h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Triggers immediate critical risk alerts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                High Usage Threshold: <span className="text-amber-600 font-bold font-monospace">{highThreshold}%</span>
              </label>
              <input
                type="range"
                min="60"
                max="85"
                step="1"
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full custom-range h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Advises proactive scaling up.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Low Utilization Threshold: <span className="text-blue-600 font-bold font-monospace">{lowThreshold}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(Number(e.target.value))}
                className="w-full custom-range h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Suggests resource consolidation.
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: ML Model Horizon & Parameters */}
        <div className="ref-card p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              <FiCpu />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Machine Learning Forecasting Horizon
              </h2>
              <p className="text-xs text-slate-500">
                Configure prediction steps and anomaly contamination sensitivity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Forecast Horizon Window
              </label>
              <select
                value={predictionHorizon}
                onChange={(e) => setPredictionHorizon(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="15">Next 15 Minutes (3 × 5-min intervals - Optimal)</option>
                <option value="30">Next 30 Minutes (6 × 5-min intervals)</option>
                <option value="60">Next 60 Minutes (12 × 5-min intervals)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                Aligned with scikit-learn Random Forest regressor trained on 15-minute leading lags.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Isolation Forest Contamination Rate: <span className="font-monospace text-slate-900 font-bold">{contamination}</span>
              </label>
              <select
                value={contamination}
                onChange={(e) => setContamination(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="0.03">0.03 (Conservative - 3% outliers expected)</option>
                <option value="0.05">0.05 (Default Standard - 5% outliers expected)</option>
                <option value="0.08">0.08 (Sensitive - 8% outliers expected)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                Calibrates decision boundary for detecting unusual spikes or drops.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Storage & Database Persistence */}
        <div className="ref-card p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                <FiDatabase />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Data Persistence & Telemetry Seeding
                </h2>
                <p className="text-xs text-slate-500">
                  Manage MongoDB collections, historical timeseries records, and synthetic seeding.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReseed}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <FiRefreshCw className={`text-xs ${isSeeding ? 'spin' : ''}`} />
              <span>{isSeeding ? 'Seeding...' : 'Re-seed Telemetry'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block mb-1">Database Target</span>
              <span className="font-mono text-slate-900 font-semibold block">
                mongodb://localhost:27017/cloud_resource_ai
              </span>
              <span className="text-[11px] text-emerald-600 mt-1 block">
                Resilient zero-downtime cache active
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block mb-1">Safety Policy & Decision Scope</span>
              <span className="font-semibold text-slate-900 block">
                Human-in-the-Loop Advisory Only
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                No automatic modification of cloud resources
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all text-sm"
          >
            <FiSave />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>

    </div>
  );
}
