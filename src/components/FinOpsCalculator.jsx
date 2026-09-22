import React, { useState, useMemo } from 'react';
import { 
  FiTrendingDown, 
  FiTrendingUp, 
  FiServer, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiDownload, 
  FiShield, 
  FiCpu, 
  FiPieChart, 
  FiZap, 
  FiSliders,
  FiRefreshCw
} from 'react-icons/fi';
import { IndianRupee } from 'lucide-react';

// Enterprise Cloud Provider Instance Catalog & Baseline USD Pricing
const CLOUD_PROVIDERS = {
  aws: {
    name: 'Amazon Web Services (AWS)',
    shortName: 'AWS',
    iconColor: 'text-amber-600',
    instances: [
      { id: 't3.large', name: 't3.large', vCpu: 2, ramGb: 8, hourlyRate: 0.0832, family: 'General Burstable' },
      { id: 'm5.large', name: 'm5.large', vCpu: 2, ramGb: 8, hourlyRate: 0.096, family: 'General Purpose (Standard)' },
      { id: 'c5.xlarge', name: 'c5.xlarge', vCpu: 4, ramGb: 8, hourlyRate: 0.170, family: 'Compute Optimized' },
      { id: 'r5.large', name: 'r5.large', vCpu: 2, ramGb: 16, hourlyRate: 0.126, family: 'Memory Optimized' },
    ]
  },
  gcp: {
    name: 'Google Cloud Platform (GCP)',
    shortName: 'GCP',
    iconColor: 'text-blue-600',
    instances: [
      { id: 'e2-standard-2', name: 'e2-standard-2', vCpu: 2, ramGb: 8, hourlyRate: 0.067, family: 'Cost-Optimized' },
      { id: 'e2-standard-4', name: 'e2-standard-4', vCpu: 4, ramGb: 16, hourlyRate: 0.134, family: 'Balanced General' },
      { id: 'c2-standard-4', name: 'c2-standard-4', vCpu: 4, ramGb: 16, hourlyRate: 0.208, family: 'Compute-Optimized' },
      { id: 'n2-standard-2', name: 'n2-standard-2', vCpu: 2, ramGb: 8, hourlyRate: 0.097, family: 'Balanced Standard' },
    ]
  },
  azure: {
    name: 'Microsoft Azure',
    shortName: 'Azure',
    iconColor: 'text-sky-600',
    instances: [
      { id: 'Standard_B2ms', name: 'B2ms Burstable', vCpu: 2, ramGb: 8, hourlyRate: 0.083, family: 'Burstable Tier' },
      { id: 'Standard_D2s_v5', name: 'D2s v5 Standard', vCpu: 2, ramGb: 8, hourlyRate: 0.096, family: 'General Purpose' },
      { id: 'Standard_D4s_v5', name: 'D4s v5 Compute', vCpu: 4, ramGb: 16, hourlyRate: 0.192, family: 'Compute Heavy' },
      { id: 'Standard_E2s_v5', name: 'E2s v5 High-Mem', vCpu: 2, ramGb: 16, hourlyRate: 0.126, family: 'Memory Intensive' },
    ]
  }
};

const BILLING_MODELS = [
  { id: 'ondemand', label: 'On-Demand', discount: 0.0, description: 'Pay as you go (0% discount)' },
  { id: 'savings1yr', label: '1-Yr Savings Plan', discount: 0.35, description: 'Committed baseline (35% discount)' },
  { id: 'savings3yr', label: '3-Yr Reserved', discount: 0.60, description: 'Long term reserve (60% discount)' }
];

// Currency Exchange Rate: 1 USD = ₹86.8 INR
const USD_TO_INR = 86.8;

