import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, Play, Download, CheckCircle2, AlertTriangle, 
  TrendingUp, TrendingDown, MoreHorizontal, Maximize2, 
  ExternalLink, FileJson, Target, Activity, Cpu, Zap, RefreshCw,
  Box, Users, DollarSign, Globe, Skull, FileText, Gift, ChevronRight, X,
  ShieldAlert, Database, FileDown, Monitor
} from 'lucide-react';
import PresentationMode from './simulation/PresentationMode';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, LineChart, 
  Line, ScatterChart, Scatter, ZAxis, Legend, AreaChart, Area
} from 'recharts';
import { Badge } from '../common/UI';

interface EnginePanelProps {
  engineId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  summaryData: { label: string, value: string | number, color?: string }[];
  data: any[];
  insights: any[];
  onRun?: () => void;
  onExport?: () => void;
  onApply?: () => void;
  loading?: boolean;
  emptyState?: { current: number, required: number, message: string } | null;
}

export default function EnginePanel({
  engineId,
  title,
  description,
  icon,
  summaryData,
  data,
  insights,
  onRun,
  onExport,
  onApply,
  loading = false,
  emptyState = null
}: EnginePanelProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [showPresentation, setShowPresentation] = useState(false);

  if (loading) return <EngineSkeleton />;
  if (emptyState) return <EngineEmptyState title={title} icon={icon} {...emptyState} />;

  return (
    <>
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-2xl relative"
    >
      <div className="absolute top-0 right-0 p-8 text-indigo-500/5 pointer-events-none">
         <Cpu size={120} />
      </div>

      {/* ── HEADER ── */}
      <div className="p-8 flex justify-between items-start border-b border-white/5 relative z-10">
        <div className="flex gap-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
             {icon}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black uppercase tracking-tight text-white italic">{title}</h3>
              <Badge className="border-indigo-500/30 text-indigo-400 text-[8px] uppercase">Active_Engine</Badge>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPresentation(true)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 transition-all"
          >
             <Monitor size={14} /> Present
          </button>
          <button onClick={onRun} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-400 shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all">
             <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Run Engine
          </button>
        </div>
      </div>

      {/* ── SUMMARY STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border-b border-white/5 relative z-10">
        {summaryData.map((stat, i) => (
          <div key={i} className="p-6 bg-slate-900/40 text-center group hover:bg-slate-900/60 transition-all border-r border-white/5 last:border-r-0">
            <div className="text-[8px] text-slate-500 uppercase font-black tracking-[0.2em] mb-2">{stat.label}</div>
            <div className="text-xl font-black tracking-tighter italic" style={{ color: stat.color || '#fff' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── VISUALIZATION ── */}
      <div className="flex-1 p-8 min-h-[400px] flex flex-col relative z-10">
        <div className="flex justify-between items-center mb-10">
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <button 
              onClick={() => setViewMode('chart')}
              className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'chart' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Neural_Visual
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Data_Terminal
            </button>
          </div>
          <div className="flex gap-3">
             <button className="p-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-white border border-white/5">
                <Maximize2 size={16} />
             </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {viewMode === 'chart' ? (
            <EngineChart type={engineId} data={data} />
          ) : (
            <EngineDataTable type={engineId} data={data} />
          )}
        </div>
      </div>

      {/* ── INSIGHTS ── */}
      <div className="p-8 bg-black/20 border-t border-white/5 relative z-10">
        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6 flex items-center gap-2">
           <Zap size={12} fill="currentColor" /> Neural_Deductions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02, x: 5 }}
              className="p-6 bg-white/5 border border-white/5 rounded-3xl flex gap-6 items-start hover:border-indigo-500/30 transition-all group"
            >
              <div className={`p-3 rounded-2xl border ${insight.priority === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>
                {insight.priority === 'CRITICAL' ? <ShieldAlert size={20} /> : <Target size={20} />}
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">{insight.title}</div>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic line-clamp-2">"{insight.detail}"</p>
                {insight.rupee_impact && (
                  <div className="mt-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                     <TrendingUp size={12} /> Projected_Gain: +₹{insight.rupee_impact.toLocaleString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div className="p-8 flex justify-between items-center border-t border-white/5 bg-slate-950/40 relative z-10">
        <button onClick={onExport} className="px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center gap-3 transition-all">
          <FileDown size={16} /> Export_Report
        </button>
        <button onClick={onApply} className="px-8 py-4 bg-white text-slate-900 hover:bg-indigo-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white shadow-2xl flex items-center gap-3 transition-all">
          Execute_Directive <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>

      <AnimatePresence>
        {showPresentation && (
          <PresentationMode 
            data={{
              engineId,
              title,
              summary: {
                headline: insights[0]?.title || `Strategic analysis of ${title} complete.`,
                overall_confidence: 94,
                potential_revenue_change_percent: 8.5,
                potential_profit_change_percent: 5.2
              },
              visualizationData: data,
              recommendations: insights.map((ins: any) => ({
                title: ins.title,
                description: ins.detail,
                impact: ins.rupee_impact
              }))
            }} 
            business={{ name: 'Vyapari Store' }} 
            onExit={() => setShowPresentation(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EngineChart({ type, data }: { type: string, data: any[] }) {
  const commonAxisProps = {
    tick: { fill: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700 },
    axisLine: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 },
    tickLine: { stroke: 'rgba(255,255,255,0.1)' }
  };

  const chartId = type || 'default';

  if (type === 'pricing' || type === 'pricing_engine') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="5 5" horizontal={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" {...commonAxisProps} />
          <YAxis dataKey="affectedItemName" type="category" {...commonAxisProps} width={120} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '1.5rem' }}
            itemStyle={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="impactEstimate.value" fill="#6366f1" radius={[0, 8, 8, 0]} name="Recovery_Potential" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'rfm') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#64748b'][index % 5]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'finance' || type === 'cashflow' || type === 'gst') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem' }}
          />
          <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorNet)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'forecast') {
    const periods = data[0]?.periods || [];
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={periods}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip 
             contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem' }}
          />
          <Line type="monotone" dataKey="predictedDemand" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} name="Projected_Revenue" />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
       <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-700 mb-6">
          <Activity size={32} />
       </div>
       <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Visualizing_Engine_Telemetry</h4>
       <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest italic">Scanning 365 days of {type} cycles...</p>
    </div>
  );
}

function EngineDataTable({ type, data }: { type: string, data: any[] }) {
  if (!data || data.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-700">
       <Database size={40} className="mb-4 opacity-20" />
       <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Null_Telemetry_Data</span>
    </div>
  );

  const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'color' && typeof data[0][k] !== 'object');

  return (
    <div className="overflow-hidden rounded-3xl border border-white/5 shadow-2xl flex-1 flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {headers.map(h => (
                <th key={h} className="p-6 text-indigo-400/60 uppercase font-black tracking-[0.2em]">{h.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-indigo-500/5 transition-colors group">
                {headers.map(h => (
                  <td key={h} className="p-6 font-bold text-slate-400 group-hover:text-white transition-colors">
                    {typeof row[h] === 'number' && (h.includes('price') || h.includes('impact')) ? `₹${row[h].toLocaleString()}` : row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EngineSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 animate-pulse space-y-10">
      <div className="flex gap-6 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-white/5" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-white/5 rounded-full w-1/3" />
          <div className="h-2 bg-white/5 rounded-full w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-6 mb-10">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="h-[350px] bg-white/5 rounded-[2.5rem]" />
    </div>
  );
}

function EngineEmptyState({ title, icon, current, required, message }: { title: string, icon: any, current: number, required: number, message: string }) {
  const progress = Math.min(100, (current / required) * 100);
  return (
    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-20 text-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)]" />
      
      <div className="relative z-10">
         <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-dashed border-white/20 flex items-center justify-center mx-auto mb-10 text-slate-700 shadow-2xl">
           <ShieldAlert size={48} />
         </div>
         
         <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">{title}_Node_Locked</h3>
         <p className="text-slate-500 text-sm font-bold max-w-sm mx-auto mb-12 uppercase tracking-widest leading-relaxed">"{message}"</p>
         
         <div className="max-w-md mx-auto p-10 bg-black/40 rounded-[2.5rem] border border-white/5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-slate-500">
              <span>Telemetry_Readiness</span>
              <span className="text-indigo-400">{current} / {required} Nodes</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]" 
              />
            </div>
         </div>
         
         <button className="mt-12 px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white shadow-2xl hover:bg-indigo-400 hover:text-white transition-all flex items-center gap-3 mx-auto">
           <ExternalLink size={16} /> Expand Telemetry Buffer
         </button>
      </div>
    </div>
  );
}
