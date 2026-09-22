import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuthModal from './components/AuthModal';
import AuthGate from './components/AuthGate';
import api from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'reports' | 'settings'
  const [isOnline, setIsOnline] = useState(true);
  const [user, setUser] = useState<any>(() => api.getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Shared application state
  const [summary, setSummary] = useState({
    current_cpu: 44.5,
    current_ram: 58.2,
    disk: 42.0,
    network: 39.1,
    active_users: 850,
    request_rate: 1020.0,
    predicted_cpu: 45.1,
    predicted_ram: 57.8,
    prediction_horizon: "Next 15 minutes",
    status: "NORMAL",
    recommendation: "Resource utilization is within a normal range. Maintain current capacity.",
    severity: "NORMAL",
    anomaly_status: "NORMAL",
    is_anomaly: false,
    last_updated: new Date().toLocaleTimeString()
  });

  const [alerts, setAlerts] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);

  const fetchGlobalData = useCallback(async () => {
    try {
      const health = await api.getHealth();
      setIsOnline(health?.status === "ok");

      const summaryRes = await api.getDashboardSummary();
      if (summaryRes) setSummary(summaryRes);

      const alertsRes = await api.getAlerts(15);
      if (Array.isArray(alertsRes)) setAlerts(alertsRes);

      const perfRes = await api.getModelPerformance();
      if (perfRes && !perfRes.error) setPerformance(perfRes);
    } catch (err) {
      console.warn("Telemetry API sync note:", err);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  // Enforce strong authorization: Unregistered or signed-out users must authenticate first
  if (!user) {
    return (
      <AuthGate 
        onAuthSuccess={(authUser: any) => setUser(authUser)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans ambient-bg">
      {/* Persistent Top Navigation Bar */}
      <Navigation
        currentView={currentView}
        onNavigate={(viewId: string) => setCurrentView(viewId)}
        isOnline={isOnline}
        user={user}
        onOpenLogin={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
        onLogout={handleLogout}
      />

      {/* Auth Modal for Login & Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authUser: any) => setUser(authUser)}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            summary={summary}
            setSummary={setSummary}
            alerts={alerts}
            setAlerts={setAlerts}
            performance={performance}
            onOpenSettings={() => setCurrentView('settings')}
            onOpenReports={() => setCurrentView('reports')}
          />
        )}

        {currentView === 'reports' && (
          <Reports
            summary={summary}
            performance={performance}
            alerts={alerts}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            onSettingsSaved={(newConfig: any) => {
              console.log("Settings saved:", newConfig);
            }}
          />
        )}
      </main>

      {/* Modern Clean Footer matching reference */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-6 mt-12 text-center text-xs text-slate-500 font-monospace">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Cloud Resource AI &mdash; Machine Learning Decision Support System
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI Backend (Port 8008)</span>
            <span>&bull;</span>
            <span>Scikit-Learn (Random Forest &amp; Isolation Forest)</span>
            <span>&bull;</span>
            <span>Local Inference</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
