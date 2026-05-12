import React, { useState, useEffect } from 'react';
import { Layers, Package, ArrowRight, Zap, Info, Lightbulb, ShoppingCart, Plus, TrendingUp, Target, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export const BundleEngine: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<any[]>([]);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    setLoading(true);
    // Mocking smart bundle recommendations based on affinity
    const mock = [
      { id: 1, title: 'Morning Essentials', items: ['Milk', 'Bread', 'Butter'], price: 185, oldPrice: 210, uplift: '+14% Sales', confidence: 0.92 },
      { id: 2, title: 'Office Starter', items: ['Pen (Pack 10)', 'Notebook', 'Files'], price: 450, oldPrice: 520, uplift: '+8% Sales', confidence: 0.85 },
      { id: 3, title: 'Snack Pack', items: ['Chips', 'Cold Drink', 'Biscuits'], price: 120, oldPrice: 150, uplift: '+22% Sales', confidence: 0.78 }
    ];
    setBundles(mock);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Smart Bundles</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Cross-selling opportunities generated via market basket analysis.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-[#1E293B]/50 border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Bundles Active</span>
              <span className="text-xl font-bold text-indigo-400">08</span>
           </div>
        </div>
      </div>

      {/* Hero Suggestion */}
      <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <Layers className="w-24 h-24 text-indigo-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                 <Zap className="text-indigo-400 w-5 h-5" />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">VANI Bundle Strategy</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl font-medium">
                "Based on the last 500 invoices, customers who buy <span className="text-white font-bold">Notebooks</span> have a <span className="text-indigo-400 font-bold">78% affinity</span> to buy <span className="text-white font-bold">Ball Pens</span>. Creating an 'Exam Pack' could increase your Stationery AOV by 15%."
              </p>
           </div>
           <button className="whitespace-nowrap px-10 py-4 bg-white text-slate-950 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-95">
              Generate All Bundles
           </button>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {bundles.map((bundle, i) => (
          <div key={i} className="bg-[#1E293B]/40 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl group hover:border-indigo-500/30 transition-all relative overflow-hidden flex flex-col h-full">
             <div className="flex justify-between items-start mb-6">
                <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-500/20">
                   {bundle.uplift}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                   {Math.round(bundle.confidence * 100)}% Match
                </div>
             </div>

             <h4 className="text-lg font-bold text-white mb-2">{bundle.title}</h4>
             <div className="flex flex-wrap gap-2 mb-8">
                {bundle.items.map((item: string, idx: number) => (
                   <span key={idx} className="bg-slate-800 text-slate-400 text-[10px] px-3 py-1 rounded-lg border border-slate-700/50">
                      {item}
                   </span>
                ))}
             </div>

             <div className="mt-auto space-y-6">
                <div className="flex items-baseline gap-3">
                   <span className="text-2xl font-bold text-white tracking-tight">₹{bundle.price}</span>
                   <span className="text-sm text-slate-500 line-through font-bold tracking-tight">₹{bundle.oldPrice}</span>
                </div>
                <button className="w-full py-4 border border-slate-700 rounded-2xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2">
                   <Plus size={14} />
                   Add to Catalog
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
