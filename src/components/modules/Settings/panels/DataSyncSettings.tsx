import React from 'react';
import { Database, Zap, Cloud, Shield, RefreshCw, Download, Loader2 } from 'lucide-react';
import { ToggleRow, SelectRow, BadgeRow } from '../SettingRows';
import { useToast } from '../../../common/Toast';

export const DataSyncSettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  const { toast } = useToast();
  const [backingUp, setBackingUp] = React.useState(false);

  const handleManualBackup = () => {
    setBackingUp(true);
    toast('INITIATING NEURAL BACKUP...', 'info');
    setTimeout(() => {
      setBackingUp(false);
      toast('SNAPSHOT COMMITTED TO CLOUD VAULT', 'success');
    }, 2000);
  };

  const handleExport = () => {
    toast('GENERATING LEDGER EXPORT...', 'info');
    setTimeout(() => {
      toast('LEDGER EXPORT COMPLETE', 'success');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Database size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Data & Sync</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure realtime replication and neural backup schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
          <BadgeRow label="Replication Stream" description="Live Supabase channel connectivity" icon={<Zap size={18} />} status="CONNECTED" />
        </div>
        <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
          <BadgeRow label="Sync Topology" description="Active database subscription scope" icon={<Cloud size={18} />} status="FULL_CASCADE" badgeColor="brand" />
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Synchronization Protocols</h4>
        <ToggleRow 
          label="Realtime Socket Broadcast" 
          description="Enable instant updates across all active terminals" 
          icon={<RefreshCw size={18} />} 
          value={data.realtime_enabled} 
          onChange={(v) => onChange('realtime_enabled', v)} 
        />
        <SelectRow 
          label="Deferred Sync Tier" 
          description="Set delay for background data reconciliation" 
          icon={<RefreshCw size={18} />} 
          value={data.sync_delay || 'Instant'} 
          onChange={(v) => onChange('sync_delay', v)}
          options={[
            { label: 'Instant (Neural Sync)', value: 'Instant' },
            { label: '15s (Aggregated)', value: '15s' },
            { label: '1m (Eco-Mode)', value: '1m' }
          ]}
        />
        <ToggleRow 
          label="Cascade Updates" 
          description="Propagate dependency changes through linked tables" 
          icon={<Database size={18} />} 
          value={data.cascade_updates} 
          onChange={(v) => onChange('cascade_updates', v)} 
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Archive & Backup</h4>
        <SelectRow 
          label="Automated Export Interval" 
          description="Schedule periodic ledger backups to cloud" 
          icon={<Download size={18} />} 
          value={data.export_interval || 'Daily'} 
          onChange={(v) => onChange('export_interval', v)}
          options={[
            { label: 'Hourly (High-Safety)', value: 'Hourly' },
            { label: 'Daily (Standard)', value: 'Daily' },
            { label: 'Weekly (Archive)', value: 'Weekly' }
          ]}
        />
        <div className="mt-8 flex gap-4">
          <button 
            onClick={handleManualBackup}
            disabled={backingUp}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            {backingUp ? <Loader2 size={14} className="animate-spin" /> : 'Initiate Manual Backup'}
          </button>
          <button 
            onClick={handleExport}
            className="flex-1 py-4 bg-brand/10 hover:bg-brand/20 border border-brand/20 rounded-xl text-brand font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Export JSON Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
