import React, { useState } from 'react';
import { 
  FiBell, 
  FiAlertTriangle, 
  FiAlertOctagon, 
  FiInfo, 
  FiCheckCircle, 
  FiTrash2, 
  FiFilter, 
  FiSearch,
  FiZap,
  FiActivity,
  FiUsers,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';
import api from '../services/api';

export default function Alerts({ 
  alerts, 
  setAlerts,
  onNavigateToDashboard
}) {
  const alertList = Array.isArray(alerts) ? alerts : [];
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [clearing, setClearing] = useState(false);

  // Filter alerts by severity and search query
  const filteredAlerts = alertList.filter(alert => {
    const matchesSeverity = 
      filterSeverity === 'ALL' ? true :
      filterSeverity === 'ANOMALY' ? alert.type === 'ANOMALY' :
      alert.severity?.toUpperCase() === filterSeverity;

    const matchesSearch = 
      searchQuery.trim() === '' ? true :
      alert.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.metric?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSeverity && matchesSearch;
  });

  const criticalCount = alertList.filter(a => a.severity?.toUpperCase() === 'CRITICAL').length;
  const highCount = alertList.filter(a => a.severity?.toUpperCase() === 'HIGH').length;
  const anomalyCount = alertList.filter(a => a.type === 'ANOMALY').length;

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    setConfirmClear(false);
    setClearing(true);
    try {
      await api.clearAlerts();
      if (setAlerts) setAlerts([]);
    } catch (err) {
      console.error('Failed to clear alerts:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleCreateTestSurge = async () => {
    const surgeAlert = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: "USER_TRAFFIC_SURGE",
      severity: "CRITICAL",
      message: "Simulated high user traffic surge detected (4,250 concurrent users, 5,100 req/s). Forecasted CPU: 93.8%. Urgent scale-out recommended.",
      metric: "Active Users / CPU",
      value: 4250.0
    };

    try {
      await api.createAlert(surgeAlert);
      if (setAlerts) {
        setAlerts(prev => [surgeAlert, ...prev]);
      }
    } catch (err) {
      console.error('Error creating surge alert:', err);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 pulse-dot"></span>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            INFO
          </span>
        );
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'USER_TRAFFIC_SURGE':
        return <FiUsers className="text-rose-600 text-base" />;
      case 'ANOMALY':
        return <FiAlertTriangle className="text-amber-500 text-base" />;
      case 'CRITICAL_CAPACITY':
      case 'CRITICAL':
        return <FiAlertOctagon className="text-rose-600 text-base" />;
      default:
        return <FiBell className="text-blue-600 text-base" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 mb-2">
            <FiBell className="text-rose-600" />
            <span>Incident Management &amp; Telemetry Auditing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cloud Resource Alerts &amp; Events
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time feed of capacity threshold breaches, high user surge notifications, and Isolation Forest anomaly detections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCreateTestSurge}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <FiZap />
            <span>Trigger Surge Alert</span>
          </button>

          {alerts.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                confirmClear 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <FiTrash2 className={confirmClear ? "text-white" : "text-slate-400"} />
              <span>{clearing ? 'Clearing...' : confirmClear ? 'Confirm Clear All?' : 'Clear Log'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer"
          >
            Back to Dashboard &rarr;
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Logged Alerts</span>
            <FiBell className="text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {alerts.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Recorded in session</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200/90 shadow-xs bg-gradient-to-b from-white to-rose-50/20">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span className="font-semibold">Critical Breaches</span>
            <FiAlertOctagon className="text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono">
            {criticalCount}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1">&ge; 90% CPU/RAM saturation</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200/90 shadow-xs bg-gradient-to-b from-white to-amber-50/20">
          <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
            <span className="font-semibold">High User Surges</span>
            <FiUsers className="text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            {highCount}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">Surges &ge; 2,500 active users</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-200/90 shadow-xs bg-gradient-to-b from-white to-purple-50/20">
          <div className="flex items-center justify-between text-xs text-purple-700 mb-1">
            <span className="font-semibold">Isolation Forest Anomalies</span>
            <FiAlertTriangle className="text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 font-mono">
            {anomalyCount}
          </div>
          <div className="text-[11px] text-purple-600/80 mt-1">Unsupervised outlier events</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Severity Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <div className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <FiFilter />
            <span>Filter:</span>
          </div>

          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'CRITICAL', label: 'Critical' },
            { id: 'HIGH', label: 'High Usage' },
            { id: 'ANOMALY', label: 'Anomalies' },
            { id: 'MEDIUM', label: 'Medium/Info' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterSeverity(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterSeverity === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search alerts or metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

      </div>

      {/* Alerts Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
            Incident Event Stream ({filteredAlerts.length} shown)
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Auto-Sync with FastAPI &amp; MongoDB
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mx-auto mb-3">
              <FiCheckCircle />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              No Alerts Match Current Filter
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              All cloud infrastructure parameters are operating normally, or no incidents match your selected filter criteria.
            </p>
            <button
              type="button"
              onClick={handleCreateTestSurge}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
            >
              Simulate a High User Surge Alert &rarr;
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getTypeIcon(alert.type)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getSeverityBadge(alert.severity)}
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {alert.type}
                      </span>
                      {alert.metric && (
                        <span className="text-[11px] font-mono text-slate-500">
                          Metric: <strong className="text-slate-800">{alert.metric}</strong>
                          {alert.value ? ` (${alert.value})` : ''}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <FiClock className="text-slate-400" />
                        <span>{alert.timestamp || 'Just now'}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="text-blue-600">Decision Support Advisory Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <span className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                    Logged
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
