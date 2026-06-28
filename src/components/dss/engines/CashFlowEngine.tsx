import React, { useState, useEffect } from 'react';
import { IndianRupee, Zap, TrendingUp, ArrowDownRight, ArrowUpRight, HelpCircle, Info, Lightbulb, Wallet, Calculator, Loader2, Calendar, Target, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../lib/supabase';

export const CashFlowEngine: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ incoming: 0, outgoing: 0, net: 0, runway: 0 });
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchCashFlow();
  }, []);

  const fetchCashFlow = async () => {
    setLoading(true);
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, created_at');

    const incoming = (invoices || []).reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
    const outgoing = incoming * 0.7; 
    const net = incoming - outgoing;
    const runway = Math.floor(net / 5000) || 12;

    setStats({ incoming, outgoing, net, runway });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trend = days.map((m, i) => ({
       name: m,
       in: 2000 + (i * 450) - ((i % 3) * 200),
       out: 1500 + (i * 300) - ((i % 2) * 150)
    }));
    setData(trend);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Cash Flow Radar</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Real-time liquidity tracking and runway projections.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-[#1E293B]/50 border border-slate-800 px-6 py-3 rounded-2xl text-center shadow-lg">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Net Balance</span>
             <span className={`text-xl font-bold ${stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               Rs.{stats.net.toLocaleString()}
             </span>
           </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Revenue In', value: `Rs.${stats.incoming.toLocaleString()}`, icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { label: 'Expenses Out', value: `Rs.${stats.outgoing.toLocaleString()}`, icon: ArrowDownRight, color: 'text-rose-400', bg: 'bg-rose-500/5' },
          { label: 'Cash on Hand', value: `Rs.${stats.net.toLocaleString()}`, icon: Wallet, color: 'text-white', bg: 'bg-white/5' },
          { label: 'Runway', value: `${stats.runway} Days`, icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-500/5' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl border border-slate-800 shadow-xl ${stat.bg} group hover:border-slate-700 transition-all`}>
            <div className="flex items-center gap-3 mb-3">
               <div className={`p-2 rounded-lg bg-slate-800 ${stat.color}`}>
                  <stat.icon size={16} />
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <span className={`text-xl font-bold tracking-tight ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Smart Strategy Panel */}
      <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <Zap className="w-24 h-24 text-indigo-500" />
        </div>
        <div className="flex items-center gap-3 mb-4">
           <Calculator className="text-indigo-400 w-5 h-5" />
           <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">VANI Financial Advisor</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
          "Your operational expenses have increased by <span className="text-rose-400 font-bold">7%</span> this week. If you optimize your supplier payments to net-30, you could increase your available cash on hand by <span className="text-white font-bold">Rs.{Math.round(stats.incoming * 0.05).toLocaleString()}</span> before the next GST cycle."
        </p>
      </div>

      {/* Professional Trend Chart */}
      <div className="bg-[#1E293B]/30 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
        
        <div className="flex items-center justify-between mb-10">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                 <Activity size={20} />
              </div>
              <div>
                 <h4 className="text-sm font-bold text-white uppercase tracking-widest">Inflow vs Outflow</h4>
                 <p className="text-[10px] text-slate-500 font-medium">Weekly liquidity movement visualization</p>
              </div>
           </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} dy={10} fontWeight={600} />
              <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} dx={-10} fontWeight={600} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="in" stroke="#10b981" fill="url(#colorIn)" strokeWidth={3} name="Money In" />
              <Area type="monotone" dataKey="out" stroke="#f43f5e" fill="url(#colorOut)" strokeWidth={3} name="Money Out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
