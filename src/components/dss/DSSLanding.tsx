import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Brain, ShieldCheck, Activity, 
  TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, Volume2, Download, Share2, 
  ArrowRight, Filter, ChevronDown, Sparkles, X, History,
  MousePointer2, Target, Target as TargetIcon, ShieldAlert, Cpu, RefreshCw, BarChart2,
  Package, FileDown, BrainCircuit, MessageSquare, ListFilter, Search,
  Lightbulb, Gauge, Info, ChevronRight, Monitor, Trophy, Rocket, Bell,
  Radar as RadarIcon, Radio
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { useGlobalData } from "../../contexts/DataContext";
import { useAuth } from "../../context/AuthContext";
import { dssService } from "../../services/dss/dssService";
import { generateInsights } from "../../services/dss/insightGenerator";
import { Badge, ActionBtn as Button } from '../common/UI';
import { useToast } from '../common/Toast';
import EnginePanel from './EnginePanel';
import PresentationMode from './simulation/PresentationMode';

export default function DSSLanding() {
  const { products, invoices } = useGlobalData();
  const { user, business } = useAuth();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeEngine, setActiveEngine] = useState<string | null>(null);
  const [vaniSpeaking, setVaniSpeaking] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [showPresentation, setShowPresentation] = useState(false);

  useEffect(() => {
    const runAnalysis = async () => {
      if (products.length === 0) {
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
        const res = await dssService.runFullDSSAnalysis(products, invoices);
        const briefing = await dssService.generateBusinessBriefing(res);
        res.vani_narrative = briefing?.[0]?.body || "No immediate threats detected. Proceed with expansion.";
        setAnalysis(res);
        
        const ruleInsights = await generateInsights(res.engineOutputs, {
          type: business?.category || 'Retail',
          city: business?.city || 'Mumbai',
          monthlyRevenue: res.summary.totalOpportunityValue
        });
        setAiInsights(ruleInsights);
      } catch (err) {
        console.error("DSS Analysis Failed:", err);
        toast("Neural link failed.", "error");
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [products, invoices, business]);

  const speakNarrative = () => {
    if (!analysis?.vani_narrative) return;
    setVaniSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(analysis.vani_narrative);
    utterance.onend = () => setVaniSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  if (loading) return <DSSLoadingSkeleton />;

  if (!analysis || products.length === 0) {
    return <DSSInsufficientData onSeed={() => window.location.reload()} />;
  }

  const topTips = [...(analysis.recommendations || [])].sort((a: any, b: any) => 
    (b.priority === 'critical' ? 2 : 1) - (a.priority === 'critical' ? 2 : 1)
  ).slice(0, 3);

  return (
    <div className="space-y-8 pb-20">
      {/* ── TOP SECTION: BRIEFING & STATUS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Analysis Status */}
        <div className="lg:col-span-4 bg-[#1E293B]/50 border border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Activity className="w-32 h-32 text-indigo-500" />
           </div>
           <NeuralHealthOrb score={analysis.summary.healthScore} />
           <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Health</h3>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Based on 30-day telemetry</p>
           </div>
        </div>

        {/* Narrative Briefing */}
        <div className="lg:col-span-8 bg-[#1E293B]/50 border border-slate-800 p-8 rounded-3xl space-y-8 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <button 
                   onClick={speakNarrative}
                   className={`p-3 rounded-xl border transition-all ${vaniSpeaking ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 border-slate-700 text-indigo-400 hover:text-white'}`}
                 >
                    <Volume2 size={18} className={vaniSpeaking ? 'animate-pulse' : ''} />
                 </button>
                 <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Global Briefing</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link Status: Secure • AI Sync Active</p>
                 </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPresentation(true)}
                  className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Monitor size={14} /> Present Mode
                </button>
                <button className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all">
                   <Share2 size={16} />
                </button>
              </div>
           </div>

           <div className="space-y-4">
              <p className="text-xl font-medium text-slate-200 leading-relaxed border-l-2 border-indigo-500/50 pl-6">
                 "{analysis.vani_narrative || "No immediate threats detected. Proceed with expansion."}"
              </p>
           </div>

           <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
              <KPICard label="Risk Value" value={`₹${(analysis.summary?.totalRevenueAtRisk || 0).toLocaleString()}`} color="text-rose-400" />
              <KPICard label="Opportunity" value={`₹${(analysis.summary?.totalOpportunityValue || 0).toLocaleString()}`} color="text-emerald-400" />
              <KPICard label="Accuracy" value={`${(analysis.summary?.healthScore || 92).toFixed(1)}%`} color="text-indigo-400" />
           </div>
        </div>
      </div>

      {/* SMART TIPS SECTION */}
      <div className="space-y-6">
         <div className="flex items-center gap-3">
            <Sparkles className="text-indigo-400 w-4 h-4" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Critical Strategic Actions</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topTips.map((tip: any, i: number) => (
               <div 
                 key={i}
                 className="bg-[#1E293B]/50 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col h-full shadow-lg"
                 onClick={() => setActiveEngine(tip.engine)}
               >
                  <div className="flex justify-between items-start mb-6">
                     <div className={`p-3 rounded-xl ${tip.priority === 'critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {tip.engine === 'inventory' ? <Package size={20} /> : <Zap size={20} />}
                     </div>
                     <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${tip.priority === 'critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {tip.priority}
                     </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 tracking-tight group-hover:text-indigo-400 transition-colors">{tip.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-1">{tip.headline}</p>

                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center mt-auto">
                     <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-widest mb-1">Potential Impact</span>
                        <span className="text-base font-bold text-emerald-400 italic">+₹{(tip.impactEstimate?.value || 0).toLocaleString()}</span>
                     </div>
                     <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-indigo-600 transition-all">
                        <ArrowRight size={14} />
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* ── LOWER SECTION: MISSIONS & KNOWLEDGE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Mission Tracker */}
         <div className="lg:col-span-7 bg-[#1E293B]/50 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform">
               <Trophy size={160} className="text-indigo-500" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
               <div className="w-20 h-20 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner border border-indigo-500/20">
                  <Rocket size={32} className="animate-bounce" />
               </div>
               <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                     <h3 className="text-base font-bold text-white tracking-tight uppercase mb-1">Growth Mission</h3>
                     <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed">
                        Complete your pricing updates today to reach your monthly goal of ₹8,000 extra profit.
                     </p>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Progress</span>
                        <span>75%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" style={{ width: '75%' }} />
                     </div>
                  </div>
                  <button className="px-8 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-lg">Resume Mission</button>
               </div>
            </div>
         </div>

         {/* Tactical Intelligence Hub */}
         <div className="lg:col-span-5 bg-[#1E293B]/50 border border-slate-800 p-8 rounded-3xl space-y-6 flex flex-col">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <RadarIcon className="text-indigo-400 w-4 h-4" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Tactical Radar</h3>
               </div>
               <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Market Gap</Badge>
            </div>
            
            <div className="flex-1 h-[280px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                    { subject: 'Pricing', A: 120, fullMark: 150 },
                    { subject: 'Inventory', A: 98, fullMark: 150 },
                    { subject: 'Loyalty', A: 86, fullMark: 150 },
                    { subject: 'Growth', A: 99, fullMark: 150 },
                    { subject: 'Margins', A: 85, fullMark: 150 },
                 ]}>
                   <PolarGrid stroke="rgba(255,255,255,0.05)" />
                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 700 }} />
                   <Radar name="Business" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                 </RadarChart>
               </ResponsiveContainer>
            </div>

            <div className="pt-4 border-t border-white/5">
               <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest italic">
                  "Your Pricing edge is high, but Loyalty signals are fading. Prioritize customer rescue missions."
               </p>
            </div>
         </div>
      </div>

      {/* ── LIVE FEED: REFINED TICKER ── */}
      <div className="bg-[#1E293B]/30 border border-white/5 p-4 rounded-3xl flex items-center gap-6 overflow-hidden relative shadow-2xl backdrop-blur-xl">
         <div className="flex items-center gap-3 shrink-0 text-indigo-400 px-4 border-r border-white/5">
            <Radio size={14} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Tactical Feed</span>
         </div>
         <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="animate-scroll-text flex gap-20 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
               <span>• AI detected high demand for "{products[0]?.name || 'Top Products'}" locally</span>
               <span className="text-rose-400">• Revenue velocity dropped 12% in the last hour</span>
               <span className="text-indigo-400">• Neural Link suggests {topTips[0]?.title || 'New Actions'}</span>
               <span className="text-emerald-400">• New market opportunity detected in Stationery category</span>
            </div>
         </div>
         <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0F172A] to-transparent pointer-events-none" />
      </div>

      {/* MODAL OVERLAY */}
      <AnimatePresence>
        {activeEngine && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-10 bg-black/80 backdrop-blur-md overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, scale: 0.98, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.98, y: 20 }}
               className="w-full max-w-6xl relative"
             >
                <button 
                  onClick={() => setActiveEngine(null)}
                  className="absolute -top-4 -right-4 p-3 bg-white text-slate-900 rounded-full shadow-2xl z-10 hover:scale-110 transition-all border border-slate-200"
                >
                  <X size={20} />
                </button>
                {analysis.engineOutputs.map((engine: any) => (
                  engine.id === activeEngine && (
                    <EnginePanel 
                      key={engine.id}
                      engineId={engine.id}
                      title={engine.title}
                      description={engine.description}
                      icon={engine.id === 'inventory' ? <Package /> : engine.id === 'pricing' ? <TrendingUp /> : <Activity />}
                      summaryData={engine.summary}
                      data={engine.visualizationData || []}
                      insights={(engine.recommendations || []).map((r: any) => ({
                         title: r.title,
                         detail: r.detail,
                         priority: r.priority,
                         rupee_impact: r.impactEstimate?.value || 0
                      }))}
                      onRun={() => toast(`Syncing ${engine.title}...`, "info")}
                    />
                  )
                ))}
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPresentation && analysis && (
          <PresentationMode 
            data={{ ...analysis, summary: { headline: analysis.vani_narrative, overall_confidence: 96, potential_revenue_change_percent: 12.4, potential_profit_change_percent: 8.2 }}} 
            business={business} 
            onExit={() => setShowPresentation(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NeuralHealthOrb({ score }: { score: number }) {
  const color = score > 80 ? '#10B981' : score > 60 ? '#6366f1' : '#F43F5E';
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full border border-slate-800 shadow-inner" />
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 rounded-full border border-dashed border-slate-700/50"
      />
      <div className="text-center relative z-10">
        <span style={{ color }} className="text-6xl font-bold tracking-tighter drop-shadow-lg">
          {Math.round(score)}
        </span>
        <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-1">Health Score</div>
      </div>
      <div className="absolute inset-0 rounded-full blur-3xl opacity-10" style={{ backgroundColor: color }} />
    </div>
  );
}

function KPICard({ label, value, color, icon }: any) {
  return (
    <div className="space-y-1">
       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">{label}</span>
       <div className={`text-lg font-bold tracking-tight ${color}`}>{value}</div>
    </div>
  );
}

function DSSLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
       <div className="grid grid-cols-12 gap-8">
          <div className="col-span-4 h-80 bg-white/5 rounded-3xl" />
          <div className="col-span-8 h-80 bg-white/5 rounded-3xl" />
       </div>
       <div className="grid grid-cols-3 gap-8">
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="h-48 bg-white/5 rounded-2xl" />
       </div>
    </div>
  );
}

function DSSInsufficientData({ onSeed }: { onSeed: () => void }) {
  const { business, user } = useAuth(); 
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!business?.id || !user?.id) {
       toast("Authentication required.", "error");
       return;
    }
    setSeeding(true);
    try {
      await dssService.seedSampleData(business.id, user.id);
      toast("Syncing...", "success");
      setTimeout(onSeed, 2000);
    } catch (err) {
      toast("Sync failed.", "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-20 text-center space-y-8 bg-[#1E293B]/50 border border-slate-800 rounded-3xl">
       <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <BrainCircuit size={40} />
       </div>
       <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white tracking-tight">Establish Neural Link</h2>
          <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
             We need a baseline dataset to start generating growth tips for your shop.
          </p>
       </div>
       <button onClick={handleSeed} disabled={seeding} className="px-12 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all">
          {seeding ? 'Syncing...' : 'Start Telemetry'}
       </button>
    </div>
  );
}
