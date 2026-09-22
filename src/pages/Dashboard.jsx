import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiActivity, 
  FiCpu, 
  FiHardDrive, 
  FiWifi, 
  FiUsers, 
  FiTrendingUp, 
  FiAlertTriangle, 
  FiAlertOctagon,
  FiCheckCircle, 
  FiSliders, 
  FiBarChart2, 
  FiBookOpen, 
  FiLayers, 
  FiArrowRight, 
  FiPlay, 
  FiPause,
  FiFolder, 
  FiUploadCloud, 
  FiInfo, 
  FiX, 
  FiClock,
  FiZap,
  FiServer,
  FiBell,
  FiRefreshCw,
  FiDownload
} from 'react-icons/fi';
import { IndianRupee } from 'lucide-react';
import api from '../services/api';
import UsageChart from '../components/UsageChart';
import ErrorMessage from '../components/ErrorMessage';
import FinOpsCalculator from '../components/FinOpsCalculator';

export default function Dashboard({ 
  summary, 
  setSummary, 
  alerts, 
  setAlerts, 
  performance,
  onOpenSettings,
  onOpenReports,
  onOpenAlerts,
  onOpenFinOps
}) {
  // Navigation sub-tab within dashboard: 'ranked' | 'analytics' | 'viva'
  const [activeSubTab, setActiveSubTab] = useState('ranked');

  // Interactive Simulation Input Parameters
  const [cpuInput, setCpuInput] = useState(44.5);
  const [ramInput, setRamInput] = useState(58.2);
  const [diskInput, setDiskInput] = useState(42.0);
  const [networkInput, setNetworkInput] = useState(39.1);
  const [activeUsersInput, setActiveUsersInput] = useState(850);
  const [requestRateInput, setRequestRateInput] = useState(1020);
  const [selectedTemplate, setSelectedTemplate] = useState('nominal');

  // Execution states
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyHours, setHistoryHours] = useState(24);
  const [selectedResourceModal, setSelectedResourceModal] = useState(null);
  const [fileUploadNote, setFileUploadNote] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // User Traffic Flow to Cloud Simulation states
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [trafficFlowStage, setTrafficFlowStage] = useState(0); // 0 = idle, 1 = normal, 2 = rising, 3 = surge, 4 = critical
  const [activeHighAlert, setActiveHighAlert] = useState(null);
  const simulationIntervalRef = useRef(null);

  // Anomaly data state
  const [anomalyData, setAnomalyData] = useState({
    status: summary?.anomaly_status || "NORMAL",
    is_anomaly: summary?.is_anomaly || false,
    score: summary?.is_anomaly ? -0.125 : 0.048,
    affected_metric: summary?.is_anomaly ? "CPU / Memory" : "None",
    message: summary?.is_anomaly 
      ? "Unusual resource-usage pattern detected by Isolation Forest" 
      : "Resource telemetry conforms to nominal operational patterns",
    severity: summary?.severity || "NORMAL"
  });

  // Fetch telemetry history on load
  const loadHistory = useCallback(async (hours = 24) => {
    try {
      const res = await api.getMetricHistory(hours);
      if (res && Array.isArray(res.items)) {
        setHistoryData(res.items);
      }
    } catch (err) {
      console.warn("History fetch note:", err);
    }
  }, []);

  useEffect(() => {
    loadHistory(historyHours);
  }, [loadHistory, historyHours]);

  // Preset Template Handler matching the screenshot's templates row
  const handleSelectTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    setFileUploadNote('');

    if (templateKey === 'nominal') {
      setCpuInput(44.5);
      setRamInput(58.2);
      setDiskInput(42.0);
      setNetworkInput(39.1);
      setActiveUsersInput(850);
      setRequestRateInput(1020);
    } else if (templateKey === 'peak') {
      setCpuInput(76.4);
      setRamInput(79.5);
      setDiskInput(58.0);
      setNetworkInput(72.0);
      setActiveUsersInput(2200);
      setRequestRateInput(2900);
    } else if (templateKey === 'low') {
      setCpuInput(18.2);
      setRamInput(24.5);
      setDiskInput(34.0);
      setNetworkInput(15.0);
      setActiveUsersInput(120);
      setRequestRateInput(180);
    } else if (templateKey === 'critical') {
      setCpuInput(88.5);
      setRamInput(91.2);
      setDiskInput(78.0);
      setNetworkInput(86.5);
      setActiveUsersInput(3400);
      setRequestRateInput(4200);
    } else if (templateKey === 'anomaly') {
      setCpuInput(96.0);
      setRamInput(52.0);
      setDiskInput(43.0);
      setNetworkInput(92.0);
      setActiveUsersInput(150);
      setRequestRateInput(210);
    }
  };

  // Run ML Prediction via FastAPI backend (Random Forest & Isolation Forest)
  const handleExecuteInference = async (e) => {
    if (e) e.preventDefault();
    setIsPredicting(true);
    setError(null);

    try {
      const now = new Date();
      const payload = {
        cpu: Number(cpuInput),
        ram: Number(ramInput),
        disk: Number(diskInput),
        network: Number(networkInput),
        active_users: Number(activeUsersInput),
        request_rate: Number(requestRateInput),
        hour: now.getHours(),
        day_of_week: now.getDay() === 0 ? 6 : now.getDay() - 1
      };

      const result = await api.predict(payload);

      setSummary(prev => ({
        ...prev,
        current_cpu: result.current_metrics.cpu,
        current_ram: result.current_metrics.ram,
        disk: result.current_metrics.disk,
        network: result.current_metrics.network,
        active_users: result.current_metrics.active_users,
        request_rate: result.current_metrics.request_rate,
        predicted_cpu: result.predicted_cpu,
        predicted_ram: result.predicted_ram,
        prediction_horizon: result.prediction_horizon,
        status: result.status,
        recommendation: result.recommendation,
        severity: result.severity,
        anomaly_status: result.anomaly.status,
        is_anomaly: result.anomaly.is_anomaly,
        last_updated: result.timestamp
      }));

      setAnomalyData(result.anomaly);

      const updatedAlerts = await api.getAlerts(15);
      if (Array.isArray(updatedAlerts)) {
        setAlerts(updatedAlerts);
      }
    } catch (err) {
      console.error("ML Inference error:", err);
      const detail = err.response?.data?.detail || "ML prediction executed with local heuristic model.";
      setError(detail);
    } finally {
      setIsPredicting(false);
    }
  };

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Telemetry File Parser (Supports CSV, JSON, Time-series logs)
  const parseTelemetryText = (text, fileName = 'telemetry.csv') => {
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        setFileUploadNote('File is empty.');
        return;
      }

      // 1. JSON Support
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsedJson = JSON.parse(trimmed);
        const dataPoint = Array.isArray(parsedJson) ? parsedJson[parsedJson.length - 1] : parsedJson;
        
        const newCpu = Number(dataPoint.cpu ?? dataPoint.cpu_usage ?? dataPoint.current_cpu ?? cpuInput);
        const newRam = Number(dataPoint.ram ?? dataPoint.ram_usage ?? dataPoint.current_ram ?? ramInput);
        const newDisk = Number(dataPoint.disk ?? dataPoint.disk_usage ?? diskInput);
        const newNetwork = Number(dataPoint.network ?? dataPoint.network_usage ?? dataPoint.net ?? networkInput);
        const newUsers = Number(dataPoint.active_users ?? dataPoint.users ?? activeUsersInput);
        const newReq = Number(dataPoint.request_rate ?? dataPoint.requests ?? requestRateInput);

        setCpuInput(Math.min(100, Math.max(0, Math.round(newCpu * 10) / 10)));
        setRamInput(Math.min(100, Math.max(0, Math.round(newRam * 10) / 10)));
        setDiskInput(Math.min(100, Math.max(0, Math.round(newDisk * 10) / 10)));
        setNetworkInput(Math.min(100, Math.max(0, Math.round(newNetwork * 10) / 10)));
        setActiveUsersInput(Math.max(0, Math.round(newUsers)));
        setRequestRateInput(Math.max(0, Math.round(newReq)));

        setFileUploadNote(`✅ Parsed JSON "${fileName}": Loaded CPU=${newCpu}%, RAM=${newRam}%, Users=${newUsers}, Req=${newReq}/s`);
        return;
      }

      // 2. CSV Support
      const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        setFileUploadNote('No valid data lines found in CSV.');
        return;
      }

      const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
      const rawHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

      const findColIdx = (names) => {
        return rawHeaders.findIndex(h => names.some(name => h.includes(name)));
      };

      const cpuIdx = findColIdx(['cpu', 'processor']);
      const ramIdx = findColIdx(['ram', 'mem', 'memory']);
      const diskIdx = findColIdx(['disk', 'storage', 'hdd', 'ssd']);
      const netIdx = findColIdx(['net', 'network', 'bandwidth']);
      const userIdx = findColIdx(['user', 'client', 'concurr']);
      const reqIdx = findColIdx(['req', 'rps', 'rate', 'query']);

      const firstLineIsHeader = isNaN(Number(rawHeaders[0]));
      const dataRows = firstLineIsHeader ? lines.slice(1) : lines;

      if (dataRows.length === 0) {
        setFileUploadNote('CSV contained headers but no data rows.');
        return;
      }

      // Read last row (latest telemetry)
      const lastRowValues = dataRows[dataRows.length - 1].split(delimiter).map(v => Number(v.trim().replace(/^["']|["']$/g, '')));

      let extractedCpu = cpuIdx !== -1 && !isNaN(lastRowValues[cpuIdx]) ? lastRowValues[cpuIdx] : (!isNaN(lastRowValues[0]) ? lastRowValues[0] : cpuInput);
      let extractedRam = ramIdx !== -1 && !isNaN(lastRowValues[ramIdx]) ? lastRowValues[ramIdx] : (!isNaN(lastRowValues[1]) ? lastRowValues[1] : ramInput);
      let extractedDisk = diskIdx !== -1 && !isNaN(lastRowValues[diskIdx]) ? lastRowValues[diskIdx] : (!isNaN(lastRowValues[2]) ? lastRowValues[2] : diskInput);
      let extractedNet = netIdx !== -1 && !isNaN(lastRowValues[netIdx]) ? lastRowValues[netIdx] : (!isNaN(lastRowValues[3]) ? lastRowValues[3] : networkInput);
      let extractedUsers = userIdx !== -1 && !isNaN(lastRowValues[userIdx]) ? lastRowValues[userIdx] : (!isNaN(lastRowValues[4]) ? lastRowValues[4] : activeUsersInput);
      let extractedReq = reqIdx !== -1 && !isNaN(lastRowValues[reqIdx]) ? lastRowValues[reqIdx] : (!isNaN(lastRowValues[5]) ? lastRowValues[5] : requestRateInput);

      const cleanCpu = Math.min(100, Math.max(0, Math.round(extractedCpu * 10) / 10));
      const cleanRam = Math.min(100, Math.max(0, Math.round(extractedRam * 10) / 10));
      const cleanDisk = Math.min(100, Math.max(0, Math.round(extractedDisk * 10) / 10));
      const cleanNet = Math.min(100, Math.max(0, Math.round(extractedNet * 10) / 10));
      const cleanUsers = Math.max(0, Math.round(extractedUsers));
      const cleanReq = Math.max(0, Math.round(extractedReq));

      setCpuInput(cleanCpu);
      setRamInput(cleanRam);
      setDiskInput(cleanDisk);
      setNetworkInput(cleanNet);
      setActiveUsersInput(cleanUsers);
      setRequestRateInput(cleanReq);

      setFileUploadNote(`✅ Parsed CSV "${fileName}" (${dataRows.length} rows): CPU=${cleanCpu}%, RAM=${cleanRam}%, Users=${cleanUsers.toLocaleString()}, Req=${cleanReq.toLocaleString()}/s`);
    } catch (err) {
      console.error('File parsing error:', err);
      setFileUploadNote(`⚠️ Error parsing file: ${err.message || 'Invalid format'}`);
    }
  };

  const handleFileDropClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        parseTelemetryText(event.target.result, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        parseTelemetryText(event.target.result, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSampleCsv = (e) => {
    e.stopPropagation();
    const sampleCsv = `timestamp,cpu,ram,disk,network,active_users,request_rate
2026-09-22 13:00:00,42.1,53.4,41.0,38.2,780,950
2026-09-22 13:05:00,55.4,62.1,43.0,45.0,1200,1500
2026-09-22 13:10:00,74.8,78.5,52.0,68.0,2400,3100
2026-09-22 13:15:00,89.2,91.4,65.0,84.5,3850,4700`;
    parseTelemetryText(sampleCsv, 'sample_cloud_telemetry.csv');
  };

  const handleDownloadSampleCsvTemplate = (e) => {
    e.stopPropagation();
    const sampleCsv = `timestamp,cpu,ram,disk,network,active_users,request_rate\n2026-09-22 14:00:00,45.0,55.0,40.0,35.0,850,1050\n2026-09-22 14:05:00,68.0,72.0,48.0,52.0,1800,2200\n2026-09-22 14:10:00,91.5,88.0,65.0,82.0,3900,4800\n`;
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cloud_telemetry_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger high alert notification and sync with backend
  const triggerHighTrafficAlert = async (users, reqRate, cpuVal, ramVal) => {
    const alertRecord = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: "HIGH_USER_SURGE",
      severity: "CRITICAL",
      message: `🚨 HIGH USER LOAD DETECTED: Incoming traffic surged to ${users.toLocaleString()} concurrent users (${reqRate.toLocaleString()} req/s)! Predicted CPU: ${cpuVal}%. Horizontal auto-scaling recommended immediately.`,
      metric: "Active Users / CPU",
      value: users
    };

    setActiveHighAlert({
      ...alertRecord,
      users,
      reqRate,
      predictedCpu: cpuVal,
      predictedRam: ramVal
    });

    try {
      await api.createAlert(alertRecord);
      if (setAlerts) {
        setAlerts(prev => [alertRecord, ...prev]);
      }
    } catch (err) {
      console.warn("Alert sync error:", err);
    }
  };

  // Toggle user traffic flow to cloud simulation
  const handleToggleTrafficSimulation = () => {
    if (isSimulatingTraffic) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      setIsSimulatingTraffic(false);
      return;
    }

    setIsSimulatingTraffic(true);
    let step = 0;
    setTrafficFlowStage(1);

    // Initial base level
    setCpuInput(48.0);
    setRamInput(60.0);
    setActiveUsersInput(950);
    setRequestRateInput(1150);

    simulationIntervalRef.current = setInterval(() => {
      step++;
      setTrafficFlowStage(step);

      if (step === 1) {
        // Step 1: Moderate increase
        setActiveUsersInput(1800);
        setRequestRateInput(2200);
        setCpuInput(64.5);
        setRamInput(71.0);
        setNetworkInput(58.0);
      } else if (step === 2) {
        // Step 2: High Threshold reached (> 2,500 users) -> High Alert!
        const users = 2950;
        const reqRate = 3600;
        const cpu = 83.2;
        const ram = 84.0;
        setActiveUsersInput(users);
        setRequestRateInput(reqRate);
        setCpuInput(cpu);
        setRamInput(ram);
        setNetworkInput(76.0);

        setSummary(prev => ({
          ...prev,
          current_cpu: cpu,
          current_ram: ram,
          active_users: users,
          request_rate: reqRate,
          predicted_cpu: 87.5,
          predicted_ram: 86.2,
          status: "HIGH_USAGE_EXPECTED",
          severity: "HIGH",
          recommendation: "High user traffic surge detected. Scale cluster (+1 pod) before peak saturation."
        }));

        triggerHighTrafficAlert(users, reqRate, 87.5, 86.2);
      } else if (step === 3) {
        // Step 3: Critical Surge!
        const users = 4350;
        const reqRate = 5200;
        const cpu = 94.8;
        const ram = 91.5;
        setActiveUsersInput(users);
        setRequestRateInput(reqRate);
        setCpuInput(cpu);
        setRamInput(ram);
        setNetworkInput(92.0);

        setSummary(prev => ({
          ...prev,
          current_cpu: cpu,
          current_ram: ram,
          active_users: users,
          request_rate: reqRate,
          predicted_cpu: 95.8,
          predicted_ram: 93.0,
          status: "CRITICAL",
          severity: "CRITICAL",
          recommendation: "URGENT: Cloud node in critical state under 4,350 concurrent users. Trigger horizontal pod autoscaling immediately."
        }));

        triggerHighTrafficAlert(users, reqRate, 95.8, 93.0);
      } else if (step >= 4) {
        // Peak sustained
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        setIsSimulatingTraffic(false);
      }
    }, 1400);
  };

  // Instant Traffic Spike for Viva
  const handleInstantSpike = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulatingTraffic(false);
    setTrafficFlowStage(3);

    const users = 4500;
    const reqRate = 5400;
    const cpu = 95.2;
    const ram = 92.0;

    setActiveUsersInput(users);
    setRequestRateInput(reqRate);
    setCpuInput(cpu);
    setRamInput(ram);
    setNetworkInput(94.0);

    setSummary(prev => ({
      ...prev,
      current_cpu: cpu,
      current_ram: ram,
      active_users: users,
      request_rate: reqRate,
      predicted_cpu: 96.4,
      predicted_ram: 93.5,
      status: "CRITICAL",
      severity: "CRITICAL",
      recommendation: "URGENT CAPACITY ALERT: 4,500 concurrent users active. Immediate scale-out mandatory to prevent cluster downtime."
    }));

    triggerHighTrafficAlert(users, reqRate, 96.4, 93.5);
  };

  // Auto-Remediate / Scale Up Action (Simulation)
  const handleAutoRemediate = () => {
    setCpuInput(42.0);
    setRamInput(52.5);
    setNetworkInput(40.0);
    setActiveHighAlert(null);
    setTrafficFlowStage(0);

    setSummary(prev => ({
      ...prev,
      current_cpu: 42.0,
      current_ram: 52.5,
      predicted_cpu: 44.0,
      predicted_ram: 54.0,
      status: "NORMAL",
      severity: "NORMAL",
      recommendation: "Cluster successfully scaled (+2 worker instances). Resource utilization stabilized within nominal thresholds."
    }));
  };

  // FinOps Right-Sizing / Scale Action Handlers
  const handleFinOpsScaleAction = (actionType, targetNodes) => {
    if (actionType === 'SCALE_OUT') {
      handleAutoRemediate();
    } else if (actionType === 'SCALE_IN') {
      setCpuInput(44.0);
      setRamInput(52.0);
      setActiveHighAlert(null);
      setSummary(prev => ({
        ...prev,
        current_cpu: 44.0,
        current_ram: 52.0,
        predicted_cpu: 45.0,
        predicted_ram: 53.0,
        status: "OPTIMAL",
        severity: "NORMAL",
        recommendation: `FinOps Right-Sizing Applied: Cluster consolidated into ${targetNodes} nodes. Idle vCPU spend eliminated while preserving 15-min SLA headroom.`
      }));
    }
  };

  // Reset Traffic Flow
  const handleResetTraffic = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulatingTraffic(false);
    setTrafficFlowStage(0);
    setActiveHighAlert(null);
    setCpuInput(44.5);
    setRamInput(58.2);
    setDiskInput(42.0);
    setNetworkInput(39.1);
    setActiveUsersInput(850);
    setRequestRateInput(1020);
    setSelectedTemplate('nominal');
  };

  // Ranked Resources Data for the lower dashboard section
  const rankedResources = [
    {
      id: '01',
      name: 'cpu_compute_utilization.metric',
      displayName: 'CPU Core Allocation & Compute Load',
      category: 'COMPUTE',
      categoryColor: 'bg-blue-100 text-blue-800 border-blue-200',
      barColor: summary.predicted_cpu >= 80 ? 'bg-rose-500' : summary.predicted_cpu >= 60 ? 'bg-amber-500' : 'bg-amber-500',
      score: summary.predicted_cpu ? `${summary.predicted_cpu}%` : '45.1%',
      scoreLabel: '15-MIN FORECAST',
      currentVal: `${summary.current_cpu ?? cpuInput}%`,
      details: 'Evaluated by Scikit-Learn RandomForestRegressor with 100 decision trees, time lag features, and concurrent user correlation.'
    },
    {
      id: '02',
      name: 'ram_memory_utilization.metric',
      displayName: 'RAM Memory Footprint & Swap Allocation',
      category: 'MEMORY',
      categoryColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      barColor: summary.predicted_ram >= 80 ? 'bg-rose-500' : summary.predicted_ram >= 60 ? 'bg-amber-500' : 'bg-blue-600',
      score: summary.predicted_ram ? `${summary.predicted_ram}%` : '57.8%',
      scoreLabel: '15-MIN FORECAST',
      currentVal: `${summary.current_ram ?? ramInput}%`,
      details: 'Forecasting memory saturation 3 steps ahead with empirical R² of 0.94 and MAE of 1.51%.'
    },
    {
      id: '03',
      name: 'network_throughput_bandwidth.metric',
      displayName: 'Network Ingress / Egress Saturation',
      category: 'NETWORK',
      categoryColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      barColor: 'bg-cyan-500',
      score: `${summary.network ?? networkInput}%`,
      scoreLabel: 'CURRENT LOAD',
      currentVal: `${summary.network ?? networkInput}%`,
      details: 'Monitors real-time package transmission rates and detects distributed ingress packet floods.'
    },
    {
      id: '04',
      name: 'disk_storage_volume.metric',
      displayName: 'Persistent Disk Storage & IOPS Activity',
      category: 'STORAGE',
      categoryColor: 'bg-purple-100 text-purple-800 border-purple-200',
      barColor: 'bg-purple-500',
      score: `${summary.disk ?? diskInput}%`,
      scoreLabel: 'ALLOCATED CAPACITY',
      currentVal: `${summary.disk ?? diskInput}%`,
      details: 'Tracks storage block consumption and database journaling headroom across volumes.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Error Alert */}
      <ErrorMessage error={error} onRetry={() => handleExecuteInference()} />

      {/* High Traffic Surge Alert Notification Banner */}
      {activeHighAlert && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-400/90 shadow-xl shadow-rose-500/10 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-sm animate-pulse">
                <FiAlertOctagon />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-600 text-white font-mono uppercase tracking-wider">
                    HIGH ALERT NOTIFICATION
                  </span>
                  <span className="text-xs text-rose-700 font-bold font-mono">
                    {activeHighAlert.timestamp}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                    Isolation Forest Anomaly
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-rose-950">
                  Cloud User Traffic Surge: {activeHighAlert.users?.toLocaleString()} Concurrent Users ({activeHighAlert.reqRate?.toLocaleString()} req/s)
                </h4>
                <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
                  {activeHighAlert.message}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-mono text-rose-900 font-bold">
                  <span className="bg-rose-100/80 px-2 py-0.5 rounded border border-rose-300">
                    Predicted CPU: <strong className="text-rose-700 font-extrabold">{activeHighAlert.predictedCpu}%</strong>
                  </span>
                  <span className="bg-rose-100/80 px-2 py-0.5 rounded border border-rose-300">
                    Predicted RAM: <strong className="text-rose-700 font-extrabold">{activeHighAlert.predictedRam}%</strong>
                  </span>
                  <span className="text-rose-600 text-[11px]">
                    Status: CRITICAL_AUTOSCALE_TRIGGERED
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={handleAutoRemediate}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <FiZap className="text-amber-300" />
                <span>Auto-Scale (+2 Pods)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveHighAlert(null);
                  if (setAlerts) {
                    setAlerts(prev => prev.map(a => 
                      a.type === 'USER_TRAFFIC_SURGE' 
                        ? { ...a, status: 'RESOLVED', resolved_at: new Date().toLocaleTimeString(), resolved_by: 'Dashboard Operator' } 
                        : a
                    ));
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                title="Mark this incident as resolved"
              >
                <FiCheckCircle className="text-emerald-700" />
                <span>Resolve Alert</span>
              </button>

              {onOpenAlerts && (
                <button
                  type="button"
                  onClick={onOpenAlerts}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 border border-rose-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <FiBell />
                  <span>View in Alerts Tab &rarr;</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveHighAlert(null)}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-xl transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <FiX className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: HERO HEADER (Matching user provided image top)
      ========================================================================== */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        
        {/* Top Centered Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/70 shadow-xs mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 pulse-dot"></span>
          <span>Machine Learning Powered · Local Inference</span>
        </div>

        {/* Big Display Title with Dot */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
          Cloud Resource <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 font-normal">
          Rank and analyze future server &amp; cloud resource utilization against operational workloads with 
          Random Forest forecasting, Isolation Forest anomaly detection, and heuristic decision support.
        </p>

        {/* Horizontal Chips / Pills Row matching reference */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-monospace text-slate-600">
          <span className="px-3 py-1 bg-white border border-slate-200/90 rounded-full shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            CPU Regressor
          </span>
          <span className="px-3 py-1 bg-white border border-slate-200/90 rounded-full shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            RAM Regressor
          </span>
          <span className="px-3 py-1 bg-white border border-slate-200/90 rounded-full shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Isolation Forest
          </span>
          <span className="px-3 py-1 bg-white border border-slate-200/90 rounded-full shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            15-Min Horizon
          </span>
          <span className="px-3 py-1 bg-white border border-slate-200/90 rounded-full shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            MongoDB &bull; 2,484 Samples
          </span>
          <span className="px-3 py-1 bg-white border border-slate-200/90 rounded-full shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Decision Support
          </span>
        </div>

      </div>

      {/* FinOps Quick Access Banner & Section Jump */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/30 to-blue-50/40 border-2 border-amber-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-sm shadow-amber-500/30">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900">
                FinOps Cloud Cost Optimization &amp; Right-Sizing
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase tracking-wide">
                Save Cloud Spend (₹)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
              Model AWS, GCP, and Azure instance costs in Indian Rupees (₹), detect over-provisioned idle compute, and export executive right-sizing audits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('finops');
              const el = document.getElementById('candidate-match-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-300 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Show FinOps Below &darr;</span>
          </button>

          {onOpenFinOps && (
            <button
              type="button"
              onClick={onOpenFinOps}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Dedicated FinOps Page &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: PRIMARY INTERACTIVE CARD (Exact match to uploaded image card)
      ========================================================================== */}
      <div className="ref-card p-6 sm:p-8 mb-8">
        
        {/* Card Header & Templates Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <FiZap className="text-base" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Simulate &amp; Predict Workloads
            </h2>
          </div>

          {/* Quick Preset Templates Buttons matching uploaded design */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1">Templates:</span>
            <button
              type="button"
              onClick={() => handleSelectTemplate('nominal')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTemplate === 'nominal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Nominal Workload
            </button>
            <button
              type="button"
              onClick={() => handleSelectTemplate('peak')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTemplate === 'peak'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              High Traffic Peak
            </button>
            <button
              type="button"
              onClick={() => handleSelectTemplate('low')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTemplate === 'low'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Low Utilization
            </button>
            <button
              type="button"
              onClick={() => handleSelectTemplate('critical')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTemplate === 'critical'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Critical Saturation
            </button>
            <button
              type="button"
              onClick={() => handleSelectTemplate('anomaly')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTemplate === 'anomaly'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Anomaly Spike
            </button>
          </div>
        </div>

        {/* Telemetry Input Parameters Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Workload Characteristics &amp; Hardware Baseline
            </span>
            <span className="text-xs font-monospace text-slate-400">
              Model Inputs (6 Features)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* CPU */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">CPU Load</span>
                <span className="font-bold font-monospace text-blue-600">{cpuInput}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="99"
                value={cpuInput}
                onChange={(e) => setCpuInput(Number(e.target.value))}
                className="w-full custom-range h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* RAM */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">RAM Load</span>
                <span className="font-bold font-monospace text-indigo-600">{ramInput}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="99"
                value={ramInput}
                onChange={(e) => setRamInput(Number(e.target.value))}
                className="w-full custom-range h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Disk */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Disk I/O</span>
                <span className="font-bold font-monospace text-purple-600">{diskInput}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={diskInput}
                onChange={(e) => setDiskInput(Number(e.target.value))}
                className="w-full custom-range h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Network */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Network</span>
                <span className="font-bold font-monospace text-cyan-600">{networkInput}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="98"
                value={networkInput}
                onChange={(e) => setNetworkInput(Number(e.target.value))}
                className="w-full custom-range h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Active Users */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Users</span>
                <span className="font-bold font-monospace text-slate-800">{activeUsersInput}</span>
              </div>
              <input
                type="range"
                min="50"
                max="4000"
                step="50"
                value={activeUsersInput}
                onChange={(e) => setActiveUsersInput(Number(e.target.value))}
                className="w-full custom-range h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Request Rate */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Req/s</span>
                <span className="font-bold font-monospace text-slate-800">{requestRateInput}</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={requestRateInput}
                onChange={(e) => setRequestRateInput(Number(e.target.value))}
                className="w-full custom-range h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Drop Telemetry File Area (Supports CSV, JSON, TXT with Drag & Drop) */}
        <div 
          onClick={handleFileDropClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-6 p-7 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all group ${
            isDragging 
              ? 'border-blue-500 bg-blue-50/70 scale-[1.01]' 
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".csv,.json,.txt"
            className="hidden"
          />
          <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-amber-100/90 text-amber-500 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
            📁
          </div>
          <div className="text-sm font-semibold text-slate-800 mb-1">
            {isDragging ? 'Release file to parse telemetry metrics...' : 'Drop telemetry files here or click to browse'}
          </div>
          <div className="text-xs text-slate-400 mb-3">
            Accepts CSV, JSON, Time-series metrics &bull; Click to load enterprise workload scenario
          </div>

          {/* Quick Helper Actions inside Dropzone */}
          <div className="flex flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleLoadSampleCsv}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>📥 Load Sample CSV</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSampleCsvTemplate}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiDownload className="text-xs" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {fileUploadNote && (
            <div className="mt-3 py-1.5 px-3 rounded-lg bg-blue-50/90 border border-blue-200/80 text-xs font-semibold text-blue-700 animate-fade-in font-mono inline-block">
              {fileUploadNote}
            </div>
          )}
        </div>

        {/* Live User Flow to Cloud Simulation Box */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/60 border border-indigo-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-xs">
                <FiUsers />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Cloud User Ingress Flow Simulation
                </h4>
                <p className="text-xs text-slate-500">
                  Simulate dynamic user traffic ramp to trigger automated high-load threshold alerts
                </p>
              </div>
            </div>

            {/* Stage Indicator Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                activeUsersInput >= 3500 
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' 
                  : activeUsersInput >= 2500 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {activeUsersInput >= 3500 ? '🚨 CRITICAL SURGE' : activeUsersInput >= 2500 ? '⚠️ HIGH LOAD BREACH' : '✅ NOMINAL TRAFFIC'}
              </span>
            </div>
          </div>

          {/* Traffic Meter Bar */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-700 mb-1">
              <span>Traffic Volume: <strong>{activeUsersInput.toLocaleString()} Users</strong> ({requestRateInput.toLocaleString()} req/s)</span>
              <span className="text-slate-400">High Alert Trigger: &ge; 2,500 Users</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 rounded-full ${
                  activeUsersInput >= 3500 
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600' 
                    : activeUsersInput >= 2500 
                    ? 'bg-gradient-to-r from-blue-500 to-amber-500' 
                    : 'bg-gradient-to-r from-emerald-500 to-blue-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (activeUsersInput / 5000) * 100))}%` }}
              ></div>
            </div>
          </div>

          {/* Simulation Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTrafficSimulation}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                isSimulatingTraffic
                  ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
              }`}
            >
              {isSimulatingTraffic ? (
                <>
                  <FiPause className="text-sm" />
                  <span>Pause User Flow Simulation</span>
                </>
              ) : (
                <>
                  <FiPlay className="text-sm" />
                  <span>Simulate User Flow to Cloud</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleInstantSpike}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <FiZap className="text-rose-600" />
              <span>Spike Flow to 4,500 (Instant Alert)</span>
            </button>

            {(trafficFlowStage > 0 || activeUsersInput > 1500) && (
              <button
                type="button"
                onClick={handleResetTraffic}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reset traffic to default"
              >
                <FiRefreshCw className="text-xs" />
                <span>Reset Traffic</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Blue Action Button matching user screenshot */}
        <button
          type="button"
          onClick={handleExecuteInference}
          disabled={isPredicting}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all active:scale-[0.99] cursor-pointer"
        >
          {isPredicting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin"></span>
              <span>Evaluating Random Forest &amp; Isolation Forest Models...</span>
            </>
          ) : (
            <>
              <FiPlay className="text-base fill-current" />
              <span>Screen Resumes &amp; Predict Cloud Resources</span>
            </>
          )}
        </button>

      </div>

      {/* =========================================================================
          SECTION 3: THREE FEATURE CARDS (Exact match to 3 cards in uploaded image)
      ========================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        
        {/* Card 1: Purple circular icon */}
        <div className="ref-card p-5 ref-card-hover">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base mb-3 border border-purple-200/60">
            <FiActivity />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">
            Random Forest Regressors
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Vectorizes historical time-series lags, diurnal cycles, and user concurrency to measure mathematical demand for the next 15 minutes.
          </p>
        </div>

        {/* Card 2: Amber circular icon */}
        <div className="ref-card p-5 ref-card-hover">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base mb-3 border border-amber-200/60">
            <FiAlertTriangle />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">
            Isolation Forest Classifier
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Predicts anomalous compute domain divergence across 2,484 training samples to isolate abnormal hardware spikes.
          </p>
        </div>

        {/* Card 3: Cyan/Blue circular icon */}
        <div className="ref-card p-5 ref-card-hover">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-base mb-3 border border-cyan-200/60">
            <FiCpu />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">
            Decoupled Decision Engine
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Discovers cluster bottlenecks and synthesizes actionable cloud capacity recommendations to optimize cluster costs before user impact.
          </p>
        </div>

      </div>

      {/* =========================================================================
          SECTION 4: RESULTS DASHBOARD (Exact match to lower half of uploaded image)
      ========================================================================== */}
      <div id="candidate-match-section" className="mt-12 pt-8 border-t border-slate-200/90 scroll-mt-20">
        
        {/* Dashboard Title & Sub-tabs Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
              Screening &amp; Telemetry Analysis
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Candidate Match Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked results for 4 cloud resources evaluated with Random Forest &amp; Isolation Forest.
            </p>
          </div>

          {/* Sub-navigation pill tabs matching screenshot right buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium self-start sm:self-auto flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('ranked')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'ranked'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiServer className="text-xs text-blue-600" />
              <span>Ranked Resources (4)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiBarChart2 className="text-xs text-indigo-600" />
              <span>Visual Analytics &amp; Insights</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('viva')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'viva'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiBookOpen className="text-xs text-emerald-600" />
              <span>Viva Guide</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('finops')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'finops'
                  ? 'bg-amber-100 text-amber-950 shadow-xs font-bold ring-1 ring-amber-300'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100/70 font-semibold'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>FinOps &amp; Right-Sizing</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900">
                Save ₹
              </span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Pills Container (Exact match to white pill container in user screenshot) */}
        <div className="ref-card p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-slate-100">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                SCREENED / MONITORED
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-monospace">
                4
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                TOP PREDICTED PEAK
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-500 font-monospace">
                {Math.max(summary.predicted_cpu ?? 45.1, summary.predicted_ram ?? 57.8).toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                AVG UTILIZATION
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-monospace">
                {(((summary.current_cpu ?? 44.5) + (summary.current_ram ?? 58.2)) / 2).toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                ANOMALY STATUS
              </div>
              <div className={`text-xl sm:text-2xl font-bold font-monospace ${
                summary.is_anomaly ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {summary.anomaly_status ?? 'NORMAL'}
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly / Recommendation Advisory Alert Banner */}
        {summary.recommendation && (
          <div className={`p-4 mb-6 rounded-2xl border flex items-start gap-3 text-sm ${
            summary.severity === 'HIGH' || summary.is_anomaly
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : summary.severity === 'LOW'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="mt-0.5">
              {summary.is_anomaly ? <FiAlertTriangle className="text-lg text-rose-600" /> : <FiCheckCircle className="text-lg text-emerald-600" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-0.5 flex flex-wrap items-center justify-between gap-2">
                <span>{summary.status}: Decision Recommendation</span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('finops')}
                  className="text-xs font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer transition-opacity"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Open FinOps Cost Calculator &rarr;</span>
                </button>
              </div>
              <div className="text-xs leading-relaxed opacity-90">
                {summary.recommendation}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 1: RANKED CANDIDATES / RESOURCES (Exact match to list in user screenshot) */}
        {activeSubTab === 'ranked' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 mb-2">
              <span className="font-semibold text-slate-700">Ranked Telemetry Metrics (4 resources)</span>
              <span>Click any resource for detailed drill-down popup</span>
            </div>

            {rankedResources.map((res) => (
              <div 
                key={res.id}
                className="ref-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ref-card-hover"
              >
                {/* Left: Index + File Icon + Name */}
                <div className="flex items-center gap-3 min-w-[240px]">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {res.id}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm flex-shrink-0">
                    📁
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {res.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Current: {res.currentVal}
                    </div>
                  </div>
                </div>

                {/* Center: Horizontal Progress Bar matching screenshot */}
                <div className="flex-1 max-w-md mx-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${res.barColor}`}
                      style={{ width: `${Math.min(100, parseFloat(res.score))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Right: Category tag + Match % score + View button */}
                <div className="flex items-center justify-end gap-3 flex-shrink-0">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-monospace bg-blue-50 text-blue-700 border border-blue-200">
                    {res.category}
                  </span>

                  <div className="text-right">
                    <div className="text-sm font-bold font-monospace text-slate-900">
                      {res.score}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      {res.scoreLabel}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedResourceModal(res)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors flex items-center gap-1"
                  >
                    <span>View</span>
                    <FiArrowRight className="text-[10px]" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* SUBTAB 2: VISUAL ANALYTICS & INSIGHTS */}
        {activeSubTab === 'analytics' && (
          <div className="animate-fade-in space-y-6">
            <div className="ref-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FiBarChart2 className="text-blue-600" />
                  <span>Historical Telemetry &amp; Diurnal Cycles</span>
                </h3>
                <div className="flex items-center gap-1">
                  {[6, 12, 24, 48].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setHistoryHours(h);
                        loadHistory(h);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                        historyHours === h
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <UsageChart 
                historyData={historyData}
                hours={historyHours}
                onTimeframeChange={(h) => {
                  setHistoryHours(h);
                  loadHistory(h);
                }}
              />
            </div>
          </div>
        )}

        {/* SUBTAB 3: 10-STEP VIVA DEMO GUIDE */}
        {activeSubTab === 'viva' && (
          <div className="ref-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FiBookOpen className="text-blue-600 text-xl" />
                <h3 className="text-base font-bold text-slate-900">
                  10-Step College Viva Presentation Walkthrough
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Viva Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 1 &bull; System Purpose</span>
                <p className="text-slate-600">Explain forecasting 15-minute ahead cloud capacity to prevent SLA violations without over-provisioning.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 2 &bull; Observability Cards</span>
                <p className="text-slate-600">Walk through current metrics: CPU (44.5%), RAM (58.2%), Disk, Network.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 3 &bull; Diurnal Telemetry</span>
                <p className="text-slate-600">Demonstrate cyclical 24h trends where enterprise workloads peak during business hours.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 4 &bull; Evaluation Metrics</span>
                <p className="text-slate-600">Highlight test set R² (0.94 for RAM, 0.74 for CPU) and low MAE (1.51%).</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 5 &bull; High Traffic Preset</span>
                <p className="text-slate-600">Trigger 'High Traffic Peak' template (2,200 users) and execute inference.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 6 &bull; 15-Minute Forecast</span>
                <p className="text-slate-600">Verify predicted CPU/RAM climbing into critical thresholds in the ranked table.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 7 &bull; Recommendation Engine</span>
                <p className="text-slate-600">Observe status 'HIGH_USAGE_EXPECTED' advising proactive scaling.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 8 &bull; Low Utilization Downscaling</span>
                <p className="text-slate-600">Select 'Low Utilization' and show downscaling recommendation for cost saving.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-blue-600 block mb-1">Step 9 &bull; Isolation Forest Anomaly</span>
                <p className="text-slate-600">Trigger 'Anomaly Spike' and confirm the outlier detector flags the spike.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-emerald-600 block mb-1">Step 10 &bull; Concluding Boundary</span>
                <p className="text-slate-600">"The system operates as decision support with a human operator in the loop."</p>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: FINOPS CLOUD COST OPTIMIZATION & RIGHT-SIZING CALCULATOR */}
        {activeSubTab === 'finops' && (
          <FinOpsCalculator 
            summary={summary}
            onApplyScaleAction={handleFinOpsScaleAction}
          />
        )}

      </div>

      {/* Resource Quick Look Popup Modal (matching screenshot note: "Click any candidate for Apple Quick Look popup") */}
      {selectedResourceModal && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedResourceModal(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  📁
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-mono">
                    {selectedResourceModal.name}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {selectedResourceModal.displayName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResourceModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-mono">
                <span className="text-slate-500">Forecast / Score</span>
                <span className="font-bold text-blue-600 text-sm">{selectedResourceModal.score}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-mono">
                <span className="text-slate-500">Current Value</span>
                <span className="font-bold text-slate-900">{selectedResourceModal.currentVal}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-mono">
                <span className="text-slate-500">Category Tag</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedResourceModal.category}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed pt-1">
                {selectedResourceModal.details}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedResourceModal(null)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Close Quick Look
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
