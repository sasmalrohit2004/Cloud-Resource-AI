import React from 'react';
import { FiCompass, FiInfo, FiCheckSquare, FiSliders } from 'react-icons/fi';

export default function RecommendationCard({ recommendation, status }) {
  const defaultRec = "Resource utilization is within a normal range. Maintain current capacity.";
  const activeRec = recommendation || defaultRec;

  let headerColor = "text-primary";
  let borderAccent = "border-primary border-opacity-30";
  let suggestedActionTitle = "Suggested Resource Action";

  if (status === "CRITICAL") {
    headerColor = "text-danger";
    borderAccent = "border-danger border-opacity-40";
    suggestedActionTitle = "Immediate Scaling & Investigation Action";
  } else if (status === "HIGH_USAGE_EXPECTED") {
    headerColor = "text-warning";
    borderAccent = "border-warning border-opacity-40";
    suggestedActionTitle = "Proactive Provisioning Action";
  } else if (status === "LOW_UTILIZATION") {
    headerColor = "text-info";
    borderAccent = "border-info border-opacity-40";
    suggestedActionTitle = "Capacity Consolidation Action";
  }

  return (
    <div className={`card h-100 bg-dark bg-opacity-90 border ${borderAccent} rounded-3 shadow-sm`}>
      <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-2 bg-primary bg-opacity-15 text-primary">
                <FiCompass className="fs-5 text-cyan" />
              </div>
              <h5 className="card-title fw-bold text-light mb-0 font-monospace">
                Optimization Recommendation
              </h5>
            </div>
            <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25 small font-monospace">
              ADVISORY ENGINE
            </span>
          </div>

          <div className="p-3 rounded-3 bg-dark bg-opacity-70 border border-secondary border-opacity-20 my-2">
            <span className="text-secondary small fw-semibold text-uppercase font-monospace d-block mb-1" style={{ fontSize: '0.72rem' }}>
              {suggestedActionTitle}
            </span>
            <p className="fs-6 fw-semibold text-light mb-0 lh-base">
              "{activeRec}"
            </p>
          </div>

          <div className="mt-3">
            <h6 className="text-secondary small fw-bold text-uppercase font-monospace mb-2" style={{ fontSize: '0.72rem' }}>
              Operational Impact
            </h6>
            <ul className="list-unstyled small text-secondary mb-0 d-flex flex-column gap-1">
              <li className="d-flex align-items-start gap-2">
                <FiCheckSquare className="text-success mt-1 flex-shrink-0" />
                <span>Forecasted resource headroom evaluated ~15 minutes prior to peak.</span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <FiSliders className="text-primary mt-1 flex-shrink-0" />
                <span>Enables administrators to provision or balance nodes proactively without latency shock.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Safety Disclaimer */}
        <div className="p-2 mt-3 rounded-2 bg-warning bg-opacity-10 border border-warning border-opacity-20 d-flex align-items-center gap-2 text-warning small font-monospace" style={{ fontSize: '0.72rem' }}>
          <FiInfo className="flex-shrink-0 fs-6" />
          <span>Notice: This is a decision-support system. It does NOT automatically mutate live production infrastructure.</span>
        </div>
      </div>
    </div>
  );
}
