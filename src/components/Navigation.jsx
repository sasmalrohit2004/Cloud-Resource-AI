import React from 'react';
import { 
  FiActivity, 
  FiBarChart2, 
  FiFileText, 
  FiSettings, 
  FiShield, 
  FiUser, 
  FiLogOut, 
  FiLogIn, 
  FiCpu,
  FiCheckCircle,
  FiBell
} from 'react-icons/fi';
import { IndianRupee } from 'lucide-react';

export default function Navigation({
  currentView = 'dashboard',
  onNavigate,
  isOnline = true,
  user,
  onOpenLogin,
  onLogout,
  alertsCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiActivity, count: 'Live', isLive: true },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: FiBell, 
      count: alertsCount > 0 ? String(alertsCount) : null,
      isAlert: alertsCount > 0
    },
    { id: 'finops', label: 'FinOps & Cost', icon: IndianRupee, count: 'Save ₹' },
    { id: 'reports', label: 'Reports', icon: FiFileText, count: null },
    { id: 'settings', label: 'System Settings', icon: FiSettings, count: null },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Inference Badge */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onNavigate('dashboard')} 
            className="cursor-pointer flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FiCpu className="text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  Cloud Resource AI
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 font-monospace">
                  ML Inference
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Persistent Segmented Navigation (Dashboard, Reports, System Settings) */}
        <nav className="flex items-center justify-center">
          <div className="flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`nav-link-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`text-sm ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.count && (
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.isAlert
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Telemetry Health Badge & User Session Controls */}
        <div className="flex items-center gap-2.5">
          {/* Active Status Badge matching uploaded image */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot"></span>
            <span className="font-monospace text-[11px]">2,484 Training Samples · Active</span>
          </div>

          {/* User profile or sign in */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 font-monospace">
                  {user.role}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out of operator session"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <FiLogOut className="text-base" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-xs"
            >
              <FiLogIn className="text-sm" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
