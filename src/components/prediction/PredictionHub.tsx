import { useState, useEffect } from "react";
import { analyticsService } from "../../services/analyticsService";
import { Card, SectionHeader, ActionBtn, KPICard, Badge } from "../common/UI";
import { useAuth } from "../../hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, ReferenceLine, Legend 
} from "recharts";
import { 
  Zap, TrendingUp, Target, ShieldAlert, Cpu, 
  BarChart3, BrainCircuit, Activity, RefreshCw,
  ArrowUpRight, Info, Sparkles
} from "lucide-react";
import { useToast } from "../common/Toast";

export default function PredictionHub() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const businessId = profile?.business_id || "";

  const [simulationParams, setSimulationParams] = useState({
    growthRate: 15,
    costReduction: 5,
    churnImprovement: 2
  });
  
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [projectedData, setProjectedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBundling, setIsBundling] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!businessId) return;
      try {
        const history = await analyticsService.getHistoricalRevenue(businessId);
        setHistoricalData(history);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    loadData();
  }, [businessId]);

  useEffect(() => {
    if (historicalData.length > 0) runSimulation();
  }, [simulationParams, historicalData]);

  const runSimulation = () => {
    const lastRev = historicalData[historicalData.length - 1]?.revenue || 500000;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = months.indexOf(historicalData[historicalData.length - 1]?.month || 'Jun');
    
    const newData = Array.from({ length: 6 }, (_, i) => {
      const month = months[(currentMonthIdx + 1 + i) % 12];
      const multiplier = 1 + (simulationParams.growthRate / 100) * (i + 1);
      return {
        month: month + ' (P)',
        revenue: Math.floor(lastRev * multiplier),
        optimized: Math.floor(lastRev * multiplier * (1 + simulationParams.costReduction / 100))
      };
    });
    setProjectedData([...historicalData.slice(-3), ...newData]);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{label}</p>
          <div className="space-y-2">
            {payload.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-tight">{p.name}</span>
                </div>
                <span className="text-xs font-black text-white">Rs.{(p.value / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32">
      <div className="bg-slate-900 text-white p-14 rounded-[3rem] mb-12 relative overflow-hidden shadow-2xl group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon/10 rounded-full blur-[120px] translate-x-1/2 translate-y-[-1/2] group-hover:bg-neon/20 transition-all duration-1000"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-neon">
                <BrainCircuit size={24} />
             </div>
             <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-black text-[9px] uppercase tracking-[0.4em]">
                Neural Projection Lab
             </div>
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">Strategic <br/>Prediction <span className="text-neon italic">Engine</span></h1>
          <p className="text-slate-400 mt-8 text-lg max-w-2xl font-bold leading-relaxed opacity-80">
            Simulate market variables and operational vectors to project future enterprise velocity and identify neural optimization paths.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-12">
          <div className="glass-card !p-10">
            <div className="flex items-center gap-3 mb-8">
              <Target className="text-neon" size={20} />
              <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">Simulation Vectors</h3>
            </div>
            
            <div className="space-y-10">
              {[
                { label: "Target Growth Rate", key: "growthRate", min: 0, max: 100, unit: "%", icon: <TrendingUp size={14}/> },
                { label: "Op-Ex Reduction", key: "costReduction", min: 0, max: 20, unit: "%", icon: <Activity size={14}/> },
                { label: "Retention Lift", key: "churnImprovement", min: 0, max: 10, unit: "%", icon: <ShieldAlert size={14}/> },
              ].map(v => (
                <div key={v.key} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {v.icon}
                      {v.label}
                    </div>
                    <span className="text-xs font-black text-neon bg-slate-900 px-3 py-1 rounded-lg">
                      {simulationParams[v.key as keyof typeof simulationParams]}{v.unit}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min={v.min} 
                    max={v.max} 
                    value={simulationParams[v.key as keyof typeof simulationParams]}
                    onChange={e => setSimulationParams(p => ({ ...p, [v.key]: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-neon"
                  />
                </div>
              ))}
            </div>

            <div className="mt-12">
               <ActionBtn className="w-full py-5 text-[10px] flex items-center justify-center gap-3">
                  <RefreshCw size={14} />
                  SYNCHRONIZE_PROJECTIONS
               </ActionBtn>
            </div>
          </div>

          <div className="glass-card !p-10 border-indigo-500/20 bg-indigo-50/30">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="text-indigo-600" size={20} />
              <h3 className="font-black text-sm uppercase tracking-tight text-indigo-900">Bundle Strategy</h3>
            </div>
            <p className="text-[10px] font-bold text-indigo-900/40 uppercase mb-6">Create a "Loss Leader" bundle to drive high-margin cross-sales.</p>
            
            <div className="space-y-4 mb-8">
              <button 
                onClick={() => setIsBundling(true)}
                className="w-full p-4 border-2 border-dashed border-indigo-200 rounded-2xl text-[10px] font-black uppercase text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 transition-all"
              >
                + ADD_PRODUCT_TO_BUNDLE
              </button>
            </div>

            <ActionBtn 
              onClick={() => toast("Analyzing bundle halo effect...", "success")}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            >
              SIMULATE_HALO_EFFECT
            </ActionBtn>
          </div>

          <div className="brutal-card !p-10 bg-slate-900 text-white">
             <div className="flex items-center gap-3 mb-8">
                <Cpu className="text-neon" size={20} />
                <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400">Neural Insights</h3>
             </div>
             <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-neon">
                      <ArrowUpRight size={16} />
                   </div>
                   <p className="text-xs font-bold leading-relaxed text-slate-300">
                     {simulationParams.growthRate > 25 ? 
                       "Aggressive trajectory identified. Recommend scaling infrastructure resources by 15% to maintain latency targets." : 
                       "Organic growth path detected. Optimal for margin preservation and long-term asset accumulation."}
                   </p>
                </div>
                <div className="pt-6 border-t border-white/5">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Prediction Confidence</span>
                      <span className="text-neon">94.2%</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "94.2%" }}
                        className="h-full bg-neon"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-12">
          <div className="glass-card !p-10">
            <div className="flex justify-between items-center mb-12">
               <div className="flex items-center gap-3">
                  <BarChart3 className="text-neon" size={20} />
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">Revenue Velocity Forecast</h3>
               </div>
               <div className="flex gap-3">
                  <Badge status="Live Simulation" />
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors">
                     <Info size={16} />
                  </div>
               </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CBD5E1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#CBD5E1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9FEF00" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#9FEF00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                    tickLine={{ stroke: '#E2E8F0' }}
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#1E293B' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                    tickLine={{ stroke: '#E2E8F0' }}
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#1E293B' }} 
                    tickFormatter={v => `Rs.${v/1000}K`} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(159, 239, 0, 0.2)', strokeWidth: 2 }} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#1E293B', marginBottom: '20px' }} 
                  />
                  <ReferenceLine x={projectedData[2]?.month} stroke="#64748B" strokeDasharray="3 3" label={{ position: 'top', value: 'CURRENT', fill: '#64748B', fontSize: 10, fontWeight: 900 }} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Baseline Projection" 
                    stroke="#CBD5E1" 
                    fill="url(#colorBaseline)" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="optimized" 
                    name="Neural Optimized Path" 
                    stroke="#9FEF00" 
                    fill="url(#colorOptimized)" 
                    strokeWidth={4} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-12 border-t border-slate-100">
              <div className="p-8 rounded-[2rem] bg-neon/10 border border-neon/20 group hover:bg-neon/15 transition-all duration-500">
                <div className="flex justify-between items-center mb-4">
                   <div className="text-[10px] font-black uppercase text-neon tracking-widest">Optimized Delta</div>
                   <Zap className="text-neon" size={16} />
                </div>
                <div className="text-4xl font-black tracking-tighter text-slate-900 group-hover:scale-105 transition-transform duration-500 origin-left">
                  +Rs.{((projectedData[projectedData.length-1]?.optimized - projectedData[projectedData.length-1]?.revenue) || 0).toLocaleString()}
                </div>
                <div className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">UNREALIZED_OPPORTUNITY</div>
              </div>

              <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 group hover:border-neon/30 transition-all duration-500">
                <div className="flex justify-between items-center mb-4">
                   <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Efficiency Lift</div>
                   <TrendingUp className="text-slate-400 group-hover:text-neon transition-colors" size={16} />
                </div>
                <div className="text-4xl font-black tracking-tighter text-slate-900">
                  {((simulationParams.costReduction + simulationParams.churnImprovement) * 1.4).toFixed(1)}%
                </div>
                <div className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">MARGIN_EXPANSION_VECTOR</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <KPICard title="Revenue Velocity" value="Rs.1.2M" trend="+14.2%" icon={<Activity size={18}/>} />
             <KPICard title="Projected LTV" value="Rs.42K" trend="+8.5%" icon={<Target size={18}/>} />
             <KPICard title="Risk Factor" value="Low" trend="Stable" icon={<ShieldAlert size={18}/>} />
          </div>
        </div>
      </div>
    </div>
  );
}
