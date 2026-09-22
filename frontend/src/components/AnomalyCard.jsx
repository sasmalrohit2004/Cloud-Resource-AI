import React from 'react';
import { FiActivity, FiAlertCircle, FiCheck, FiShield } from 'react-icons/fi';

export default function AnomalyCard({ anomalyData }) {
  const isAnomaly = anomalyData?.is_anomaly || anomalyData?.status === "ANOMALY DETECTED";
  const statusText = isAnomaly ? "ANOMALY DETECTED" : "NORMAL";
  const score = anomalyData?.score !== undefined ? anomalyData.score : 0.0;
  const affected = anomalyData?.affected_metric || "None";
  const message = anomalyData?.message || (isAnomaly ? "Unusual resource utilization pattern detected" : "Resource telemetry aligns with expected patterns");
  const severity = anomalyData?.severity || "NORMAL";

  return (
    <div className={`card h-100 bg-dark bg-opacity-90 rounded-3 shadow-sm border ${
      isAnomaly ? 'border-danger border-opacity-60' : 'border-secondary border-opacity-25'
    }`}>
      <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <div className={`p-2 rounded-2 ${isAnomaly ? 'bg-danger bg-opacity-20 text-danger' : 'bg-success bg-opacity-15 text-success'}`}>
                {isAnomaly ? <FiAlertCircle className="fs-5" /> : <FiCheck className="fs-5" />}
              </div>
              <div>
                <h5 className="mb-0 fw-bold text-light font-monospace">Anomaly Detection</h5>
                <small className="text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                  Model: Isolation Forest (Contamination: 3.5%)
                </small>
              </div>
            </div>

            <span className={`badge rounded-pill px-3 py-1 font-monospace fw-bold ${
              isAnomaly ? 'bg-danger text-white' : 'bg-success bg-opacity-20 text-success border border-success border-opacity-30'
            }`}>
              {statusText}
            </span>
          </div>

          <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20 my-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary small font-monospace" style={{ fontSize: '0.72rem' }}>
                BEHAVIORAL PROFILE:
              </span>
              <span className={`badge font-monospace ${isAnomaly ? 'bg-danger' : 'bg-secondary'} small`} style={{ fontSize: '0.7rem' }}>
                Severity: {severity}
              </span>
            </div>
            <p className="fw-medium text-light mb-0 small lh-base">
              {message}
            </p>
          </div>

          {/* Metric Details */}
          <div className="row g-2 mt-1">
            <div className="col-6">
              <div className="p-2 rounded-2 bg-dark bg-opacity-40 border border-secondary border-opacity-15">
                <span className="text-secondary small font-monospace d-block" style={{ fontSize: '0.68rem' }}>
                  AFFECTED METRIC
                </span>
                <span className="fw-bold font-monospace text-light small">
                  {affected}
                </span>
              </div>
            </div>
            <div className="col-6">
              <div className="p-2 rounded-2 bg-dark bg-opacity-40 border border-secondary border-opacity-15">
                <span className="text-secondary small font-monospace d-block" style={{ fontSize: '0.68rem' }}>
                  DECISION SCORE
                </span>
                <span className="fw-bold font-monospace text-light small">
                  {typeof score === 'number' ? score.toFixed(4) : score}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Essential Academic Disclaimer */}
        <div className="p-2 mt-3 rounded-2 bg-dark bg-opacity-70 border border-secondary border-opacity-20 d-flex align-items-start gap-2 text-secondary small" style={{ fontSize: '0.72rem' }}>
          <FiShield className="flex-shrink-0 mt-0.5 text-cyan" />
          <span>
            <strong>Project Note:</strong> Anomalies indicate statistical deviation from workload baselines (e.g. runaway threads or sudden traffic divergences). It is purely a resource telemetry assessment.
          </span>
        </div>
      </div>
    </div>
  );
}
