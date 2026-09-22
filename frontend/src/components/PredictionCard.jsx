import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiClock, FiCpu, FiServer } from 'react-icons/fi';

export default function PredictionCard({ type = "cpu", currentVal, predictedVal, horizon = "Next 15 minutes" }) {
  const isCpu = type === "cpu";
  const title = isCpu ? "Predicted CPU Utilization" : "Predicted RAM Utilization";
  const curr = Number(currentVal) || 0;
  const pred = Number(predictedVal) || 0;
  const delta = pred - curr;
  const isRising = delta > 0.5;
  const isDropping = delta < -0.5;

  let badgeColor = "bg-success bg-opacity-10 text-success border-success border-opacity-25";
  let barColor = "bg-primary";
  let statusText = "Stable Forecast";

  if (pred >= 90) {
    badgeColor = "bg-danger bg-opacity-20 text-danger border-danger border-opacity-40";
    barColor = "bg-danger";
    statusText = "CRITICAL FORECAST (>=90%)";
  } else if (pred >= 80) {
    badgeColor = "bg-warning bg-opacity-20 text-warning border-warning border-opacity-40";
    barColor = "bg-warning";
    statusText = "HIGH DEMAND EXPECTED (>=80%)";
  } else if (pred < 30) {
    badgeColor = "bg-info bg-opacity-10 text-info border-info border-opacity-25";
    barColor = "bg-info";
    statusText = "UNDERUTILIZED (<30%)";
  }

  return (
    <div className="card h-100 bg-dark bg-opacity-90 border border-secondary border-opacity-25 rounded-3 shadow-sm position-relative overflow-hidden">
      {/* Decorative accent top line */}
      <div className={`position-absolute top-0 start-0 w-100 ${barColor}`} style={{ height: '3px' }}></div>

      <div className="card-body p-3 p-md-4">
        {/* Header with Horizon Badge */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-2 bg-secondary bg-opacity-15 text-primary border border-secondary border-opacity-20">
              {isCpu ? <FiCpu className="fs-4 text-cyan" /> : <FiServer className="fs-4 text-purple" />}
            </div>
            <div>
              <span className="text-secondary small fw-semibold text-uppercase font-monospace tracking-wide" style={{ fontSize: '0.75rem' }}>
                {title}
              </span>
              <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.72rem' }}>
                <FiClock className="fs-7" />
                <span className="font-monospace">{horizon}</span>
              </div>
            </div>
          </div>

          <span className={`badge rounded-pill px-3 py-1 font-monospace border small ${badgeColor}`}>
            {statusText}
          </span>
        </div>

        {/* Prediction Main Value & Delta */}
        <div className="d-flex align-items-baseline justify-content-between mb-2">
          <div className="d-flex align-items-baseline gap-1">
            <span className="display-5 fw-bold font-monospace text-light">
              {pred.toFixed(1)}
            </span>
            <span className="fs-4 text-secondary font-monospace">%</span>
          </div>

          {/* Delta Pill */}
          <div className={`d-flex align-items-center gap-1 px-2 py-1 rounded-2 font-monospace small ${
            isRising ? 'text-warning bg-warning bg-opacity-10' : (isDropping ? 'text-info bg-info bg-opacity-10' : 'text-secondary bg-secondary bg-opacity-10')
          }`}>
            {isRising ? <FiTrendingUp className="fs-6" /> : (isDropping ? <FiTrendingDown className="fs-6" /> : null)}
            <span>{delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}</span>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>vs current</span>
          </div>
        </div>

        {/* Comparison Context Bar */}
        <div className="mb-2">
          <div className="d-flex justify-content-between text-muted small font-monospace mb-1" style={{ fontSize: '0.72rem' }}>
            <span>Current: {curr.toFixed(1)}%</span>
            <span>Forecast: {pred.toFixed(1)}%</span>
          </div>
          <div className="progress bg-secondary bg-opacity-20 rounded-pill" style={{ height: '8px' }}>
            <div 
              className={`progress-bar rounded-pill ${barColor}`} 
              role="progressbar" 
              style={{ width: `${Math.min(100, Math.max(0, pred))}%` }} 
              aria-valuenow={pred} 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        {/* Informational Subtext */}
        <div className="d-flex align-items-center justify-content-between text-secondary pt-2 border-top border-secondary border-opacity-15 font-monospace" style={{ fontSize: '0.72rem' }}>
          <span>Model: Random Forest Regressor</span>
          <span>Inference: Live API</span>
        </div>
      </div>
    </div>
  );
}
