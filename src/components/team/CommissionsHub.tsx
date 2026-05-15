import React from 'react';
import { DollarSign, TrendingUp, PieChart, Wallet, ArrowUpRight } from 'lucide-react';

const CommissionsHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <TrendingUp size={240} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <DollarSign size={20} className="text-amber-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Commissions Pool</span>
          </div>
          <h2 className="text-5xl font-black tracking-tight mb-2">₹1,42,500</h2>
          <p className="text-emerald-400 text-sm font-bold flex items-center gap-2">
            <ArrowUpRight size={16} /> +24% from last month
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { label: 'Pending Payout', value: '₹45,200', icon: Wallet, color: 'text-amber-400' },
              { label: 'Approved Today', value: '₹12,800', icon: DollarSign, color: 'text-emerald-400' },
              { label: 'Avg per Agent', value: '₹18,500', icon: PieChart, color: 'text-blue-400' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                <div className={`p-2 w-fit rounded-lg bg-white/10 ${stat.color} mb-4`}>
                  <stat.icon size={20} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{stat.label}</div>
                <div className="text-2xl font-black">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Commission Breakdown</h3>
          <div className="space-y-6">
            {[
              { role: 'Senior Sales', rate: '5%', total: '₹85,000' },
              { role: 'Junior Associate', rate: '2.5%', total: '₹32,500' },
              { role: 'Referral Bonus', rate: '1.0%', total: '₹25,000' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.role}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rate: {item.rate}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-900">{item.total}</div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Verifed</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Recent Payouts</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                  {['S', 'A', 'R', 'P'][i-1]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm">Payout #{1024 + i}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">May {10 + i}, 2024</div>
                </div>
                <div className="font-black text-slate-900">₹{4500 + (i * 1200)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionsHub;
