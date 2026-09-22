import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default function ErrorMessage({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-sm border border-danger border-opacity-25 bg-danger bg-opacity-10 text-danger" role="alert">
      <div className="d-flex align-items-center gap-2">
        <FiAlertTriangle className="fs-4 flex-shrink-0" />
        <div>
          <strong>System Notice: </strong> {error}
        </div>
      </div>
      {onRetry && (
        <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={onRetry}>
          <FiRefreshCw className="fs-6" /> Retry
        </button>
      )}
    </div>
  );
}
