import React, { useState, useEffect } from 'react';
import { Globe, MapPin, TrendingUp, ArrowRight, Zap, Info, Lightbulb, Users, Target, Search, BarChart2, Loader2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../../../lib/supabase';

export const MarketEngine: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<any[]>([]);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setLoading(true);
    // Calculate local competitive analysis dynamically
    const { data: products } = await supabase.from('products').select('*');
    const { data: invoices } = await supabase.from('invoices').select('*, contacts(id)');
    
    // Dynamic Calculations
    const varietyScore = Math.min(150, (products?.length || 0) * 5 + 50);
    
    let loyaltyScore = 85;
    if (invoices && invoices.length > 0) {
       const customerCounts: Record<string, number> = {};
       invoices.forEach(inv => {
          if(inv.contacts?.id) customerCounts[inv.contacts.id] = (customerCounts[inv.contacts.id] || 0) + 1;
       });
       const repeatCustomers = Object.values(customerCounts).filter(c => c > 1).length;
       const totalCustomers = Object.keys(customerCounts).length;
       if (totalCustomers > 0) {
          loyaltyScore = Math.round(50 + (repeatCustomers / totalCustomers) * 100);
       }
    }

    let pricingScore = 120;
    let avgMargin = 0.2;
    if (products && products.length > 0) {
       avgMargin = products.reduce((acc, p) => {
         const cp = Number(p.cost_price) || Number(p.selling_price) * 0.7;
         const sp = Number(p.selling_price) || 1;
         return acc + ((sp - cp) / sp);
       }, 0) / products.length;
       pricingScore = Math.round(80 + avgMargin * 100);
    }

    const data = [
      { subject: 'Pricing', A: pricingScore, B: 110, fullMark: 150 },
      { subject: 'Variety', A: varietyScore, B: 130, fullMark: 150 },
      { subject: 'Delivery', A: 96, B: 130, fullMark: 150 }, // Hardcoded competitor benchmark
      { subject: 'Quality', A: 99, B: 100, fullMark: 150 },
      { subject: 'Loyalty', A: Math.min(150, loyaltyScore), B: 90, fullMark: 150 },
      { subject: 'Brand', A: 85, B: 85, fullMark: 150 },
    ];
    setMarketData(data);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Market Positioning</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Benchmarking your business against local competition and industry standards.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-[#1E293B]/50 border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Index: 78.4</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar Analysis Chart */}
        <div className="lg:col-span-6 bg-[#1E293B]/50 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col items-center">
           <div className="w-full flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                    <BarChart2 size={16} />
                 </div>
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Competitive Gap Analysis</h4>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">You</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Avg</span>
                 </div>
              </div>
           </div>
           
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={marketData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar
                    name="You"
                    dataKey="A"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Competitor"
                    dataKey="B"
                    stroke="#475569"
                    fill="#475569"
                    fillOpacity={0.1}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Market Insights */}
        <div className="lg:col-span-6 space-y-6">
           <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-3xl space-y-6 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                 <Globe size={120} className="text-indigo-400" />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <Zap className="text-indigo-400 w-5 h-5" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Positioning Insight</h3>
                 </div>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                   "You are <span className="text-indigo-400 font-bold">12% more expensive</span> than local peers in the 'Stationery' category. However, your delivery speed is <span className="text-emerald-400 font-bold">35% faster</span>. Leverage 'Instant Delivery' in your marketing to justify the premium."
                 </p>
                 <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Local Dominance</span>
                       <span className="text-lg font-bold text-white">Top 5%</span>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Market Reach</span>
                       <span className="text-lg font-bold text-white">4.2km</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-800/20 border border-slate-800 p-8 rounded-3xl">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Recommended Actions</h4>
              <div className="space-y-3">
                 {[
                   'Enable "Price Match" for Electronics',
                   'Expand Grocery range to match BigBasket prices',
                   'Introduce "Priority" delivery for members'
                 ].map((action, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-[#1E293B]/40 border border-slate-800/50 rounded-2xl group hover:border-indigo-500/30 transition-all cursor-pointer">
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{action}</span>
                      <ArrowRight size={14} className="text-slate-500 group-hover:text-indigo-400 transition-all group-hover:translate-x-1" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
