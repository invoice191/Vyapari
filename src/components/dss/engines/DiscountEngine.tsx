import React, { useState, useEffect } from 'react';
import { Tag, Percent, ArrowRight, Zap, Info, Lightbulb, Ticket, Users, TrendingUp, Target, Loader2, Sparkles, ShoppingBag } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export const DiscountEngine: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    // Mock discount recommendations
    const mock = [
      { id: 1, type: 'BOGO', product: 'Soft Drink (Can)', details: 'Buy 2 Get 1 Free', impact: '+35% Volume', target: 'Impulse Buyers' },
      { id: 2, type: 'Flash', product: 'Dairy Milk', details: 'Flat 10% Off (7PM-9PM)', impact: '+12% Traffic', target: 'Late Night Shoppers' },
      { id: 3, type: 'Loyalty', product: 'Aashirvaad Atta', details: '₹50 Cashback for Members', impact: '+18% Retention', target: 'Household Heads' }
    ];
    setOffers(mock);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Discount Lab</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">AI-calculated promotion triggers to maximize volume without eroding margin.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-[#1E293B]/50 border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3">
              <Sparkles className="text-amber-400 w-4 h-4" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimal Discount Index: 12%</span>
           </div>
        </div>
      </div>

      {/* Logic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-3xl space-y-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Target size={120} className="text-indigo-400" />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <Zap className="text-indigo-400 w-5 h-5" />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">VANI Discount Engine</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                "Your current discount burn rate is <span className="text-rose-400 font-bold">14.2%</span>. We recommend shifting from 'Flat Percentages' to 'Quantity-Based' triggers to preserve at least <span className="text-emerald-400 font-bold">4.5% extra margin</span> on core staples."
              </p>
           </div>
        </div>

        <div className="bg-slate-800/20 border border-slate-800 p-8 rounded-3xl flex flex-col justify-center">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Promotion ROI</span>
              <span className="text-xl font-bold text-white tracking-tight">4.2x</span>
           </div>
           <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: '72%' }} />
           </div>
           <p className="text-[10px] text-slate-500 font-medium mt-4">Average revenue lift vs cost of discounts this quarter.</p>
        </div>
      </div>

      {/* Active Recommendations Table */}
      <div className="bg-[#1E293B]/30 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
        
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800">
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offer Type</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Item</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mechanic</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Predicted Lift</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {offers.map((offer, i) => (
              <tr key={i} className="group hover:bg-slate-800/30 transition-all">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Ticket size={14} />
                     </div>
                     <span className="font-bold text-white text-sm">{offer.type}</span>
                  </div>
                </td>
                <td className="p-6">
                   <span className="text-sm font-bold text-slate-300">{offer.product}</span>
                   <div className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-wider">{offer.target}</div>
                </td>
                <td className="p-6 text-sm text-slate-400 font-medium">{offer.details}</td>
                <td className="p-6 text-right font-bold text-emerald-400">{offer.impact}</td>
                <td className="p-6 text-right">
                  <button className="bg-slate-800 text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md">
                     Activate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
