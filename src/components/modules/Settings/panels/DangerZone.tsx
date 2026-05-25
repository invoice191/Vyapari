import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, ShieldAlert, ZapOff, Users } from 'lucide-react';

export const DangerZone = () => {
  const actions = [
    {
      title: "DSS Neural Reset",
      desc: "Clear all strategic simulations, historical recommendations, and simulation history. This action is irreversible.",
      btn: "Wipe Strategy Engine",
      icon: <RotateCcw size={18} />
    },
    {
      title: "Purge Audit Matrix",
      desc: "Permanently delete all historical audit logs, system events, and dunning logs before current cycle.",
      btn: "Clear Audit Logs",
      icon: <ShieldAlert size={18} />
    },
    {
      title: "Revoke Master API Keys",
      desc: "Instantly invalidate all active API keys and neural bridges. This will break all active integrations.",
      btn: "Revoke All Access",
      icon: <ZapOff size={18} />
    },
    {
      title: "Enterprise Deletion",
      desc: "Permanently delete your business profile, all ledger data, invoices, and cloud backups. ALL DATA WILL BE LOST.",
      btn: "Delete Account",
      icon: <Trash2 size={18} />,
      critical: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Danger Zone</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">High-risk destructive operations and system termination</p>
        </div>
      </div>

      <div className="space-y-6">
        {actions.map(action => (
          <div key={action.title} className={`glass-card !bg-red-500/[0.02] !border-red-500/20 !p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:!border-red-500 transition-all`}>
            <div className="flex gap-6">
              <div className="text-red-500 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div className="max-w-md">
                <div className="text-sm font-bold text-white uppercase tracking-tight font-display">{action.title}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">
                  {action.desc}
                </div>
              </div>
            </div>
            <button className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              action.critical 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-900/20' 
                : 'bg-transparent hover:bg-red-600/10 border border-red-500/30 text-red-500'
            }`}>
              {action.btn}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 p-10 bg-slate-900 rounded-[2.5rem] border border-white/5 text-center">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Security Verification Required</div>
        <p className="text-[11px] text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase">
          Destructive operations require multi-step confirmation and Owner PIN authorization.
        </p>
      </div>
    </div>
  );
};
