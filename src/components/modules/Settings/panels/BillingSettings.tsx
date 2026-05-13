import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Zap, FileText, Cpu, PieChart, CheckCircle2 } from 'lucide-react';
import { BadgeRow } from '../SettingRows';

export const BillingSettings = ({ plan }: { plan: any }) => {
  const meters = [
    { label: 'Invoices Generated', current: 145, max: 500, icon: <FileText size={16} /> },
    { label: 'VANI Neural Queries', current: 890, max: 2000, icon: <Zap size={16} /> },
    { label: 'OCR Document Scans', current: 42, max: 100, icon: <Cpu size={16} /> },
    { label: 'DSS Strategic Reports', current: 12, max: 25, icon: <PieChart size={16} /> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <CreditCard size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Billing & Plan</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage your enterprise license and usage quotas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card !bg-brand/5 !border-brand/20 !p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard size={120} />
          </div>
          <div className="flex justify-between items-start mb-10">
            <div className="px-4 py-1 bg-brand text-white font-black text-[8px] uppercase tracking-[0.3em] rounded-full">Active Plan</div>
            <span className="font-mono text-[10px] text-brand uppercase font-bold">Expires: Dec 2026</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-display">VYAPARI_PRO</h2>
          <div className="mt-4 flex items-center gap-2 text-neon">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Neural Node</span>
          </div>
          <button className="mt-10 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all">
            Upgrade License Tier
          </button>
        </div>

        <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Next Settlement</h4>
          <div className="text-5xl font-black text-white tracking-tighter font-display">Rs.14,999</div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Scheduled for Jan 15, 2026</p>
          <div className="mt-10 pt-6 border-t border-white/5">
            <button className="text-[10px] font-black text-brand uppercase tracking-widest hover:text-neon transition-colors">
              Download Latest Ledger -
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Resource Telemetry (Current Cycle)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          {meters.map(m => (
            <div key={m.label} className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{m.icon}</span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{m.label}</span>
                </div>
                <span className="font-mono text-[10px] font-black text-neon">{m.current}/{m.max}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.current / m.max) * 100}%` }}
                  className="h-full bg-brand shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
