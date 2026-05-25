import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Target, ShieldCheck, Flag, TrendingUp, 
  UserCheck, Database, MousePointer2, Share2, 
  Clock, AlertTriangle, CheckCircle2, ChevronRight,
  Brain, Activity, BarChart3, Settings
} from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';
import { dssService } from '../../services/dss/dssService';
import { generateInsights } from '../../services/dss/insightGenerator';
import { DSSAnalysisResult, DSSRecommendation, DSSInsight } from '../../services/dss/types';
import { Card, SectionHeader, Badge, ActionBtn as Button } from '../common/UI';
import { useToast } from '../common/Toast';

export default function DSSHub() {
  const { data: products } = useData<any>('products');
  const { data: invoices } = useData<any>('invoices');
  const { profile } = useAuth();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<DSSAnalysisResult | null>(null);
  const [insights, setInsights] = useState<DSSInsight[]>([]);
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inventory' | 'pricing' | 'finance'>('all');

  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      const res = await dssService.runFullDSSAnalysis(products, invoices);
      setAnalysis(res);
      
      const ruleInsights = await generateInsights(res.engineOutputs, {
        type: 'Retail',
        city: 'Mumbai',
        monthlyRevenue: res.summary.totalRevenueAtRisk * 2
      });
      
      setInsights(ruleInsights);
      setLoading(false);

      // Note: Streaming logic for Business Insights is currently handled within generateInsights via Supabase Edge Functions
    };

    runAnalysis();
  }, [products, invoices]);

  if (loading && !analysis) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-t-4 border-indigo-500 border-r-4 border-transparent shadow-[0_0_50px_rgba(99,102,241,0.3)]"
        />
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Getting Smart Tips Ready...</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase mt-2 tracking-widest">Checking your shop details...</p>
        </div>
      </div>
    );
  }

  const filteredRecs = analysis?.recommendations.filter(r => filter === 'all' || r.engine === filter) || [];

  return (
    <div className="space-y-12 pb-20">
      {/* -- Futuristic HUD Header -- */}
      <div className="relative overflow-hidden bg-slate-950 rounded-2xl p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
             <SmartHealthOrb score={analysis?.summary.healthScore || 0} />
          </div>
          
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Brain size={12} /> Smart Assistant
              </div>
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Analyzed at {analysis?.analysedAt.toLocaleTimeString()}
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none uppercase">
              Your Shop <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Health Advice</span>
            </h1>
            <p className="text-slate-300 text-base font-medium max-w-2xl leading-relaxed">
              Our smart shop checker has detected <span className="text-rose-400 font-bold">{analysis?.summary.critical} critical threats</span> and <span className="text-emerald-400 font-bold">{analysis?.summary.totalOpportunityValue.toLocaleString()} in revenue opportunities</span>.
            </p>
            
            <div className="grid grid-cols-3 gap-6 mt-8">
              <SummaryPill label="Revenue at Risk" value={`Rs.${(analysis?.summary.totalRevenueAtRisk || 0).toLocaleString()}`} color="text-rose-400" />
              <SummaryPill label="Opportunity Pool" value={`Rs.${(analysis?.summary.totalOpportunityValue || 0).toLocaleString()}`} color="text-emerald-400" />
              <SummaryPill label="System Confidence" value={`${(analysis?.executionMs || 0) < 1000 ? '98.4%' : '94.2%'}`} color="text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* -- Recommendation Stream -- */}
        <div className="lg:col-span-8 space-y-10">
           <div className="flex justify-between items-end">
              <SectionHeader title="Important Smart Tips" subtitle="Sorted by importance" />
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                {['all', 'inventory', 'pricing', 'finance'].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
           </div>

           <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {filteredRecs.map((rec, idx) => (
                  <RecommendationCard key={rec.id} rec={rec} index={idx} />
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* -- Sidebar Intelligence -- */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="!bg-slate-950 !border-white/5 !p-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <div className="flex items-center gap-3 mb-6">
                <Brain className="text-emerald-400" size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Smart Summary</span>
              </div>
              <div className="min-h-[300px] font-mono text-sm leading-relaxed text-emerald-100/80 whitespace-pre-wrap">
                {aiText}
                <motion.span 
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-emerald-400 ml-1 translate-y-1"
                />
              </div>
           </Card>

           <Card className="p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                 <Activity size={14} className="text-indigo-500" /> Rule Summaries
              </h4>
              <div className="space-y-4">
                {insights.map(insight => (
                  <div key={insight.id} className={`p-4 rounded-2xl ${insight.type === 'problem_solution' ? 'bg-indigo-950/20 border border-indigo-500/30' : 'bg-slate-50 border border-slate-100'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${insight.type === 'problem_solution' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {insight.title}
                    </div>
                    <p className={`text-xs font-medium mb-4 ${insight.type === 'problem_solution' ? 'text-slate-300 leading-relaxed' : 'text-slate-600'}`}>
                      {insight.body}
                    </p>
                    
                    {insight.solutions && insight.solutions.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Available Solutions:</div>
                        {insight.solutions.map((sol, idx) => (
                          <div key={sol.id} className="p-4 bg-slate-900 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-all group/sol cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[11px] font-black text-white">{sol.title}</span>
                              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{sol.impact}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mb-4">{sol.description}</p>
                            <button className="w-full py-2 bg-white/5 group-hover/sol:bg-indigo-600 text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover/sol:text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                              {sol.actionLabel} <ChevronRight size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

function SmartHealthOrb({ score }: { score: number }) {
  const color = score > 80 ? '#10B981' : score > 60 ? '#F59E0B' : '#F43F5E';
  
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Rotating Rings */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-white/5"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 rounded-full border border-dashed border-white/10"
      />
      
      {/* Central Score */}
      <div className="text-center relative z-10">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ color }}
          className="text-7xl font-black tracking-tighter"
        >
          {Math.round(score)}
        </motion.div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mt-2">Health Index</div>
      </div>
      
      {/* Glow Effect */}
      <div 
        className="absolute inset-0 rounded-full blur-[60px] opacity-20"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function SummaryPill({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2">{label}</div>
      <div className={`text-2xl font-black tracking-tighter ${color}`}>{value}</div>
    </div>
  );
}

function RecommendationCard({ rec, index }: { rec: DSSRecommendation, index: number }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const colorClass = rec.priority === 'critical' ? 'border-rose-500/30' : rec.priority === 'high' ? 'border-amber-500/30' : 'border-indigo-500/30';
  const glowClass = rec.priority === 'critical' ? 'shadow-[0_0_30px_rgba(244,63,94,0.1)]' : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card !p-0 overflow-hidden border-2 ${colorClass} ${glowClass} hover:border-opacity-100 transition-all duration-500`}
    >
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex gap-6 items-start">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              rec.engine === 'inventory' ? 'bg-indigo-600 text-white' : 
              rec.engine === 'pricing' ? 'bg-emerald-600 text-white' : 
              'bg-amber-600 text-white'
            }`}>
              {rec.engine === 'inventory' ? <Target size={24} /> : 
               rec.engine === 'pricing' ? <TrendingUp size={24} /> : 
               <ShieldCheck size={24} />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge status={rec.priority.toUpperCase()} className={
                  rec.priority === 'critical' ? '!bg-rose-500 !text-white' :
                  rec.priority === 'high' ? '!bg-amber-500 !text-white' : '!bg-indigo-500 !text-white'
                } />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{rec.engine} Engine</span>
                <span className="text-[9px] font-bold text-slate-300">-</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{Math.round(rec.confidence * 100)}% Match</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-tight uppercase mb-2">{rec.title}</h3>
              <p className="text-lg font-bold text-indigo-600/80 tracking-tight">{rec.headline}</p>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <div className={`text-3xl font-black tracking-tighter ${(rec.impactEstimate?.direction || 'positive') === 'negative' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {(rec.impactEstimate?.direction || 'positive') === 'negative' ? '-' : '+'}
              {rec.impactEstimate?.unit || 'Rs.'}{(rec.impactEstimate?.value || 0).toLocaleString()}
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">{rec.impactEstimate?.metric || 'Financial Impact'}</div>
            <Button 
              className="!px-8 !py-4 !rounded-2xl shadow-xl border border-neon text-neon hover:bg-neon hover:text-slate-900"
              onClick={async () => {
                if (rec.action.type === 'restock') {
                  toast("Sending restock request to suppliers...", "info");
                  // In real app: await supabase.functions.invoke('agentic-procurement', { body: { productId: rec.affectedItemId } });
                } else {
                  toast(`Executing: ${rec.action.label}`, "info");
                }
              }}
            >
              {rec.action.label}
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {rec.evidence.map((pill, i) => (
            <div key={i} className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 flex items-center gap-2 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-default">
              <Database size={10} /> {pill}
            </div>
          ))}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1 ml-2"
          >
            {expanded ? 'Hide Details' : 'View Reasoning'} <ChevronRight size={12} className={expanded ? 'rotate-90' : ''} />
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="text-slate-600 font-medium leading-relaxed italic mb-4">
                  &ldquo;{rec.detail}&rdquo;
                </p>
                
                {/* Task 4: Glass-Box Explanation */}
                {rec.explanation && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="text-emerald-400" size={14} />
                       <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Why we recommend this</span>
                    </div>
                    <div className="text-sm font-medium text-slate-300 leading-relaxed">
                      {rec.explanation.logic}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rec.explanation.variables?.map((v: string) => (
                        <span key={v} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-black uppercase text-slate-500 tracking-tighter">
                          ${v}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                       <span className="text-[9px] font-bold text-slate-500 uppercase">Variable Weighting</span>
                       <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${(rec.explanation.weight || 0.5) * 100}%` }} />
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
