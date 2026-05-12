import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Brain, Activity, ShieldCheck, TrendingUp, 
  UserCheck, CreditCard, Box, AlertTriangle, 
  CheckCircle2, Volume2, Download, Share2, 
  ArrowRight, Filter, ChevronDown, Sparkles, X, History,
  MousePointer2, Target, ShieldAlert, Cpu, RefreshCw, BarChart2,
  Package, FileDown, TrendingDown, Clock, MessageSquare, BrainCircuit, Monitor
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SimulationPDFReport from './SimulationPDFReport';
import { useGlobalData } from "../../contexts/DataContext";
import { useAuth } from "../../hooks/useAuth";
import { Badge, ActionBtn as Button } from '../common/UI';
import PresentationMode from './simulation/PresentationMode';

interface DSSResultsViewProps {
  data: any;
  onReRun: () => void;
}

export default function DSSResultsView({ data, onReRun }: DSSResultsViewProps) {
  const [isPlayingVani, setIsPlayingVani] = useState(false);
  const { business } = useAuth();

  const speakNarrative = () => {
    if (!data.vani_narrative) return;
    setIsPlayingVani(true);
    const utterance = new SpeechSynthesisUtterance(data.vani_narrative);
    utterance.onend = () => setIsPlayingVani(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const timer = setTimeout(speakNarrative, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (data.simulated_scenario || data.simulation_id) {
    return <SimulationResultsView data={data} onReRun={onReRun} business={business || { name: 'Vyapari Store' }} />;
  }

  return (
    <div className="space-y-10 pb-20">
      {/* ── NEURAL SAFETY SHIELD ── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_50px_rgba(99,102,241,0.1)]"
      >
         <div className="flex items-center gap-4 text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em]">
            <ShieldCheck size={18} />
            Neural_Shield_Active: Simulation_Sandbox_Enabled
         </div>
         <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px]">LOCAL_COMPUTE</Badge>
      </motion.div>

      {/* ── TOP HUD: EXECUTIVE BRIEFING ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Health Hub */}
         <div className="lg:col-span-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)]" />
            <NeuralHealthScore score={data.business_health_score} label={data.business_health_label} />
            <div className="grid grid-cols-5 gap-3 w-full mt-10">
               {Object.entries(data.health_score_breakdown || {}).map(([key, val]: [string, any], i) => (
                 <div key={i} className="text-center group/bar">
                    <div className="h-16 bg-white/5 rounded-xl mb-3 flex items-end justify-center p-1 border border-white/5 overflow-hidden">
                       <motion.div 
                         initial={{ height: 0 }}
                         animate={{ height: `${val}%` }}
                         className="w-full bg-indigo-500/40 rounded-lg group-hover/bar:bg-indigo-400 transition-colors"
                       />
                    </div>
                    <div className="text-[7px] font-black uppercase text-slate-500 tracking-tighter truncate">
                       {key.split('_')[0]}
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* VANI Briefing Panel */}
         <div className="lg:col-span-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 text-indigo-500/5 pointer-events-none group-hover:text-indigo-500/10 transition-colors">
               <BrainCircuit size={200} />
            </div>
            
            <div className="flex items-center gap-4 mb-8">
               <div className={`p-3 rounded-2xl border transition-all ${isPlayingVani ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40' : 'bg-white/5 border-white/10 text-indigo-400'}`}>
                  <MessageSquare size={24} onClick={speakNarrative} className="cursor-pointer" />
               </div>
               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">VANI_NEURAL_STREAM</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Real-time narrative generation</p>
               </div>
            </div>
            
            <div className="text-2xl font-black tracking-tighter text-white leading-tight mb-10 max-w-3xl italic">
               "{data.vani_narrative}"
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {(data.top_3_urgent_actions || []).map((action: any, i: number) => (
                 <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all group/card">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[8px] font-black uppercase bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">NODE_0{i+1}</span>
                       <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic">+₹{action.rupee_impact?.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] font-black text-white uppercase tracking-tight mb-2 truncate">{action.title}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{action.urgency}_URGENCY</div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* ── FOOTER: CONSOLIDATED ANALYSIS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 relative group">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8">Strategic_Matrix</h3>
            <div className="space-y-4">
               {(data.consolidated_insights || []).slice(0, 8).map((insight: any, i: number) => (
                 <div key={i} className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all">
                    <div className="flex gap-5 items-center">
                       <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-indigo-500">{i+1}</div>
                       <div className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{insight.title}</div>
                    </div>
                    <div className="text-xs font-black text-emerald-400 italic">₹{insight.rupee_impact?.toLocaleString()}</div>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 relative group">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-8">Implementation_Directives</h3>
            <div className="space-y-5">
               {(data.consolidated_recommendations || []).slice(0, 5).map((rec: any, i: number) => (
                 <div key={i} className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] relative group/rec hover:bg-emerald-500/10 transition-all">
                    <div className="absolute top-8 right-8 text-emerald-500 opacity-20 group-hover/rec:opacity-100 group-hover/rec:translate-x-2 transition-all">
                       <ArrowRight size={24} />
                    </div>
                    <div className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-3">{rec.engine || 'Neural'} Strategy</div>
                    <div className="text-lg font-black text-white uppercase tracking-tighter mb-2">{rec.title}</div>
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic pr-12">"{rec.description}"</p>
                    <button className="mt-6 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                       Execute_Node
                    </button>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function NeuralHealthScore({ score, label }: { score: number, label: string }) {
  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="112"
          cy="112"
          r="100"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-white/5"
        />
        <motion.circle
          cx="112"
          cy="112"
          r="100"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray="628"
          initial={{ strokeDashoffset: 628 }}
          animate={{ strokeDashoffset: 628 - (628 * (score || 72)) / 100 }}
          className="text-indigo-500"
          style={{ filter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.6))' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-7xl font-black tracking-tighter text-white italic">{score || 72}</div>
        <div className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mt-2">{label || 'OPTIMAL'}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SIMULATION RESULTS VIEW (INNER)
// ──────────────────────────────────────────────────────────────────────────────

function SimulationResultsView({ data, onReRun, business }: any) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);

  const verdictStyles = {
    PROCEED: { bg: 'bg-emerald-900/30', border: 'border-emerald-500/50', text: 'text-emerald-400', icon: <CheckCircle2 className="text-emerald-400" size={32} />, label: 'SYSTEM_VERDICT: PROCEED' },
    CAUTION: { bg: 'bg-amber-900/30', border: 'border-amber-500/50', text: 'text-amber-400', icon: <AlertTriangle className="text-amber-400" size={32} />, label: 'SYSTEM_VERDICT: CAUTION' },
    DO_NOT_PROCEED: { bg: 'bg-rose-900/30', border: 'border-rose-500/50', text: 'text-rose-400', icon: <ShieldAlert className="text-rose-400" size={32} />, label: 'SYSTEM_VERDICT: ABORT' }
  };

  const currentVerdict = verdictStyles[data.summary.verdict as keyof typeof verdictStyles] || verdictStyles.CAUTION;

  return (
    <div className="space-y-12">
      {/* Verdict HUD */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden p-12 rounded-[3.5rem] border ${currentVerdict.border} ${currentVerdict.bg} backdrop-blur-3xl`}
      >
         <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none">
            <Target size={200} />
         </div>
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-8 text-center md:text-left">
               <div className="w-20 h-20 rounded-[2rem] bg-black/20 flex items-center justify-center border border-white/10 shadow-2xl">
                  {currentVerdict.icon}
               </div>
               <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mb-2">{currentVerdict.label}</h2>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight max-w-2xl italic">
                     "{data.summary.headline}"
                  </h1>
               </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 bg-black/30 rounded-[2.5rem] border border-white/5 min-w-[200px]">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Confidence</div>
               <div className="text-5xl font-black text-white italic">{data.summary.overall_confidence}%</div>
            </div>
         </div>
      </motion.div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <SimKPICard label="Revenue_Delta" val={`₹${data.simulated_scenario.total_revenue_projected.toLocaleString()}`} change={data.summary.potential_revenue_change_percent} />
         <SimKPICard label="Profit_Delta" val={`₹${data.simulated_scenario.total_profit_projected.toLocaleString()}`} change={data.summary.potential_profit_change_percent} />
         <SimKPICard label="Units_Forecast" val={`${data.simulated_scenario.total_units_projected} units`} change={((data.simulated_scenario.total_units_projected - data.current_scenario.total_units_projected)/data.current_scenario.total_units_projected)*100} />
         <SimKPICard label="Margin_Efficiency" val={`${data.simulated_scenario.gross_margin_percent}%`} change={data.simulated_scenario.gross_margin_percent - data.current_scenario.gross_margin_percent} isPP />
      </div>

      {/* Narrative & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[3rem] p-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-10">Neural_Simulation_Narrative</h3>
            <div className="space-y-8">
               {data.ai_insights.map((ins: any, i: number) => (
                 <div key={i} className="p-8 bg-white/5 rounded-3xl border border-white/5 relative group hover:border-indigo-500/30 transition-all">
                    <div className="flex justify-between items-center mb-4">
                       <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[8px]">{ins.type}</Badge>
                       <span className="text-[9px] font-black text-slate-600 uppercase italic">Priority: {ins.priority}</span>
                    </div>
                    <h4 className="text-lg font-black text-white uppercase mb-3 tracking-tight">{ins.title}</h4>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic mb-6">"{ins.detail}"</p>
                    <div className="flex justify-between items-center pt-6 border-t border-white/5">
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Confidence: {ins.confidence}%</span>
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Basis: {ins.data_basis}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-600/20">
               <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                  <Cpu size={120} />
               </div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6">Next_Steps</h3>
               <div className="space-y-6 relative z-10">
                  {data.recommendations.slice(0, 3).map((rec: any, i: number) => (
                    <div key={i} className="space-y-1">
                       <div className="text-[11px] font-black uppercase tracking-tight">{rec.title}</div>
                       <div className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">{rec.expected_impact}</div>
                    </div>
                  ))}
               </div>
               <button onClick={onReRun} className="w-full mt-12 py-5 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white shadow-xl hover:bg-indigo-50 transition-all">
                  Run Alternate Scenario
               </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <PDFDownloadLink 
                 document={<SimulationPDFReport data={data} business={business} />} 
                 fileName={`Vyapari_Strategy_${new Date().toISOString().split('T')[0]}.pdf`}
                 className="w-full"
               >
                 <button className="w-full py-6 bg-white/5 border border-white/10 rounded-3xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <FileDown size={18} /> PDF
                 </button>
               </PDFDownloadLink>

               <button 
                 onClick={() => setShowPresentation(true)}
                 className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-800 border border-indigo-400 rounded-3xl text-white font-black uppercase text-[10px] tracking-widest hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-2"
               >
                  <Monitor size={18} /> Present
               </button>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {showPresentation && (
          <PresentationMode 
            data={data} 
            business={business} 
            onExit={() => setShowPresentation(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SimKPICard({ label, val, change, isPP = false }: any) {
  const isPos = change >= 0;
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 group hover:bg-white/10 transition-all">
       <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">{label}</div>
       <div className="text-2xl font-black text-white italic tracking-tighter mb-2">{val}</div>
       <div className={`text-[10px] font-black flex items-center gap-2 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPos ? '+' : ''}{change.toFixed(1)}{isPP ? 'pp' : '%'}
          <TrendingUp size={12} className={isPos ? '' : 'rotate-180'} />
       </div>
    </div>
  );
}
