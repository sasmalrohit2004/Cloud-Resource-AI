import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiArrowDownCircle, FiAlertOctagon } from 'react-icons/fi';

export default function StatusCard({ status = "NORMAL", severity = "NORMAL" }) {
  let config = {
    title: "NORMAL STATUS",
    desc: "Infrastructure workloads are well-balanced within standard operating limits.",
    icon: <FiCheckCircle className="fs-1 text-success" />,
    border: "border-success border-opacity-50",
    bg: "bg-success bg-opacity-10",
    badge: "bg-success text-white",
    badgeLabel: "STATUS: NORMAL",
    accentGlow: "glow-success"
  };

  if (status === "CRITICAL") {
    config = {
      title: "CRITICAL LOAD DETECTED",
      desc: "Predicted resource usage exceeds 90%. Severe saturation risks imminent service degradation.",
      icon: <FiAlertOctagon className="fs-1 text-danger" />,
      border: "border-danger border-opacity-75",
      bg: "bg-danger bg-opacity-15",
      badge: "bg-danger text-white",
      badgeLabel: "STATUS: CRITICAL (>=90%)",
      accentGlow: "glow-danger"
    };
  } else if (status === "HIGH_USAGE_EXPECTED") {
    config = {
      title: "HIGH USAGE EXPECTED",
      desc: "Predicted utilization exceeds 80%. High traffic anticipated in the next 15-minute horizon.",
      icon: <FiAlertTriangle className="fs-1 text-warning" />,
      border: "border-warning border-opacity-60",
      bg: "bg-warning bg-opacity-15",
      badge: "bg-warning text-dark",
      badgeLabel: "STATUS: HIGH USAGE (>=80%)",
      accentGlow: "glow-warning"
    };
  } else if (status === "LOW_UTILIZATION") {
    config = {
      title: "LOW UTILIZATION",
      desc: "Predicted CPU and RAM are both below 30%. Potential compute over-provisioning.",
      icon: <FiArrowDownCircle className="fs-1 text-info" />,
      border: "border-info border-opacity-50",
      bg: "bg-info bg-opacity-10",
      badge: "bg-info text-dark",
      badgeLabel: "STATUS: LOW (<30%)",
      accentGlow: "glow-info"
    };
  }

  return (
    <div className={`card h-100 border ${config.border} ${config.bg} rounded-3 shadow-sm position-relative overflow-hidden`}>
      <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className={`badge rounded-pill px-3 py-1 font-monospace fw-bold ${config.badge}`}>
              {config.badgeLabel}
            </span>
            <span className="text-secondary small font-monospace" style={{ fontSize: '0.75rem' }}>
              SEVERITY: {severity}
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 my-2">
            <div className="p-2 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-25 flex-shrink-0">
              {config.icon}
            </div>
            <div>
              <h4 className="fw-bold text-light mb-1 font-monospace">
                {config.title}
              </h4>
              <p className="text-secondary small mb-0">
                {config.desc}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-2 border-top border-secondary border-opacity-20 d-flex justify-content-between align-items-center">
          <span className="small text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
            Decision Support Rule Engine
          </span>
          <span className="badge bg-dark border border-secondary border-opacity-25 text-light font-monospace" style={{ fontSize: '0.7rem' }}>
            Evaluated ~15m Ahead
          </span>
        </div>
      </div>
    </div>
  );
}
