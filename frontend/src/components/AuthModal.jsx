import React, { useState } from 'react';
import { FiLock, FiMail, FiUser, FiShield, FiX, FiCheckCircle, FiLogIn, FiUserPlus } from 'react-icons/fi';
import api from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Cloud Engineer');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'register') {
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
        setSuccessMessage(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 500);
      } else {
        const user = await api.register({ name, email, password, role });
        setSuccessMessage(`Account registered successfully for ${user.name}! Authorizing session...`);
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 500);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed. Please check credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass, demoRole) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    if (demoRole) setRole(demoRole);
    setErrorMessage('');
  };

  const isUnregisteredError = errorMessage.toLowerCase().includes('not found') || 
                              errorMessage.toLowerCase().includes('register first') ||
                              errorMessage.toLowerCase().includes('need to register');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-100">
              <FiShield />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'login' ? 'Operator Sign In' : 'Register Operator Account'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Role-Based Access &amp; Session Control
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-slate-100 mx-5 mt-4 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            type="button"
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => { setMode('login'); setErrorMessage(''); }}
          >
            <FiLogIn />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => { setMode('register'); setErrorMessage(''); }}
          >
            <FiUserPlus />
            <span>Register</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
              <div className="flex items-start justify-between gap-2">
                <span>{errorMessage}</span>
              </div>
              {mode === 'login' && isUnregisteredError && (
                <div className="mt-2.5 pt-2 border-t border-rose-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-rose-600">Don't have an account yet?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                    }}
                    className="px-2.5 py-1 text-[11px] font-sans font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-xs"
                  >
                    Register This Email &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono flex items-center gap-2">
              <FiCheckCircle />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-slate-400 text-sm" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Dr. Robert Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-slate-400 text-sm" />
                <input
                  type="email"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="operator@cloudai.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {mode === 'register' && (
                  <span className="text-[10px] text-slate-400 font-mono">Min 6 characters</span>
                )}
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-slate-400 text-sm" />
                <input
                  type="password"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === 'register' ? 6 : undefined}
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3 text-slate-400 text-sm" />
                  <input
                    type="password"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin"></span>
              ) : mode === 'login' ? (
                <>
                  <FiLogIn />
                  <span>Authorize Session</span>
                </>
              ) : (
                <>
                  <FiUserPlus />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* 1-Click Preset Demonstration Credentials */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              1-Click Demo Credentials:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                onClick={() => handleQuickDemo('admin@cloudai.io', 'admin123', 'DevOps & Cloud Lead')}
              >
                Admin
              </button>
              <button
                type="button"
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                onClick={() => handleQuickDemo('evaluator@university.edu', 'password123', 'Viva / Project Evaluator')}
              >
                Viva Evaluator
              </button>
              <button
                type="button"
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                onClick={() => handleQuickDemo('devops@cloudai.io', 'password123', 'Cloud Engineer')}
              >
                Engineer
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
