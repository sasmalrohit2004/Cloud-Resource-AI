import React from 'react';
import { FiCpu, FiHardDrive, FiWifi, FiServer } from 'react-icons/fi';

export default function MetricCard({ title, value, unit = "%", iconType, threshold = 80, isSimulated = false }) {
  const numValue = Number(value) || 0;
  
  // Status level evaluation
  let statusText = "Normal";
  let statusColor = "text-success";
  let bgProgressBar = "bg-success";
  let borderClass = "border-secondary border-opacity-25";

  if (numValue >= 90) {
    statusText = "Critical";
    statusColor = "text-danger";
    bgProgressBar = "bg-danger";
    borderClass = "border-danger border-opacity-50";
  } else if (numValue >= threshold) {
    statusText = "Elevated";
    statusColor = "text-warning";
    bgProgressBar = "bg-warning";
    borderClass = "border-warning border-opacity-40";
  } else if (numValue < 25) {
    statusText = "Low";
    statusColor = "text-info";
    bgProgressBar = "bg-info";
  }

  const getIcon = () => {
    switch (iconType) {
      case 'cpu':
        return <FiCpu className="fs-4 text-cyan" />;
      case 'ram':
        return <FiServer className="fs-4 text-purple" />;
      case 'disk':
        return <FiHardDrive className="fs-4 text-warning" />;
      case 'network':
        return <FiWifi className="fs-4 text-info" />;
      default:
        return <FiCpu className="fs-4 text-primary" />;
    }
  };

  return (
    <div className={`card h-100 bg-dark bg-opacity-75 border ${borderClass} rounded-3 shadow-sm transition-hover`}>
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 d-flex align-items-center justify-content-center">
              {getIcon()}
            </div>
            <div>
              <span className="text-secondary small fw-semibold text-uppercase font-monospace tracking-wider" style={{ fontSize: '0.72rem' }}>
                {title}
              </span>
              <div className="d-flex align-items-baseline gap-1">
                <h3 className="mb-0 fw-bold font-monospace text-light">
                  {numValue.toFixed(1)}
                </h3>
                <span className="text-secondary small font-monospace">{unit}</span>
              </div>
            </div>
          </div>
          
          <div className="text-end">
            <span className={`badge rounded-pill bg-dark border border-secondary border-opacity-25 px-2 py-1 small font-monospace ${statusColor}`}>
              ● {statusText}
            </span>
            {isSimulated && (
              <div className="text-muted" style={{ fontSize: '0.65rem' }}>SIMULATED</div>
            )}
          </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="progress bg-secondary bg-opacity-20 rounded-pill mt-2" style={{ height: '6px' }}>
          <div 
            className={`progress-bar rounded-pill ${bgProgressBar}`}
            role="progressbar" 
            style={{ width: `${Math.min(100, Math.max(0, numValue))}%` }}
            aria-valuenow={numValue} 
            aria-valuemin="0" 
            aria-valuemax="100"
          ></div>
        </div>
      </div>
    </div>
  );
}
