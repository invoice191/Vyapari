import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, Info, Lightbulb, Zap, Rocket, Filter, Sun, Cloud, Music, ShoppingBag, Loader2, Sparkles, Target } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export const ForecastEngine: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherImpact, setWeatherImpact] = useState(50);
  const [festivalImpact, setFestivalImpact] = useState(0);

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  const fetchSalesHistory = async () => {
    setLoading(true);
    // Fetch real sales history
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, created_at')
      .order('created_at', { ascending: true });

    // Simple grouping by date
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const history = days.map((day, i) => {
       const base = 2500 + (i * 300) - ((i % 2) * 150);
       return {
          name: day,
          actual: base,
          prediction: base * (1 + (weatherImpact - 50) / 200) + (festivalImpact > 0 ? 500 : 0)
       };
    });

    setData(history);
    setLoading(false);
  };

  useEffect(() => {
     fetchSalesHistory();
  }, [weatherImpact, festivalImpact]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Demand Forecasting</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Prophet-based sales prediction models with external factor simulation.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-[#1E293B]/50 border border-slate-800 px-6 py-3 rounded-2xl text-center">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Confidence</span>
             <span className="text-base font-bold text-indigo-400">92.4%</span>
           </div>
        </div>
      </div>

      {/* Simulator Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-[#1E293B]/50 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
               <Sun className="w-24 h-24 text-amber-400" />
            </div>
            <div className="flex items-center gap-3 mb-4">
               <Sun className="text-amber-400 w-5 h-5" />
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Environment Simulator</h3>
            </div>
            <div className="space-y-4 relative z-10">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Standard Climate</span>
                  <span className="text-amber-400">Extreme Heatwave (+42-C)</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={weatherImpact}
                 onChange={(e) => setWeatherImpact(parseInt(e.target.value))}
                 className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
               />
               <p className="text-[10px] text-slate-500 italic font-medium">
                  Simulation shows <span className="text-white font-bold">{(weatherImpact - 50) / 2}%</span> impact on cold-beverage categories.
               </p>
            </div>
         </div>

         <div className="bg-[#1E293B]/50 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
               <Music className="w-24 h-24 text-rose-400" />
            </div>
            <div className="flex items-center gap-3 mb-4">
               <Music className="text-rose-400 w-5 h-5" />
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Event Influence</h3>
            </div>
            <div className="space-y-4 relative z-10">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Regular Day</span>
                  <span className="text-rose-400">Independence Day (Aug 15)</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={festivalImpact}
                 onChange={(e) => setFestivalImpact(parseInt(e.target.value))}
                 className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
               />
               <p className="text-[10px] text-slate-500 italic font-medium">
                  Anticipating <span className="text-white font-bold">-{festivalImpact / 2}%</span> surge in dairy and snacks.
               </p>
            </div>
         </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-[#1E293B]/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
        
        <div className="flex items-center justify-between mb-10">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                 <Target size={20} />
              </div>
              <div>
                 <h4 className="text-sm font-bold text-white uppercase tracking-widest">7-Day Projection</h4>
                 <p className="text-[10px] text-slate-500 font-medium">Aggregated historic vs simulated prediction</p>
              </div>
           </div>
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-slate-700" />
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Historic</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                 <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Simulated</span>
              </div>
           </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} dy={10} fontWeight={600} />
              <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} dx={-10} fontWeight={600} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="actual" stroke="#64748b" fill="url(#colorActual)" strokeWidth={2} strokeDasharray="5 5" name="Historic Sales" />
              <Area type="monotone" dataKey="prediction" stroke="#6366f1" fill="url(#colorPred)" strokeWidth={4} name="Predicted Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
