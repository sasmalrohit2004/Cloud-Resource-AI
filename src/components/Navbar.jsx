import React from 'react';
import { FiCpu, FiRefreshCw, FiActivity, FiUser, FiLogOut, FiLogIn, FiUserPlus, FiShield } from 'react-icons/fi';

export default function Navbar({ 
  isOnline, 
  isRefreshing, 
  onRefresh, 
  autoRefresh, 
  onToggleAutoRefresh,
  user,
  onOpenLogin,
  onOpenRegister,
  onLogout
}) {
  return (
    <nav className="navbar navbar-expand-lg border-bottom border-secondary border-opacity-25 bg-dark bg-opacity-95 sticky-top backdrop-blur py-2 px-3 mb-3">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-2">
        {/* Brand & Subtitle */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-15 text-primary rounded-3 p-2 border border-primary border-opacity-30 shadow-sm">
            <FiCpu className="fs-3 text-cyan" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="navbar-brand mb-0 h5 fw-bold text-light tracking-tight">
                AI Cloud Resource Optimizer
              </span>
              <span className="badge rounded-pill bg-warning text-dark fw-bold px-2 py-1 fs-7 shadow-xs">
                SIMULATION MODE
              </span>
            </div>
            <p className="text-secondary small mb-0 font-monospace" style={{ fontSize: '0.78rem' }}>
              ML-Based Resource Utilization Prediction & Optimization (College PBL Demonstration)
            </p>
          </div>
        </div>

        {/* Status Indicators, User Auth & Controls */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Backend Status Badge */}
          <div className={`badge rounded-pill d-flex align-items-center gap-1 py-2 px-3 border ${
            isOnline 
              ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25' 
              : 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'
          }`}>
            <span className={`rounded-circle d-inline-block ${isOnline ? 'bg-success pulse-dot' : 'bg-danger'}`} style={{ width: '8px', height: '8px' }}></span>
            <span className="fw-semibold font-monospace" style={{ fontSize: '0.8rem' }}>
              {isOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
            </span>
          </div>

          {/* Model Horizon Pill */}
          <div className="badge rounded-pill bg-info bg-opacity-10 text-info border border-info border-opacity-25 py-2 px-3 d-none d-xl-flex align-items-center gap-1 font-monospace" style={{ fontSize: '0.8rem' }}>
            <FiActivity className="fs-6" />
            <span>HORIZON: ~15 MIN</span>
          </div>

          {/* Auto-Refresh Toggle */}
          <button 
            type="button" 
            className={`btn btn-sm px-3 py-1 rounded-pill border ${
              autoRefresh 
                ? 'btn-outline-info text-info bg-info bg-opacity-10 border-info border-opacity-25' 
                : 'btn-outline-secondary'
            }`}
            onClick={onToggleAutoRefresh}
            title="Toggle continuous telemetry refresh"
          >
            <small className="font-monospace">{autoRefresh ? 'Auto: 8s ON' : 'Auto: OFF'}</small>
          </button>

          {/* Refresh Action */}
          <button 
            className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-xs"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <FiRefreshCw className={`fs-6 ${isRefreshing ? 'spin' : ''}`} />
            <span className="small">Sync</span>
          </button>

          {/* User Authorization Profile or Sign In Actions */}
          <div className="ms-lg-2 ps-lg-2 border-start border-secondary border-opacity-30 d-flex align-items-center gap-2">
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <div className="text-end d-none d-sm-block">
                  <div className="d-flex align-items-center justify-content-end gap-1">
                    <span className="small fw-semibold text-light font-monospace">{user.name}</span>
                    <span className="badge bg-primary bg-opacity-20 text-info border border-info border-opacity-30 px-2 py-0.5 font-monospace" style={{ fontSize: '0.68rem' }}>
                      {user.role}
                    </span>
                  </div>
                  <span className="text-secondary font-monospace" style={{ fontSize: '0.7rem' }}>
                    {user.email}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1 d-flex align-items-center gap-1 font-monospace"
                  onClick={onLogout}
                  title="Sign out of operator session"
                  style={{ fontSize: '0.78rem' }}
                >
                  <FiLogOut />
                  <span className="d-none d-md-inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-3 py-1 d-flex align-items-center gap-1 font-monospace fw-semibold shadow-xs"
                  onClick={onOpenLogin}
                  style={{ fontSize: '0.8rem' }}
                >
                  <FiLogIn />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1 font-monospace text-light"
                  onClick={onOpenRegister}
                  style={{ fontSize: '0.8rem' }}
                >
                  <FiUserPlus />
                  <span className="d-none d-sm-inline ms-1">Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
