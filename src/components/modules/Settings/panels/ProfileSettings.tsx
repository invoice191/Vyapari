import React from 'react';
import { Building2, Tag, Mail, Smartphone, MapPin, Globe, Clock, IndianRupee } from 'lucide-react';
import { InputRow, SelectRow } from '../SettingRows';

export const ProfileSettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Building2 size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Business Identity</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure your legal and operational credentials</p>
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <InputRow 
          label="Corporate Name" 
          description="Legal registered name of your enterprise" 
          icon={<Building2 size={18} />} 
          value={data.name} 
          onChange={(v) => onChange('name', v)} 
        />
        <InputRow 
          label="GST Identification (GSTIN)" 
          description="15-character alphanumeric tax identifier" 
          icon={<Tag size={18} />} 
          value={data.gstin} 
          onChange={(v) => onChange('gstin', v)} 
        />
        <InputRow 
          label="Administrative Email" 
          description="Primary contact for system alerts and billing" 
          icon={<Mail size={18} />} 
          value={data.email} 
          onChange={(v) => onChange('email', v)} 
        />
        <InputRow 
          label="Operational Phone" 
          description="Registered mobile number for SMS/WhatsApp triggers" 
          icon={<Smartphone size={18} />} 
          value={data.phone} 
          onChange={(v) => onChange('phone', v)} 
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <MapPin size={16} className="text-slate-400" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Localization Matrix</h4>
        </div>
        <SelectRow 
          label="Base Currency" 
          description="Primary currency for ledger and reporting" 
          icon={<IndianRupee size={18} />} 
          value={data.currency || 'INR'} 
          onChange={(v) => onChange('currency', v)}
          options={[
            { label: 'INR (Rs.) - Indian Rupee', value: 'INR' },
            { label: 'USD ($) - US Dollar', value: 'USD' },
            { label: 'EUR (-) - Euro', value: 'EUR' }
          ]}
        />
        <SelectRow 
          label="System Timezone" 
          description="Standard reference for audit logs and schedules" 
          icon={<Clock size={18} />} 
          value={data.timezone || 'IST'} 
          onChange={(v) => onChange('timezone', v)}
          options={[
            { label: 'IST (UTC+5:30) - Mumbai', value: 'IST' },
            { label: 'UTC (UTC+0) - GMT', value: 'UTC' },
            { label: 'EST (UTC-5) - New York', value: 'EST' }
          ]}
        />
        <InputRow 
          label="Operational Headquarters" 
          description="Full physical address for document headers" 
          icon={<Globe size={18} />} 
          value={data.address} 
          onChange={(v) => onChange('address', v)} 
        />
      </div>
    </div>
  );
};
