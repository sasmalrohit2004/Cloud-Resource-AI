import React from 'react';

export default function LoadingSpinner({ message = "Processing telemetry..." }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-4 text-center">
      <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <small className="text-secondary fw-medium">{message}</small>
    </div>
  );
}