// Indian Rupee (₹) Currency Formatter Helper
export const formatRupees = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function FinOpsCalculator({ 
  summary, 
  onApplyScaleAction = (_actionType, _targetNodes) => {},
  onExportReport = () => {}
}) {
  const [providerKey, setProviderKey] = useState('aws');
  const [selectedInstanceId, setSelectedInstanceId] = useState('m5.large');
  const [nodeCount, setNodeCount] = useState(4);
  const [billingModel, setBillingModel] = useState('ondemand');
  const [appliedNotification, setAppliedNotification] = useState(false);

  const provider = CLOUD_PROVIDERS[providerKey] || CLOUD_PROVIDERS.aws;
  const currentInstance = provider.instances.find(i => i.id === selectedInstanceId) || provider.instances[0];
  const billing = BILLING_MODELS.find(b => b.id === billingModel) || BILLING_MODELS[0];

  // Derived telemetry metrics
  const predictedCpu = summary?.predicted_cpu ?? 45.1;
  const predictedRam = summary?.predicted_ram ?? 57.8;
  const activeUsers = summary?.active_users ?? 850;

  // Monthly hours constant
  const MONTHLY_HOURS = 730;

  // Hourly rate in Indian Rupees (₹)
  const currentHourlyRateInr = currentInstance.hourlyRate * USD_TO_INR;

  // Calculate current spend in Indian Rupees (₹)
  const currentMonthlyCost = useMemo(() => {
    const baseCost = nodeCount * currentHourlyRateInr * MONTHLY_HOURS;
    return baseCost * (1 - billing.discount);
  }, [nodeCount, currentHourlyRateInr, billing]);

  // Determine Right-Sizing Analysis from Machine Learning Forecast
  const rightSizingAnalysis = useMemo(() => {
    let status = 'BALANCED'; // 'OVERPROVISIONED' | 'BALANCED' | 'UNDERPROVISIONED'
    let recommendedNodeCount = nodeCount;
    let recommendationTitle = '';
    let recommendationRationale = '';
    let actionType = 'MAINTAIN'; // 'SCALE_IN' | 'MAINTAIN' | 'SCALE_OUT'

    if (predictedCpu < 32 && predictedRam < 42) {
      // Over-provisioned: Nodes are idle, wasting budget
      status = 'OVERPROVISIONED';
      actionType = 'SCALE_IN';
      recommendedNodeCount = Math.max(1, Math.ceil(nodeCount * 0.5));
      recommendationTitle = `Downsize Cluster from ${nodeCount} to ${recommendedNodeCount} Worker Nodes`;
      recommendationRationale = `Predicted CPU (${predictedCpu.toFixed(1)}%) and RAM (${predictedRam.toFixed(1)}%) are significantly below 40% capacity threshold. Consolidating workloads into ${recommendedNodeCount} nodes preserves SLA margins while eliminating unutilized compute spend.`;
    } else if (predictedCpu > 78 || predictedRam > 82 || activeUsers >= 2500) {
      // Under-provisioned: SLA risk detected
      status = 'UNDERPROVISIONED';
      actionType = 'SCALE_OUT';
      recommendedNodeCount = nodeCount + 2;
      recommendationTitle = `Scale Out Cluster to ${recommendedNodeCount} Nodes (+2 Worker Instances)`;
      recommendationRationale = `Predicted CPU (${predictedCpu.toFixed(1)}%) and RAM (${predictedRam.toFixed(1)}%) breach critical SLA headroom (> 78%). Scaling out by 2 nodes prevents catastrophic service degradation and SLA breach financial penalties.`;
    } else {
      // Balanced / Right-Sized
      status = 'BALANCED';
      actionType = 'MAINTAIN';
      recommendedNodeCount = nodeCount;
      recommendationTitle = `Cluster is Well-Balanced & Right-Sized (${nodeCount} Nodes)`;
      recommendationRationale = `Machine learning forecasts nominal compute utilization (CPU ${predictedCpu.toFixed(1)}%, RAM ${predictedRam.toFixed(1)}%). Current capacity operates near optimal 50-70% efficiency envelope.`;
    }

    // Recommended monthly cost in Indian Rupees (₹)
    const recommendedMonthlyCost = recommendedNodeCount * currentHourlyRateInr * MONTHLY_HOURS * (1 - billing.discount);
    const monthlyDelta = currentMonthlyCost - recommendedMonthlyCost; // Positive = savings (₹), Negative = additional investment

    const savingsPercentage = currentMonthlyCost > 0 ? (monthlyDelta / currentMonthlyCost) * 100 : 0;
    const annualSavings = monthlyDelta * 12;

    // Carbon reduction estimate: ~12.5 kg CO2e per idle vCPU per month
    const vCpuDiff = (nodeCount - recommendedNodeCount) * currentInstance.vCpu;
    const monthlyCarbonKg = vCpuDiff > 0 ? vCpuDiff * 12.5 : 0;

    return {
      status,
      actionType,
      recommendedNodeCount,
      recommendationTitle,
      recommendationRationale,
      recommendedMonthlyCost,
      monthlyDelta,
      savingsPercentage,
      annualSavings,
      monthlyCarbonKg
    };
  }, [predictedCpu, predictedRam, activeUsers, nodeCount, currentInstance, currentHourlyRateInr, billing, currentMonthlyCost]);

  // Handle 1-Click Action
  const handleApplyAction = () => {
    if (onApplyScaleAction) {
      onApplyScaleAction(rightSizingAnalysis.actionType, rightSizingAnalysis.recommendedNodeCount);
    }
    setNodeCount(rightSizingAnalysis.recommendedNodeCount);
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 4000);
  };

  // Export FinOps Breakdown to CSV in INR (₹)
  const handleExportFinOpsCsv = () => {
    const rows = [
      ["=== CLOUD RESOURCE AI - FINOPS COST & RIGHT-SIZING ASSESSMENT (INR ₹) ==="],
      ["Generated At", new Date().toISOString()],
      ["Currency", "INR (Indian Rupees - ₹)"],
      ["Exchange Benchmark", `1 USD = ₹${USD_TO_INR} INR`],
      ["Cloud Provider", provider.name],
      ["Instance Type", currentInstance.name, `${currentInstance.vCpu} vCPU / ${currentInstance.ramGb} GB RAM`],
      ["Billing Commitment", billing.label, `${billing.discount * 100}% Discount`],
      [],
      ["--- CURRENT INFRASTRUCTURE METRICS & RUNTIME COSTS (RUPEES) ---"],
      ["Active Node Count", nodeCount],
      ["Hourly Rate per Node (INR)", `${formatRupees(currentHourlyRateInr)} / hr`],
      ["Total Cluster Monthly Spend", `${formatRupees(currentMonthlyCost)} / mo`],
      ["Observed Predicted CPU Utilization", `${predictedCpu.toFixed(1)}%`],
      ["Observed Predicted RAM Utilization", `${predictedRam.toFixed(1)}%`],
      ["Workload Concurrency", `${activeUsers} active users`],
      [],
      ["--- MACHINE LEARNING RIGHT-SIZING RECOMMENDATION (RUPEES) ---"],
      ["Right-Sizing Status", rightSizingAnalysis.status],
      ["Recommended Action", rightSizingAnalysis.actionType],
      ["Recommended Node Count", rightSizingAnalysis.recommendedNodeCount],
      ["Optimized Monthly Spend", `${formatRupees(rightSizingAnalysis.recommendedMonthlyCost)} / mo`],
      ["Projected Monthly Net Savings", `${formatRupees(rightSizingAnalysis.monthlyDelta)} / mo`],
      ["Projected Annual Savings", `${formatRupees(rightSizingAnalysis.annualSavings)} / yr`],
      ["Cost Reduction Percentage", `${rightSizingAnalysis.savingsPercentage.toFixed(1)}%`],
      ["Estimated Carbon Reduction (kg CO2e)", `${rightSizingAnalysis.monthlyCarbonKg.toFixed(1)} kg/mo`],
      ["Executive Strategic Rationale", rightSizingAnalysis.recommendationRationale]
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const csvContent = "\uFEFF" + rows.map(r => r.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finops-rightsizing-report-inr-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner / Summary Card */}
      <div className="ref-card p-6 bg-gradient-to-br from-white via-slate-50 to-amber-50/30 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>FinOps Cloud Cost Optimization &amp; Right-Sizing (INR ₹)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cloud Infrastructure Spend &amp; Predictive Right-Sizing
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Analyzes real-time telemetry and 15-minute Random Forest forecasts to calculate precise Rupee (₹) savings by downscaling idle nodes or scaling out to prevent costly SLA downtime.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportFinOpsCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <FiDownload className="text-slate-500" />
              <span>Export FinOps (CSV in ₹)</span>
            </button>
          </div>
        </div>

        {/* 4 FinOps KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          
          {/* Card 1: Current Spend */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Current Monthly Bill</span>
              <span className="text-slate-400 font-mono">{nodeCount} Nodes</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-monospace">
              {formatRupees(currentMonthlyCost)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {formatRupees(currentMonthlyCost / 730)}/hr ({provider.shortName})
            </div>
          </div>

          {/* Card 2: Right-Sized Spend */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Optimized Spend</span>
              <span className="text-blue-600 font-mono">{rightSizingAnalysis.recommendedNodeCount} Nodes</span>
            </div>
            <div className="text-2xl font-extrabold text-blue-600 font-monospace">
              {formatRupees(rightSizingAnalysis.recommendedMonthlyCost)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Targeted capacity allocation
            </div>
          </div>

          {/* Card 3: Projected Monthly Net Savings */}
          <div className={`p-4 rounded-xl border shadow-xs ${
            rightSizingAnalysis.monthlyDelta > 0 
              ? 'bg-emerald-50/50 border-emerald-200' 
              : rightSizingAnalysis.monthlyDelta < 0
              ? 'bg-amber-50/50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className={rightSizingAnalysis.monthlyDelta >= 0 ? 'text-emerald-800' : 'text-amber-800'}>
                {rightSizingAnalysis.monthlyDelta >= 0 ? 'Projected Net Savings' : 'Capacity Investment'}
              </span>
              {rightSizingAnalysis.monthlyDelta >= 0 ? (
                <FiTrendingDown className="text-emerald-600" />
              ) : (
                <FiTrendingUp className="text-amber-600" />
              )}
            </div>
            <div className={`text-2xl font-extrabold font-monospace ${
              rightSizingAnalysis.monthlyDelta > 0 ? 'text-emerald-600' : rightSizingAnalysis.monthlyDelta < 0 ? 'text-amber-600' : 'text-slate-700'
            }`}>
              {rightSizingAnalysis.monthlyDelta >= 0 
                ? `+${formatRupees(rightSizingAnalysis.monthlyDelta)}` 
                : `-${formatRupees(Math.abs(rightSizingAnalysis.monthlyDelta))}`}
              <span className="text-xs font-normal text-slate-500 font-sans">/mo</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1 font-mono">
              {rightSizingAnalysis.monthlyDelta > 0 
                ? `Save ${formatRupees(rightSizingAnalysis.annualSavings)} / yr (${rightSizingAnalysis.savingsPercentage.toFixed(1)}%)`
                : rightSizingAnalysis.monthlyDelta < 0
                ? 'Invests in cluster SLA resilience'
                : 'Zero waste identified'}
            </div>
          </div>

          {/* Card 4: Environmental Carbon Offset */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Carbon Offset (CO₂e)</span>
              <span className="text-emerald-600">Green Cloud</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-monospace">
              {rightSizingAnalysis.monthlyCarbonKg > 0 ? `-${rightSizingAnalysis.monthlyCarbonKg.toFixed(1)}` : '0.0'}
              <span className="text-xs font-normal text-slate-500 font-sans"> kg/mo</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Avoided idle vCPU emissions
            </div>
          </div>

        </div>
      </div>

      {appliedNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-sm font-semibold animate-fade-in shadow-xs">
          <FiCheckCircle className="text-emerald-600 text-lg flex-shrink-0" />
          <span>Right-sizing configuration successfully applied. Cluster nodes adjusted to {nodeCount} nodes.</span>
        </div>
      )}

      {/* Main Interactive Configuration & ML Recommendation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Cloud & Cluster Parameters (7 Cols) */}
        <div className="lg:col-span-7 ref-card p-6 space-y-6">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FiSliders className="text-blue-600" />
              <span>Cluster Architecture &amp; Pricing Setup</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Pricing in Rupees (₹)</span>
          </div>

          {/* Cloud Provider Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              1. Cloud Service Provider Profile
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(CLOUD_PROVIDERS).map((key) => {
                const p = CLOUD_PROVIDERS[key];
                const isActive = providerKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setProviderKey(key);
                      setSelectedInstanceId(CLOUD_PROVIDERS[key].instances[0].id);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{p.shortName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{p.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instance Family Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              2. Compute Node Instance Family ({provider.shortName})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {provider.instances.map((inst) => {
                const isSelected = inst.id === selectedInstanceId;
                const instHourlyInr = inst.hourlyRate * USD_TO_INR;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => setSelectedInstanceId(inst.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-slate-900">{inst.name}</span>
                      <span className="text-xs font-bold font-mono text-blue-600">
                        {formatRupees(instHourlyInr)}/hr
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{inst.vCpu} vCPU &bull; {inst.ramGb} GB RAM</span>
                      <span className="text-[10px] text-slate-400">{inst.family}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Node Count Slider */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">
                3. Current Deployed Worker Nodes:
              </label>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-100 text-blue-800">
                  {nodeCount} Nodes ({nodeCount * currentInstance.vCpu} vCPU, {nodeCount * currentInstance.ramGb} GB RAM)
                </span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              value={nodeCount}
              onChange={(e) => setNodeCount(Number(e.target.value))}
              className="w-full custom-range h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>1 Node (Dev)</span>
              <span>4 Nodes (Baseline)</span>
              <span>8 Nodes</span>
              <span>16 Nodes (Enterprise Scale)</span>
            </div>
          </div>

          {/* Commitment / Billing Model */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              4. Cloud Pricing &amp; Commitment Model
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BILLING_MODELS.map((b) => {
                const isSelected = b.id === billingModel;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBillingModel(b.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900 ring-1 ring-blue-500'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{b.label}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      {b.discount > 0 ? `Save ${(b.discount * 100).toFixed(0)}%` : 'Full Price'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: AI Right-Sizing Decision & Action Card (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="ref-card p-6 flex-1 flex flex-col justify-between border-2 border-slate-200/90">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FiZap className="text-amber-500" />
                  <span>Predictive Right-Sizing Verdict</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  rightSizingAnalysis.status === 'OVERPROVISIONED'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : rightSizingAnalysis.status === 'UNDERPROVISIONED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {rightSizingAnalysis.status}
                </span>
              </div>

              {/* Action Title */}
              <h4 className="text-base font-bold text-slate-900 mb-2">
                {rightSizingAnalysis.recommendationTitle}
              </h4>

              {/* Rationale Body */}
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {rightSizingAnalysis.recommendationRationale}
              </p>

              {/* Visual Spend Comparison Bar */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">Current Cost:</span>
                  <span className="font-bold text-slate-800">{formatRupees(currentMonthlyCost)}/mo</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: '100%' }}></div>
                </div>

                <div className="flex justify-between text-xs font-mono pt-1">
                  <span className="text-blue-700 font-semibold">Right-Sized Cost:</span>
                  <span className="font-bold text-blue-700">{formatRupees(rightSizingAnalysis.recommendedMonthlyCost)}/mo</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      rightSizingAnalysis.recommendedMonthlyCost <= currentMonthlyCost ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} 
                    style={{ 
                      width: `${Math.min(100, Math.max(15, (rightSizingAnalysis.recommendedMonthlyCost / (currentMonthlyCost || 1)) * 100))}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Metric Indicators */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase block">Predicted CPU</span>
                  <span className="font-bold text-blue-600">{predictedCpu.toFixed(1)}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase block">Predicted RAM</span>
                  <span className="font-bold text-indigo-600">{predictedRam.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {rightSizingAnalysis.actionType !== 'MAINTAIN' ? (
                <button
                  type="button"
                  onClick={handleApplyAction}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    rightSizingAnalysis.actionType === 'SCALE_IN'
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/20'
                  }`}
                >
                  <FiCheckCircle />
                  <span>
                    {rightSizingAnalysis.actionType === 'SCALE_IN'
                      ? `Apply Right-Sizing (Save ${formatRupees(rightSizingAnalysis.monthlyDelta)}/mo)`
                      : `Apply Scale-Out to ${rightSizingAnalysis.recommendedNodeCount} Nodes`}
                  </span>
                </button>
              ) : (
                <div className="py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <FiCheckCircle className="text-emerald-600" />
                  <span>Cluster Operating at Peak Cost-Efficiency</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExportFinOpsCsv}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiDownload className="text-slate-400" />
                <span>Export Executive FinOps Audit (CSV in ₹)</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
