import React from 'react';
import { FiBell, FiAlertTriangle, FiAlertOctagon, FiInfo, FiCheckCircle } from 'react-icons/fi';

export default function AlertTable({ alerts = [] }) {
  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="badge bg-danger text-white font-monospace px-2 py-1">CRITICAL</span>;
      case 'HIGH':
        return <span className="badge bg-warning text-dark font-monospace px-2 py-1">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge bg-info text-dark font-monospace px-2 py-1">MEDIUM</span>;
      default:
        return <span className="badge bg-secondary font-monospace px-2 py-1">INFO</span>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ANOMALY':
        return <FiAlertTriangle className="text-warning fs-6" />;
      case 'CRITICAL_CAPACITY':
        return <FiAlertOctagon className="text-danger fs-6" />;
      default:
        return <FiBell className="text-info fs-6" />;
    }
  };

  return (
    <div className="card bg-dark bg-opacity-85 border border-secondary border-opacity-25 rounded-3 shadow-sm mb-4">
      <div className="card-header bg-dark bg-opacity-50 border-bottom border-secondary border-opacity-25 p-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 rounded-2 bg-danger bg-opacity-15 text-danger">
            <FiBell className="fs-5" />
          </div>
          <div>
            <h5 className="mb-0 fw-bold text-light font-monospace">Recent Resource Alerts & Events</h5>
            <small className="text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
              Persistent alerts logged from anomaly detector and critical threshold events
            </small>
          </div>
        </div>
        <span className="badge bg-secondary bg-opacity-25 text-light font-monospace">
          {alerts.length} Records
        </span>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive" style={{ maxHeight: '320px' }}>
          <table className="table table-dark table-hover mb-0 align-middle">
            <thead className="table-secondary table-opacity-10 text-secondary small text-uppercase font-monospace sticky-top">
              <tr>
                <th scope="col" className="ps-3" style={{ fontSize: '0.75rem', width: '22%' }}>Timestamp</th>
                <th scope="col" style={{ fontSize: '0.75rem', width: '18%' }}>Type</th>
                <th scope="col" style={{ fontSize: '0.75rem', width: '15%' }}>Severity</th>
                <th scope="col" className="pe-3" style={{ fontSize: '0.75rem' }}>Message</th>
              </tr>
            </thead>
            <tbody className="font-monospace small">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-secondary">
                    No critical events or anomalies recorded in current session.
                  </td>
                </tr>
              ) : (
                alerts.map((alert, idx) => (
                  <tr key={idx} className="border-bottom border-secondary border-opacity-10">
                    <td className="ps-3 text-secondary text-nowrap" style={{ fontSize: '0.78rem' }}>
                      {alert.timestamp}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        {getTypeIcon(alert.type)}
                        <span className="fw-semibold text-light">{alert.type}</span>
                      </div>
                    </td>
                    <td>
                      {getSeverityBadge(alert.severity)}
                    </td>
                    <td className="pe-3 text-light text-wrap">
                      {alert.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
