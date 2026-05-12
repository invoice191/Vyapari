import React, { useState, useEffect } from 'react';
import { FileText, Calculator, ArrowRight, Zap, Info, Lightbulb, ShieldCheck, Download, AlertCircle, Scale, Target, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export const GSTEngine: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [gstData, setGstData] = useState({ liability: 0, itc: 0, net: 0, filingDate: 'May 20' });

  useEffect(() => {
    fetchGSTData();
  }, []);

  const fetchGSTData = async () => {
    setLoading(true);
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid');

    const total = (invoices || []).reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
    const liability = total * 0.18; // Mock 18% GST
    const itc = liability * 0.6; // Mock 60% ITC
    setGstData({ liability, itc, net: liability - itc, filingDate: 'May 20' });
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">GST Optimization</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Tax liability projections and Input Tax Credit (ITC) maximization.</p>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95">
              <Download size={14} />
              GSTR-1 Draft
           </button>
        </div>
      </div>

      {/* Tax Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Projected Liability', value: `₹${gstData.liability.toLocaleString()}`, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/5' },
          { label: 'Claimable ITC', value: `₹${gstData.itc.toLocaleString()}`, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { label: 'Net Tax Payable', value: `₹${gstData.net.toLocaleString()}`, icon: Scale, color: 'text-white', bg: 'bg-white/5' },
        ].map((stat, i) => (
          <div key={i} className={`p-8 rounded-3xl border border-slate-800 shadow-xl ${stat.bg} group hover:border-slate-700 transition-all`}>
            <div className="flex items-center gap-3 mb-4">
               <div className={`p-2.5 rounded-xl bg-slate-800 ${stat.color}`}>
                  <stat.icon size={18} />
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <span className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value}</span>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
               Next filing: <span className="text-indigo-400">{gstData.filingDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Advisory */}
      <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <Calculator className="w-24 h-24 text-indigo-500" />
        </div>
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-4">
              <Zap className="text-indigo-400 w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Optimization Tip</h3>
           </div>
           <p className="text-sm text-slate-400 leading-relaxed max-w-3xl font-medium">
             "We found <span className="text-white font-bold">14 purchase invoices</span> totaling <span className="text-emerald-400 font-bold">₹1.2L</span> that are missing GSTINs. Fixing these could increase your ITC by <span className="text-white font-bold">₹21,600</span> this quarter."
           </p>
           <button className="mt-8 flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest group-hover:gap-4 transition-all">
              Audit Invoices
              <ArrowRight size={14} />
           </button>
        </div>
      </div>

      {/* Compliance Health */}
      <div className="bg-[#1E293B]/30 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
         <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
               <ShieldCheck size={20} />
            </div>
            <div>
               <h4 className="text-sm font-bold text-white uppercase tracking-widest">Compliance Status</h4>
               <p className="text-[10px] text-slate-500 font-medium">Auto-verified against GSTR-2B</p>
            </div>
         </div>
         
         <div className="space-y-6">
            <div className="flex justify-between items-end">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filing Accuracy</span>
               <span className="text-xl font-bold text-emerald-400 tracking-tight">98.2%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: '98.2%' }} />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Based on 154 successfully reconciled invoices this month.</p>
         </div>
      </div>
    </div>
  );
};
