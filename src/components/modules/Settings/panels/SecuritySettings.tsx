import React from 'react';
import { Shield, Lock, Eye, Key, Clock, Globe, List } from 'lucide-react';
import { ToggleRow, SelectRow, InputRow, BadgeRow } from '../SettingRows';
import { useToast } from '../../../common/Toast';

export const SecuritySettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  const { toast } = useToast();

  const handleViewLogs = () => {
    toast('REDIRECTING TO MASTER AUDIT LOGS...', 'info');
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'audit' } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Shield size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Vault Security</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Harden your enterprise environment and authentication gates</p>
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Authentication Gateways</h4>
        <BadgeRow label="2FA Protocol Status" description="Multi-factor authentication enforcement" icon={<Lock size={18} />} status="INACTIVE" badgeColor="brand" />
        <ToggleRow 
          label="Require Biometric Unlock" 
          description="Enforce Fingerprint/FaceID on mobile terminals" 
          icon={<Lock size={18} />} 
          value={data.biometric_lock} 
          onChange={(v) => onChange('biometric_lock', v)} 
        />
        <SelectRow 
          label="Session TTL Threshold" 
          description="Automatic logout after operational inactivity" 
          icon={<Clock size={18} />} 
          value={data.session_timeout || '4h'} 
          onChange={(v) => onChange('session_timeout', v)}
          options={[
            { label: '30m (High-Security)', value: '30m' },
            { label: '4h (Standard)', value: '4h' },
            { label: '24h (Extended)', value: '24h' }
          ]}
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Network Hardening</h4>
        <InputRow 
          label="IP Whitelist (CIDR)" 
          description="Restrict terminal access to specific IPv4/IPv6 ranges" 
          icon={<Globe size={18} />} 
          value={data.ip_whitelist || ''} 
          placeholder="192.168.1.1, 10.0.0.0/24..."
          onChange={(v) => onChange('ip_whitelist', v)} 
        />
        <ToggleRow 
          label="Enforce RLS Shield" 
          description="Verify Row-Level Security on every neural query" 
          icon={<Shield size={18} />} 
          value={data.rls_shield} 
          onChange={(v) => onChange('rls_shield', v)} 
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Audit Matrix</h4>
        <SelectRow 
          label="Log Retention Period" 
          description="How long to keep historical audit logs in the vault" 
          icon={<List size={18} />} 
          value={data.audit_retention || '90d'} 
          onChange={(v) => onChange('audit_retention', v)}
          options={[
            { label: '30 Days (Compliance)', value: '30d' },
            { label: '90 Days (Standard)', value: '90d' },
            { label: '365 Days (Extended)', value: '365d' }
          ]}
        />
        <button 
          onClick={handleViewLogs}
          className="mt-8 text-[10px] font-black text-brand uppercase tracking-widest hover:text-neon transition-colors"
        >
          View Master Audit Logs →
        </button>
      </div>
    </div>
  );
};
