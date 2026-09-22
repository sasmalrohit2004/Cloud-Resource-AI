import React, { useState } from 'react';
import { 
  FiCpu, 
  FiShield, 
  FiMail, 
  FiLock, 
  FiUser, 
  FiLogIn, 
  FiUserPlus, 
  FiCheckCircle, 
  FiAlertCircle,
  FiArrowRight,
  FiActivity,
  FiServer
} from 'react-icons/fi';
import api from '../services/api';

export default function AuthGate({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Cloud Engineer');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your password.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await api.login({ email, password });
        setSuccessMessage(`Authorization verified. Welcome back, ${user.name}!`);
        setTimeout(() => {
          onAuthSuccess(user);
        }, 400);
      } else {
        const user = await api.register({ name, email, password, role });
        setSuccessMessage(`Account successfully registered for ${user.name}! Granting operator access...`);
        setTimeout(() => {
          onAuthSuccess(user);
        }, 400);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass, demoRole) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    if (demoRole) setRole(demoRole);
    setErrorMessage('');
  };

  const isUnregisteredError = errorMessage.toLowerCase().includes('not found') || 
                              errorMessage.toLowerCase().includes('register first') ||
                              errorMessage.toLowerCase().includes('need to register');

  const isDuplicateError = errorMessage.toLowerCase().includes('already exists');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 ambient-bg">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-4">
          <FiCpu className="text-2xl" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cloud Resource AI
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          ML-Based Resource Utilization Prediction &amp; Optimization System
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FiShield className="text-blue-600" />
          <span>Restricted Operator Gateway &middot; Authorization Required</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
        
        {/* Mode Switcher Tabs */}
        <div className="p-2 bg-slate-100/90 border-b border-slate-200/80 grid grid-cols-2 gap-1.5 text-xs font-bold">
          <button
            type="button"
            id="tab-sign-in"
            onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FiLogIn className={mode === 'login' ? 'text-blue-600' : ''} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            id="tab-register"
            onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FiUserPlus className={mode === 'register' ? 'text-blue-600' : ''} />
            <span>Register Account</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-7">
          
          {/* Informational Guidance */}
          <div className="mb-5 text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                Sign in with your registered operator credentials. If you have not created an account yet, you must register first.
              </p>
            ) : (
              <p>
                Register once with your role to activate personalized access to the Random Forest prediction engines and telemetry simulators.
              </p>
            )}
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="text-rose-600 text-sm mt-0.5 shrink-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>

              {/* Actionable Switch CTA if unregistered */}
              {mode === 'login' && isUnregisteredError && (
                <div className="mt-3 pt-2.5 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-[11px] font-sans text-rose-700">Need to register first?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                    }}
                    className="px-2.5 py-1 text-[11px] font-sans font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    <span>Register This Account</span>
                    <FiArrowRight className="text-xs" />
                  </button>
                </div>
              )}

              {/* Switch CTA if already exists */}
              {mode === 'register' && isDuplicateError && (
                <div className="mt-3 pt-2.5 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-[11px] font-sans text-rose-700">Already registered?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="px-2.5 py-1 text-[11px] font-sans font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    <span>Sign In Now</span>
                    <FiArrowRight className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <FiCheckCircle className="text-emerald-600 text-base shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                  <input
                    type="text"
                    id="input-name"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                <input
                  type="email"
                  id="input-email"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="operator@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {mode === 'register' && (
                  <span className="text-[10px] text-slate-400 font-mono">Min 6 characters</span>
                )}
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                <input
                  type="password"
                  id="input-password"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === 'register' ? 6 : undefined}
                  required
                />
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                  <input
                    type="password"
                    id="input-confirm-password"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            {/* Assigned Role (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Operational Role
                </label>
                <select
                  id="select-role"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Cloud Engineer">Cloud Engineer</option>
                  <option value="DevOps & Cloud Lead">DevOps & Cloud Lead</option>
                  <option value="System Administrator">System Administrator</option>
                  <option value="Viva / Project Evaluator">Viva / Project Evaluator</option>
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-3 disabled:opacity-75 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin"></span>
              ) : mode === 'login' ? (
                <>
                  <FiLogIn />
                  <span>Authorize &amp; Enter System</span>
                </>
              ) : (
                <>
                  <FiUserPlus />
                  <span>Register &amp; Activate Session</span>
                </>
              )}
            </button>
          </form>

          {/* Demonstration Quick Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pre-Registered Demo Credentials
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                className="p-2 text-center rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/80 transition-colors"
                onClick={() => {
                  setMode('login');
                  handleQuickFill('admin@cloudai.io', 'admin123', 'DevOps & Cloud Lead');
                }}
              >
                <div className="text-[11px] font-bold">Admin</div>
                <div className="text-[9px] text-blue-600 font-mono">admin123</div>
              </button>

              <button
                type="button"
                className="p-2 text-center rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 transition-colors"
                onClick={() => {
                  setMode('login');
                  handleQuickFill('evaluator@university.edu', 'password123', 'Viva / Project Evaluator');
                }}
              >
                <div className="text-[11px] font-bold">Evaluator</div>
                <div className="text-[9px] text-amber-600 font-mono">password123</div>
              </button>

              <button
                type="button"
                className="p-2 text-center rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80 transition-colors"
                onClick={() => {
                  setMode('login');
                  handleQuickFill('devops@cloudai.io', 'password123', 'Cloud Engineer');
                }}
              >
                <div className="text-[11px] font-bold">Engineer</div>
                <div className="text-[9px] text-slate-500 font-mono">password123</div>
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 text-center font-mono">
              Unregistered accounts must click "Register Account" tab first.
            </p>
          </div>

        </div>

      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center text-xs text-slate-400 font-mono">
        Cloud Resource AI &middot; ML-Powered Decision Support Engine &middot; Secure Session Storage
      </div>

    </div>
  );
}
