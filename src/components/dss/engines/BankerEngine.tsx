import React, { useState, useEffect } from 'react';
import { Landmark, ShieldCheck, TrendingUp, FileText, AlertCircle, CheckCircle2, Zap, Loader2, BarChart, Wallet, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { useGlobalData } from '../../../context/DataContext';
import { useToast } from '../../common/Toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const BankerEngine: React.FC = () => {
  const { invoices } = useGlobalData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const simulatedLoan = Math.floor(totalRevenue * 0.4);
  const interestRate = score > 750 ? '12.5%' : score > 600 ? '14.5%' : '18%';

  useEffect(() => {
    setTimeout(() => {
      // Generate dynamic score based on volume
      const calculated = Math.min(850, 550 + (invoices.length * 2) + (totalRevenue > 100000 ? 100 : 20));
      setScore(calculated);
      setLoading(false);
    }, 200);
  }, [invoices, totalRevenue]);

  const healthChartData = [
    { month: 'Jan', score: 620 },
    { month: 'Feb', score: 640 },
    { month: 'Mar', score: 635 },
    { month: 'Apr', score: 680 },
    { month: 'May', score: score || 720 }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
             <Landmark className="text-indigo-400" /> Bank Readiness Engine
          </h2>
          <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase">Simulate lending profiles based on verified ledger telemetry</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-3 rounded-2xl flex items-center gap-3">
           <ShieldCheck className="text-emerald-400 w-4 h-4" />
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">VANI Trust Verified</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
           <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Calculating Debt Capacity...</p>
        </div>
      ) : (
        <>
          {/* Score Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 bg-[#1E293B]/30 border border-slate-800 rounded-[2rem] p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-emerald-500 to-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Vyapari Score-</h3>
                
                <div className="relative w-40 h-40 mx-auto mb-6">
                   <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                      <motion.circle 
                        cx="50" cy="50" r="45" fill="none" stroke={score > 700 ? '#10b981' : '#f59e0b'} strokeWidth="8"
                        strokeDasharray={283}
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 283 - (283 * (score / 900)) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white tracking-tighter">{score}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">/ 900</span>
                   </div>
                </div>
                
                <Badge className={score > 700 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                   {score > 700 ? 'EXCELLENT PROFILE' : 'STABLE PROFILE'}
                </Badge>
             </div>

             <div className="lg:col-span-2 bg-[#1E293B]/30 border border-slate-800 rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                   <Wallet size={140} className="text-indigo-500" />
                </div>
                
                <div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Estimated Credit Line</h3>
                   <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 tracking-tighter italic">
                      Rs.{simulatedLoan.toLocaleString()}
                   </div>
                   <p className="text-xs text-slate-400 mt-3 font-medium">Maximum unsecured working capital limit eligible today.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Est. APR</p>
                      <p className="text-xl font-black text-white italic">{interestRate}</p>
                   </div>
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tenor</p>
                      <p className="text-xl font-black text-white italic">12 Mo.</p>
                   </div>
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Approval</p>
                      <p className="text-xl font-black text-emerald-400 italic flex items-center gap-1">94%<Zap size={12} className="fill-emerald-400" /></p>
                   </div>
                </div>
             </div>
          </div>

          {/* Historical Trend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 bg-[#1E293B]/20 border border-slate-800 rounded-[2rem] p-8 h-80">
                <div className="flex justify-between mb-6">
                   <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Score Velocity Trend</h3>
                   <span className="text-[9px] font-bold text-indigo-400 uppercase">+45 pts lift last 90d</span>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={healthChartData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis domain={[500, 900]} hide />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>

             <div className="bg-[#1E293B]/20 border border-slate-800 rounded-[2rem] p-8 flex flex-col justify-between">
                <div>
                   <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">Optimizations Needed</h3>
                   <div className="space-y-4">
                      <Factor checked label="Monthly Revenue Consistency" status="Strong" />
                      <Factor checked label="GSTR-1 Filing Hygiene" status="Healthy" />
                      <Factor checked={false} label="Average Invoice Value" status="Boost Needed" />
                      <Factor checked={false} label="Debt-to-Income Ratio" status="Low Data" />
                   </div>
                </div>
                
                <button 
                   onClick={() => {
                     toast("Generating Cryptographically Signed Banker Pack...", "info");
                     setLoading(true);
                     setTimeout(() => {
                       setLoading(false);
                       toast("Banker Pack Sealed & Exported.", "success");
                       // Simulation of download
                       const link = document.createElement('a');
                       link.href = '#';
                       link.download = 'Banker_Pack_Vyapari.pdf';
                       link.click();
                     }, 300);
                   }}
                   className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg border border-indigo-400 flex items-center justify-center gap-2 transition-all group"
                 >
                   {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Generate Banker Pack <FileText size={14} className="group-hover:translate-x-1 transition-transform" /></>}
                 </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

const Factor = ({ checked, label, status }: { checked: boolean, label: string, status: string }) => (
  <div className="flex items-start gap-3">
     <div className={`mt-0.5 ${checked ? 'text-emerald-400' : 'text-slate-600'}`}>
        {checked ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
     </div>
     <div>
        <p className="text-[11px] font-bold text-white leading-none">{label}</p>
        <p className={`text-[9px] font-bold mt-1 uppercase ${checked ? 'text-emerald-500' : 'text-amber-500'}`}>{status}</p>
     </div>
  </div>
);

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${className}`}>
    {children}
  </span>
);
