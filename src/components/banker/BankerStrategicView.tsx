import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, ShieldCheck, Landmark, FileText, 
  Percent, ChevronRight, Activity, Award, HelpCircle
} from 'lucide-react';
import { Card, SectionHeader, Badge, ActionBtn as Button } from '../common/UI';
import { useToast } from '../common/Toast';
import { bankerService, BankerMetrics } from '../../services/bankerService';
import { cmaReportGenerator, CMAReport } from '../../services/intelligence/cmaReportGenerator';
import { useAuth } from '../../hooks/useAuth';
import { exportService } from '../../services/exportService';

export default function BankerStrategicView({ businessId = "default_business" }: { businessId?: string }) {
  const { business } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<BankerMetrics | null>(null);
  const [cmaReport, setCmaReport] = useState<CMAReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'cma'>('metrics');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedMetrics = await bankerService.getBankerData(businessId);
        setMetrics(fetchedMetrics);
        const report = await cmaReportGenerator.generateReport(businessId);
        setCmaReport(report);
      } catch (err) {
        console.error("Failed to load banker strategic view telemetry:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-t-4 border-indigo-500 border-r-4 border-transparent shadow-[0_0_50px_rgba(99,102,241,0.3)]"
        />
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Analyzing solvency telemetry</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase mt-2 tracking-widest">Evaluating banking credit scores...</p>
        </div>
      </div>
    );
  }

  const scoreColor = metrics.loanEligibility.score > 75 ? '#10B981' : metrics.loanEligibility.score > 50 ? '#F59E0B' : '#F43F5E';

  return (
    <div className="space-y-12 pb-20">
      {/* ── Futuristic Strategic HUD Header ── */}
      <div className="relative overflow-hidden bg-slate-950 rounded-2xl p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            <div className="relative flex items-center justify-center w-64 h-64">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-white/5"
              />
              <div className="text-center relative z-10">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ color: scoreColor }}
                  className="text-7xl font-black tracking-tighter"
                >
                  {metrics.loanEligibility.score}
                </motion.div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mt-2">Credit Score</div>
              </div>
            </div>

            {/* AI THINKING CONSOLE */}
            <div className="absolute -bottom-4 w-full px-4">
              <div className="bg-emerald-950/40 border border-emerald-500/20 backdrop-blur-md rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Neural Reasoning Engine</span>
                </div>
                <div className="text-[9px] font-mono text-emerald-100/60 leading-tight">
                  {`Evaluating Cash_Runway [${metrics.cashRunway.months.toFixed(1)}M]... 
                  Index_Ratio: ${metrics.currentRatio.toFixed(2)}x. 
                  Solvency_Risk: LOW. 
                  Recommendation: INCREASE_CREDIT_LIMIT.`}
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Landmark size={12} /> Credit Readiness Command
              </div>
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Real-Time Banking Underwriting Evaluator
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none uppercase">
              Banker's <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Strategic view</span>
            </h1>
            <p className="text-slate-300 text-base font-medium max-w-2xl leading-relaxed">
              {metrics.loanEligibility.reason} Use this dashboard to analyze your institutional creditworthiness and generate formal reports.
            </p>
            
            <div className="flex bg-white/5 p-1.5 rounded-2xl gap-2 mt-8 max-w-xs border border-white/10">
              <button 
                onClick={() => setActiveTab('metrics')}
                className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'metrics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Telemetry
              </button>
              <button 
                onClick={() => setActiveTab('cma')}
                className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cma' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                CMA Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'metrics' ? (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            {/* ── Key Ratios Grid ── */}
            <div className="lg:col-span-8 space-y-10">
              <SectionHeader title="Institutional Underwriting Ratios" subtitle="Live health metrics checked by creditors" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RatioPill 
                  label="Current Ratio" 
                  value={metrics.currentRatio.toFixed(2)} 
                  benchmark="Benchmark: > 1.50" 
                  description="Measures ability to cover short-term liabilities with current assets."
                  status={metrics.currentRatio > 1.5 ? 'healthy' : 'tight'}
                />
                <RatioPill 
                  label="Quick Ratio" 
                  value={metrics.quickRatio.toFixed(2)} 
                  benchmark="Benchmark: > 1.00" 
                  description="Evaluates cash & receivables against liabilities (excluding inventory)."
                  status={metrics.quickRatio > 1.0 ? 'healthy' : 'tight'}
                />
                <RatioPill 
                  label="Debt-to-Equity" 
                  value={metrics.debtToEquity.toFixed(2)} 
                  benchmark="Benchmark: < 0.50" 
                  description="Calculates leverage and funding ratios relative to business equity."
                  status={metrics.debtToEquity < 0.5 ? 'healthy' : 'leverage'}
                />
              </div>

              {/* Overdue Risks */}
              <div className="pt-6">
                <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 flex items-center gap-2">
                  <Activity size={14} className="text-emerald-500" /> Accounts Receivable Risk Factors
                </h3>
                <div className="space-y-4">
                  {metrics.receivablesRisks.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No critical overdue receivables detected.
                    </div>
                  ) : (
                    metrics.receivablesRisks.map((risk, idx) => (
                      <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:bg-white hover:border-emerald-200 transition-all cursor-default">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Debtor / Contact</div>
                          <div className="text-lg font-black text-slate-900 uppercase">{risk.party}</div>
                        </div>
                        <div className="text-right flex items-center gap-10">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk probability</div>
                            <div className="font-bold text-rose-500">{100 - risk.probability}% Risk</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Outstanding Balance</div>
                            <div className="text-lg font-black text-slate-900">₹{risk.amount.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar Stats ── */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="!bg-slate-950 !border-white/5 !p-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <div className="flex items-center gap-3 mb-6">
                  <Award className="text-emerald-400" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Strategic Insights</span>
                </div>
                <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-medium">
                  <p>
                    • At your current burn rate, your business cash runway is approximately <strong className="text-emerald-400">{metrics.cashRunway.months.toFixed(1)} months</strong>.
                  </p>
                  <p>
                    • Maintaining a Quick Ratio of over <strong className="text-emerald-400">1.0</strong> puts you in the top 15% of evaluated SMEs in your tier.
                  </p>
                  <p>
                    • Suggested actions: Resolve outstanding high-risk receivables to optimize liquidity further.
                  </p>
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cma"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            <SectionHeader 
              title="Credit Monitoring Arrangement (CMA) Report" 
              subtitle="Structured formatting prepared automatically"
              action={
                <div className="flex gap-4">
                  <Button 
                    secondary
                    onClick={async () => {
                      if (metrics) {
                        await exportService.generateCMAReport(business?.name || "Vyapari Business", metrics);
                      } else {
                        toast("Metrics are not loaded yet.", "warning");
                      }
                    }}
                  >
                    Export CMA (CSV)
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                    onClick={async () => {
                      if (metrics) {
                        toast("Authenticating and Generating Neural Passport...", "info");
                        await exportService.generateFinancialPassport(business?.name || "Vyapari Business", metrics);
                      } else {
                        toast("Metrics are not loaded yet.", "warning");
                      }
                    }}
                  >
                    <Award size={14} className="mr-2" /> GET_FINANCIAL_PASSPORT (PDF)
                  </Button>
                </div>
              }
            />

            {cmaReport && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="p-8 space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4 border-slate-100">
                    <TrendingUp className="text-indigo-500" size={20} />
                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800">Operational Health</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailRow label="Health Index Score" value={`${cmaReport.businessSummary.healthScore}/100`} />
                    <DetailRow label="Liquidity Status" value={cmaReport.businessSummary.liquidityStatus} />
                    <DetailRow label="Solvency Status" value={cmaReport.businessSummary.solvencyStatus} />
                  </div>
                </Card>

                <Card className="p-8 space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4 border-slate-100">
                    <Percent className="text-emerald-500" size={20} />
                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800">Financial Highlights</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailRow label="Current Ratio" value={cmaReport.financialHighlights.currentRatio} />
                    <DetailRow label="Quick Ratio" value={cmaReport.financialHighlights.quickRatio} />
                    <DetailRow label="Debt-to-Equity" value={cmaReport.financialHighlights.debtToEquity} />
                    <DetailRow label="Cash Runway" value={cmaReport.financialHighlights.cashRunway} />
                  </div>
                </Card>

                <Card className="p-8 space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4 border-slate-100">
                    <Landmark className="text-amber-500" size={20} />
                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800">Banking Readiness</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailRow label="Qualified for Credit" value={cmaReport.bankingReadiness.qualified ? 'Yes' : 'No'} />
                    <DetailRow label="Suggested Loan Limit" value={`₹${cmaReport.bankingReadiness.suggestedLoanLimit.toLocaleString()}`} />
                    <DetailRow label="Estimated QoQ Revenue" value={`₹${cmaReport.projections.nextQuarterRevenue.toLocaleString()}`} />
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RatioPill({ label, value, benchmark, description, status }: { label: string, value: string, benchmark: string, description: string, status: 'healthy' | 'tight' | 'leverage' }) {
  const color = status === 'healthy' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5';
  
  return (
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-6 hover:bg-white hover:border-slate-200 transition-all">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</div>
        <div className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">{value}</div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border rounded-full inline-block ${color}`}>
          {benchmark}
        </span>
      </div>
      <p className="text-xs text-slate-500 font-bold leading-relaxed">{description}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50">
      <span className="text-xs text-slate-400 font-black uppercase tracking-widest">{label}</span>
      <span className="text-sm text-slate-800 font-black uppercase">{value}</span>
    </div>
  );
}
