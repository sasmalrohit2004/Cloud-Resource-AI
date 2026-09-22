import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { FiTrendingUp, FiLayers, FiClock } from 'react-icons/fi';

export default function UsageChart({ historyData = [], hours = 24, onTimeframeChange }) {
  const [activeTab, setActiveTab] = useState("all"); // "all", "cpu", "ram", "network", "requests"

  const formatTimestamp = (tsStr) => {
    if (!tsStr) return '';
    const parts = tsStr.split(' ');
    if (parts.length > 1) {
      // Returns HH:MM
      return parts[1].substring(0, 5);
    }
    return tsStr;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark border border-secondary border-opacity-50 p-2 rounded-3 shadow-lg font-monospace small">
          <p className="text-secondary mb-1 border-bottom border-secondary border-opacity-25 pb-1">
            Time: {label}
          </p>
          {payload.map((item, index) => (
            <div key={index} className="d-flex align-items-center justify-content-between gap-3 my-0.5">
              <span style={{ color: item.color }}>● {item.name}:</span>
              <span className="fw-bold text-light">
                {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
                {item.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card bg-dark bg-opacity-85 border border-secondary border-opacity-25 rounded-3 shadow-sm mb-4">
      <div className="card-header bg-dark bg-opacity-50 border-bottom border-secondary border-opacity-25 p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 rounded-2 bg-primary bg-opacity-15 text-primary">
            <FiTrendingUp className="fs-5 text-cyan" />
          </div>
          <div>
            <h5 className="mb-0 fw-bold text-light font-monospace">Historical Resource Telemetry</h5>
            <small className="text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>
              Real-time telemetry series at ~5-minute historical sampling intervals
            </small>
          </div>
        </div>

        {/* Chart View Switcher & Timeframe Controls */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('all')}
            >
              All Metrics
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'cpu' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('cpu')}
            >
              CPU
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'ram' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('ram')}
            >
              RAM
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'network' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('network')}
            >
              Network
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('requests')}
            >
              Requests
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="d-flex align-items-center gap-1 border-start border-secondary border-opacity-25 ps-2">
            <FiClock className="text-secondary fs-6" />
            <select 
              className="form-select form-select-sm bg-dark text-light border-secondary border-opacity-25 font-monospace"
              value={hours}
              onChange={(e) => onTimeframeChange && onTimeframeChange(Number(e.target.value))}
              style={{ width: '100px', fontSize: '0.8rem' }}
            >
              <option value={6}>Last 6h</option>
              <option value={12}>Last 12h</option>
              <option value={24}>Last 24h</option>
              <option value={48}>Last 48h</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card-body p-3">
        {historyData.length === 0 ? (
          <div className="text-center py-5 text-secondary font-monospace">
            Loading historical telemetry series...
          </div>
        ) : (
          <div>
            {/* Primary Multi-Metric View */}
            {(activeTab === 'all' || activeTab === 'cpu') && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-bold text-uppercase font-monospace text-light">
                    CPU & RAM Utilization (%)
                  </span>
                  <span className="text-muted small font-monospace" style={{ fontSize: '0.72rem' }}>
                    Threshold: 80% (Warning), 90% (Critical)
                  </span>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      <Area type="monotone" dataKey="cpu_usage" name="CPU Usage" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" unit="%" />
                      <Area type="monotone" dataKey="ram_usage" name="RAM Usage" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#ramGrad)" unit="%" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Network & Request Rate View */}
            {(activeTab === 'all' || activeTab === 'network' || activeTab === 'requests') && (
              <div className="row g-3">
                <div className={activeTab === 'all' ? 'col-lg-6' : 'col-12'}>
                  <div className="p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-20">
                    <span className="small fw-bold text-uppercase font-monospace text-light d-block mb-2">
                      Network Bandwidth Usage (%)
                    </span>
                    <div style={{ width: '100%', height: 180 }}>
                      <ResponsiveContainer>
                        <LineChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                          <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="network_usage" name="Network" stroke="#38bdf8" strokeWidth={2} dot={false} unit="%" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className={activeTab === 'all' ? 'col-lg-6' : 'col-12'}>
                  <div className="p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-20">
                    <span className="small fw-bold text-uppercase font-monospace text-light d-block mb-2">
                      Incoming Request Rate (req/sec)
                    </span>
                    <div style={{ width: '100%', height: 180 }}>
                      <ResponsiveContainer>
                        <LineChart data={historyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                          <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="request_rate" name="Request Rate" stroke="#10b981" strokeWidth={2} dot={false} unit=" req/s" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
