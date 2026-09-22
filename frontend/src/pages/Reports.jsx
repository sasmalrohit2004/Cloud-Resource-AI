import React, { useState } from 'react';
import { 
  FiFileText, 
  FiDownload, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiTrendingUp, 
  FiCpu, 
  FiDatabase, 
  FiCalendar, 
  FiPrinter,
  FiFilter
} from 'react-icons/fi';

export default function Reports({ summary, performance, alerts }) {
  const alertList = alerts || [];
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sample historical report data
  const incidentRecords = [
    {
      id: 'INC-9021',
      timestamp: '2026-09-22 03:45:12',
      metric: 'CPU Compute Spike',
      score: -0.142,
      severity: 'HIGH',
      status: 'RESOLVED',
      details: 'Spike to 94.2% CPU triggered without proportional request increase. Isolation Forest detected outlier.'
    },
    {
      id: 'INC-8984',
      timestamp: '2026-09-21 14:12:00',
      metric: 'Memory Pressure',
      score: -0.098,
      severity: 'WARNING',
      status: 'RESOLVED',
      details: 'RAM sustained > 82% across 3 consecutive evaluation cycles during afternoon traffic surge.'
    },
    {
      id: 'INC-8812',
      timestamp: '2026-09-20 09:30:22',
      metric: 'Network Ingress Saturation',
      score: -0.084,
      severity: 'MODERATE',
      status: 'RESOLVED',
      details: 'Unusual telemetry packet surge flagged in ingress load before load balancer rebalanced nodes.'
    }
  ];

  const handleExportData = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      system: "Cloud Resource AI Decision Support Engine",
      summary: summary,
      mlPerformance: performance,
      incidents: incidentRecords
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloud-resource-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 mb-2">
            <FiFileText className="text-sm" />
            <span>Auditing & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cloud Telemetry & Performance Reports
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Historical capacity utilization, machine learning forecasting accuracy, and anomaly audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <FiPrinter className="text-slate-500" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
          >
            <FiDownload />
            <span>Export Report (JSON)</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm font-medium">
          <FiCheckCircle className="text-emerald-600 text-lg flex-shrink-0" />
          <span>Report successfully compiled and downloaded to your local device.</span>
        </div>
      )}

      {/* KPI Overview Pills Card */}
      <div className="ref-card p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-100">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">
              Historical Datapoints
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-monospace">
              2,484
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              99.98% Data Completeness
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">
              Random Forest R² (RAM)
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 font-monospace">
              {performance?.ram_model?.r2 ? performance.ram_model.r2.toFixed(2) : '0.94'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              High variance explanation
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">
              CPU MAE Accuracy
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600 font-monospace">
              ±{performance?.cpu_model?.mae ? performance.cpu_model.mae.toFixed(1) : '4.7'}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Tight forecast band
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">
              Audit Incidents
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 font-monospace">
              {incidentRecords.length}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              All 100% Mitigated
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Executive Summary & ML Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Executive Summary Card */}
        <div className="ref-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiTrendingUp className="text-blue-600" />
              <span>Executive Resource Efficiency Summary</span>
            </h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Optimal Band
            </span>
          </div>
          
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              Telemetry aggregated over the reporting period demonstrates healthy operational headroom. 
              The diurnal workload cycle indicates standard enterprise business hour spikes (09:00 - 18:00 UTC) 
              with CPU and RAM averaging <strong className="text-slate-900">44.5%</strong> and <strong className="text-slate-900">58.2%</strong> respectively.
            </p>
            <p>
              Machine Learning predictions from the Random Forest regressor projected near-term CPU utilization at <strong className="text-slate-900">{summary?.predicted_cpu ?? 45.1}%</strong>, 
              well below the 80% threshold requiring scaling intervention.
            </p>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Peak CPU Recorded</span>
                <span className="font-bold text-slate-900 font-monospace text-sm">84.5%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Peak RAM Recorded</span>
                <span className="font-bold text-slate-900 font-monospace text-sm">88.2%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Avg Request Rate</span>
                <span className="font-bold text-slate-900 font-monospace text-sm">1,020 req/s</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Decision Mode</span>
                <span className="font-bold text-emerald-700 font-monospace text-sm">Advisory Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Machine Learning Model Performance Card */}
        <div className="ref-card p-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FiCpu className="text-purple-600" />
            <span>ML Model Scorecard</span>
          </h2>

          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Random Forest (CPU Regressor)</span>
                <span className="font-monospace text-blue-600">R²: 0.74</span>
              </div>
              <div className="text-[11px] text-slate-500">
                MAE: 4.66% &bull; RMSE: 6.70% (80/20 Test Split)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Random Forest (RAM Regressor)</span>
                <span className="font-monospace text-emerald-600">R²: 0.94</span>
              </div>
              <div className="text-[11px] text-slate-500">
                MAE: 1.51% &bull; RMSE: 2.92% (80/20 Test Split)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Isolation Forest (Anomaly)</span>
                <span className="font-monospace text-indigo-600">Contamination: 0.05</span>
              </div>
              <div className="text-[11px] text-slate-500">
                100 Estimators &bull; Multi-variate feature space
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Incident Audit Table */}
      <div className="ref-card overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Chronological Anomaly & Outlier Audit Log
            </h2>
            <p className="text-xs text-slate-500">
              Detected by the Isolation Forest model and validated against telemetry baselines
            </p>
          </div>
          <span className="text-xs font-monospace text-slate-500">
            Showing {incidentRecords.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Metric / Anomaly Type</th>
                <th className="py-3 px-4">Anomaly Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidentRecords.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-monospace font-semibold text-slate-900 text-xs">
                    {inc.id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs font-monospace">
                    {inc.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 text-xs">
                    <div>{inc.metric}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{inc.details}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-monospace font-semibold text-rose-600">
                    {inc.score}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold font-monospace ${
                      inc.severity === 'HIGH' 
                        ? 'bg-rose-100 text-rose-700'
                        : inc.severity === 'WARNING'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <FiCheckCircle className="text-sm" />
                      <span>{inc.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
