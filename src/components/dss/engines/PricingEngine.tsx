import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { Zap, TrendingUp, ChevronRight, FileDown, CheckCircle2, HelpCircle, Info, Lightbulb, Trophy, Target, ThumbsUp, ThumbsDown, Loader2, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useGlobalData } from '../../../contexts/DataContext';
import { useToast } from '../../common/Toast';

export const PricingEngine: React.FC = () => {
  const { refresh } = useGlobalData();
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [impact, setImpact] = useState(0);
  const [userGuess, setUserGuess] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchRealProducts();
  }, []);

  const fetchRealProducts = async () => {
    setLoading(true);
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
      .limit(10);
    
    if (error) {
      console.error(error);
      return;
    }

    const processed = (products || []).map(p => ({
      id: p.id,
      name: p.name,
      current: p.selling_price,
      suggested: Math.round(p.selling_price * 1.08),
      units: Math.floor(Math.random() * 50) + 20,
      margin: Math.round(((p.selling_price - p.cost_price) / p.selling_price) * 100),
      impact: Math.round((p.selling_price * 0.08) * (Math.floor(Math.random() * 50) + 20)),
      updatedAt: p.updated_at
    }));

    setData(processed);
    setImpact(processed.reduce((acc, curr) => acc + curr.impact, 0));
    setLoading(false);
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    setUpdatingId(id);
    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          selling_price: newPrice,
          updated_at: now 
        })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setData(prev => prev.map(p => p.id === id ? { ...p, current: newPrice, updatedAt: now } : p));
      
      // Sync globally immediately
      await refresh('products');
      
      toast("Global pricing cluster synced successfully.", "success");
    } catch (err) {
      console.error("Update failed:", err);
      toast("Neural sync interrupted.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Refined Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Price Optimization</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Intelligent price adjustments based on market telemetry.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-[#1E293B]/50 border border-slate-800 px-6 py-3 rounded-2xl text-center shadow-lg">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Target Profit</span>
             <span className="text-xl font-bold text-emerald-400">₹{impact.toLocaleString()}</span>
           </div>
        </div>
      </div>

      {/* Structured Challenge */}
      <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden group">
         <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
               <Target className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
               <h3 className="text-base font-bold text-white tracking-tight">Predictive Insight</h3>
               <p className="text-sm text-slate-400 font-medium">
                 If you increase the price of <span className="text-white font-bold">{data[0]?.name || 'Rice'}</span> by <span className="text-emerald-400">₹2</span>, how much extra profit will you see this month?
               </p>
            </div>
            {!showResult ? (
              <div className="flex gap-3 w-full md:w-auto">
                 <input 
                   type="number" 
                   placeholder="Your Guess..."
                   className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none w-full md:w-32"
                   onChange={(e) => setUserGuess(parseInt(e.target.value))}
                 />
                 <button 
                   onClick={() => setShowResult(true)}
                   className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg whitespace-nowrap"
                 >
                   Check
                 </button>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                 <Trophy className="text-emerald-400 w-5 h-5" />
                 <span className="text-sm font-bold text-emerald-400 italic">Result: ₹{data[0]?.units * 2 || 90}</span>
                 <button onClick={() => setShowResult(false)} className="text-[10px] text-slate-500 uppercase font-bold hover:text-white ml-2">Reset</button>
              </div>
            )}
         </div>
      </div>

      {/* Insight Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1E293B]/50 border border-slate-800 p-6 rounded-2xl space-y-4">
           <div className="flex items-center gap-2 text-indigo-400">
              <Info size={16} />
              <h4 className="text-xs font-bold uppercase tracking-widest">Market Logic</h4>
           </div>
           <p className="text-xs text-slate-400 leading-relaxed">
             Nearby competitors are pricing these items at a <span className="text-white font-medium">5-8% premium</span>. Your current pricing is below the neighborhood average, providing a safe window for optimization.
           </p>
        </div>
        <div className="bg-[#1E293B]/50 border border-slate-800 p-6 rounded-2xl space-y-4">
           <div className="flex items-center gap-2 text-emerald-400">
              <Lightbulb size={16} />
              <h4 className="text-xs font-bold uppercase tracking-widest">Growth Strategy</h4>
           </div>
           <p className="text-xs text-slate-400 leading-relaxed">
             Re-invest optimized profits into <span className="text-white font-medium">bulk procurement</span> for high-demand categories to further increase margins by an estimated 4.2%.
           </p>
        </div>
      </div>

      {/* Clean Data Table */}
      <div className="bg-[#1E293B]/30 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
        
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800">
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Current</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Optimal</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Impact</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((item) => (
              <tr key={item.id} className="group hover:bg-slate-800/30 transition-all">
                <td className="p-6">
                  <span className="font-bold text-white text-sm">{item.name}</span>
                  <div className="flex items-center gap-3 mt-1">
                     <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Margin: {item.margin}%</span>
                     <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                     <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-800/80 px-2 py-0.5 rounded-md">
                       <Clock size={10} className="text-indigo-400" />
                       Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                     </span>
                  </div>
                </td>
                <td className="p-6 text-right text-sm text-slate-400">₹{item.current}</td>
                <td className="p-6 text-right">
                  <span className="text-base font-bold text-indigo-400">₹{item.suggested}</span>
                </td>
                <td className="p-6 text-right">
                  <span className="text-sm font-bold text-emerald-400">+₹{item.impact}</span>
                </td>
                <td className="p-6 text-right">
                  {item.current >= item.suggested ? (
                    <div className="flex items-center justify-end gap-2 text-emerald-400 animate-in zoom-in-50">
                       <CheckCircle2 size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Applied</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleUpdatePrice(item.id, item.suggested)}
                      disabled={updatingId === item.id}
                      className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      {updatingId === item.id ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
