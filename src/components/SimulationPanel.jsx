import React, { useState } from 'react';
import { FiPlay, FiRotateCcw, FiSliders, FiZap, FiActivity } from 'react-icons/fi';

const PRESET_VALUES = {
  NORMAL: {
    cpu: 44.0,
    ram: 52.0,
    disk: 42.0,
    network: 38.0,
    active_users: 850,
    request_rate: 1050.0,
  },
  HIGH_TRAFFIC: {
    cpu: 82.0,
    ram: 81.0,
    disk: 58.0,
    network: 84.0,
    active_users: 2800,
    request_rate: 3600.0,
  },
  LOW_UTILIZATION: {
    cpu: 18.0,
    ram: 26.0,
    disk: 36.0,
    network: 8.0,
    active_users: 95,
    request_rate: 110.0,
  },
  CRITICAL_LOAD: {
    cpu: 93.0,
    ram: 91.0,
    disk: 74.0,
    network: 92.0,
    active_users: 3900,
    request_rate: 4800.0,
  },
  ANOMALY_SPIKE: {
    cpu: 96.0,
    ram: 42.0,
    disk: 38.0,
    network: 16.0,
    active_users: 150,
    request_rate: 130.0,
  }
};

export default function SimulationPanel({ onRunPrediction, isLoading }) {
  const [params, setParams] = useState(PRESET_VALUES.NORMAL);
  const [selectedPreset, setSelectedPreset] = useState("NORMAL");

  const handleSliderChange = (field, value) => {
    setParams(prev => ({
      ...prev,
      [field]: Number(value)
    }));
    setSelectedPreset("CUSTOM");
  };

  const applyPreset = (presetKey) => {
    if (PRESET_VALUES[presetKey]) {
      setParams(PRESET_VALUES[presetKey]);
      setSelectedPreset(presetKey);
    }
  };

  const handleRun = (e) => {
    e.preventDefault();
    if (onRunPrediction) {
      onRunPrediction(params);
    }
  };

  const handleReset = () => {
    applyPreset("NORMAL");
  };

  return (
    <div className="card bg-dark bg-opacity-95 border border-primary border-opacity-40 rounded-3 shadow-md mb-4 position-relative overflow-hidden">
      {/* Top Banner */}
      <div className="card-header bg-primary bg-opacity-15 border-bottom border-primary border-opacity-25 p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 rounded-2 bg-warning text-dark">
            <FiSliders className="fs-5" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-bold text-light font-monospace">Workload Simulation Console</h5>
              <span className="badge bg-warning text-dark fw-bold font-monospace px-2 py-1 small">
                SIMULATION MODE
              </span>
            </div>
            <small className="text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
              Adjust synthetic inputs and evaluate live Random Forest & Isolation Forest inference
            </small>
          </div>
        </div>

        {/* College Demonstration Presets */}
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <span className="small text-secondary font-monospace me-1 d-none d-lg-inline" style={{ fontSize: '0.75rem' }}>
            Presets:
          </span>
          <button 
            type="button" 
            className={`btn btn-sm font-monospace ${selectedPreset === 'NORMAL' ? 'btn-success text-dark fw-bold' : 'btn-outline-secondary'}`}
            onClick={() => applyPreset('NORMAL')}
          >
            Normal
          </button>
          <button 
            type="button" 
            className={`btn btn-sm font-monospace ${selectedPreset === 'HIGH_TRAFFIC' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary'}`}
            onClick={() => applyPreset('HIGH_TRAFFIC')}
          >
            High Traffic
          </button>
          <button 
            type="button" 
            className={`btn btn-sm font-monospace ${selectedPreset === 'LOW_UTILIZATION' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}
            onClick={() => applyPreset('LOW_UTILIZATION')}
          >
            Low Utilization
          </button>
          <button 
            type="button" 
            className={`btn btn-sm font-monospace ${selectedPreset === 'CRITICAL_LOAD' ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary'}`}
            onClick={() => applyPreset('CRITICAL_LOAD')}
          >
            Critical Load
          </button>
          <button 
            type="button" 
            className={`btn btn-sm font-monospace ${selectedPreset === 'ANOMALY_SPIKE' ? 'btn-danger text-white fw-bold glow-danger' : 'btn-outline-danger'}`}
            onClick={() => applyPreset('ANOMALY_SPIKE')}
            title="Inject runaway CPU divergence with low user volume"
          >
            Anomaly Spike
          </button>
        </div>
      </div>

      <div className="card-body p-3 p-md-4">
        <form onSubmit={handleRun}>
          <div className="row g-3">
            {/* CPU Slider */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20 h-100">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0 small fw-bold font-monospace text-cyan">
                    CPU Utilization
                  </label>
                  <span className="badge bg-dark border border-secondary border-opacity-25 font-monospace text-light">
                    {params.cpu.toFixed(1)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  className="form-range custom-range" 
                  min="5" 
                  max="100" 
                  step="0.5"
                  value={params.cpu}
                  onChange={(e) => handleSliderChange('cpu', e.target.value)}
                />
                <div className="d-flex justify-content-between text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                  <span>5%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* RAM Slider */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20 h-100">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0 small fw-bold font-monospace text-purple">
                    RAM Utilization
                  </label>
                  <span className="badge bg-dark border border-secondary border-opacity-25 font-monospace text-light">
                    {params.ram.toFixed(1)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  className="form-range custom-range" 
                  min="8" 
                  max="100" 
                  step="0.5"
                  value={params.ram}
                  onChange={(e) => handleSliderChange('ram', e.target.value)}
                />
                <div className="d-flex justify-content-between text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                  <span>8%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Disk Slider */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20 h-100">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0 small fw-bold font-monospace text-warning">
                    Disk Storage
                  </label>
                  <span className="badge bg-dark border border-secondary border-opacity-25 font-monospace text-light">
                    {params.disk.toFixed(1)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  className="form-range custom-range" 
                  min="10" 
                  max="100" 
                  step="0.5"
                  value={params.disk}
                  onChange={(e) => handleSliderChange('disk', e.target.value)}
                />
                <div className="d-flex justify-content-between text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Network Slider */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20 h-100">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0 small fw-bold font-monospace text-info">
                    Network Bandwidth
                  </label>
                  <span className="badge bg-dark border border-secondary border-opacity-25 font-monospace text-light">
                    {params.network.toFixed(1)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  className="form-range custom-range" 
                  min="2" 
                  max="100" 
                  step="0.5"
                  value={params.network}
                  onChange={(e) => handleSliderChange('network', e.target.value)}
                />
                <div className="d-flex justify-content-between text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                  <span>2%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="col-md-6">
              <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0 small fw-bold font-monospace text-light">
                    Active Concurrent Users
                  </label>
                  <span className="badge bg-primary bg-opacity-15 text-primary font-monospace">
                    {params.active_users} Users
                  </span>
                </div>
                <input 
                  type="range" 
                  className="form-range custom-range" 
                  min="50" 
                  max="4500" 
                  step="25"
                  value={params.active_users}
                  onChange={(e) => handleSliderChange('active_users', e.target.value)}
                />
                <div className="d-flex justify-content-between text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                  <span>50</span>
                  <span>2,500</span>
                  <span>4,500</span>
                </div>
              </div>
            </div>

            {/* Request Rate */}
            <div className="col-md-6">
              <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0 small fw-bold font-monospace text-light">
                    Incoming Request Rate (req/sec)
                  </label>
                  <span className="badge bg-success bg-opacity-15 text-success font-monospace">
                    {params.request_rate.toFixed(1)} req/s
                  </span>
                </div>
                <input 
                  type="range" 
                  className="form-range custom-range" 
                  min="10" 
                  max="5500" 
                  step="25"
                  value={params.request_rate}
                  onChange={(e) => handleSliderChange('request_rate', e.target.value)}
                />
                <div className="d-flex justify-content-between text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                  <span>10 req/s</span>
                  <span>2,750 req/s</span>
                  <span>5,500 req/s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4 pt-3 border-top border-secondary border-opacity-20">
            <div className="d-flex align-items-center gap-2 text-secondary small font-monospace" style={{ fontSize: '0.75rem' }}>
              <FiActivity className="text-cyan" />
              <span>Target Horizon: 3 steps ahead (~15 minutes)</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm px-3 font-monospace d-flex align-items-center gap-1"
                onClick={handleReset}
                disabled={isLoading}
              >
                <FiRotateCcw className="fs-6" /> Reset
              </button>

              <button 
                type="submit" 
                className="btn btn-primary px-4 py-2 fw-semibold font-monospace shadow-sm d-flex align-items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Running ML Inference...</span>
                  </>
                ) : (
                  <>
                    <FiPlay className="fs-5 text-warning" />
                    <span>Run ML Prediction & Optimize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
