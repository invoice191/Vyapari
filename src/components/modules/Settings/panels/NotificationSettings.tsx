import React from 'react';
import { Bell, MessageSquare, Mail, Zap, Calendar, Smartphone } from 'lucide-react';
import { ToggleRow, SelectRow } from '../SettingRows';
import { TelegramSettings } from './TelegramSettings';


export const NotificationSettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Communication Matrix</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure automated dunning, neural alerts, and briefings</p>
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Neural Signal Channels</h4>
        <ToggleRow 
          label="VANI Neural Alerts" 
          description="Direct voice-to-push alerts for high-priority events" 
          icon={<Zap size={18} />} 
          value={data.vani_alerts} 
          onChange={(v) => onChange('vani_alerts', v)} 
        />
        <ToggleRow 
          label="Dunning Daemon" 
          description="Automated payment reminders via active channels" 
          icon={<MessageSquare size={18} />} 
          value={data.dunning_daemon} 
          onChange={(v) => onChange('dunning_daemon', v)} 
        />
        <ToggleRow 
          label="Daily Strategic Briefing" 
          description="AI-generated operational summary delivered every morning" 
          icon={<Calendar size={18} />} 
          value={data.daily_briefing} 
          onChange={(v) => onChange('daily_briefing', v)} 
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Telemetry Toggles</h4>
        <ToggleRow 
          label="WhatsApp Signal" 
          description="Direct messaging for invoices and reminders" 
          icon={<Smartphone size={18} />} 
          value={data.whatsapp_enabled} 
          onChange={(v) => onChange('whatsapp_enabled', v)} 
        />
        <ToggleRow 
          label="SMS Trunk" 
          description="Standard cellular fallback for critical system alerts" 
          icon={<Smartphone size={18} />} 
          value={data.sms_enabled} 
          onChange={(v) => onChange('sms_enabled', v)} 
        />
        <ToggleRow 
          label="Email Reports" 
          description="Detailed financial and analytical reports via SMTP" 
          icon={<Mail size={18} />} 
          value={data.email_enabled} 
          onChange={(v) => onChange('email_enabled', v)} 
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Schedule Configuration</h4>
        <SelectRow 
          label="Briefing Execution Time" 
          description="When the Daily Briefing engine should trigger" 
          icon={<Calendar size={18} />} 
          value={data.briefing_time || '08:00'} 
          onChange={(v) => onChange('briefing_time', v)}
          options={[
            { label: '07:00 AM (Early Bird)', value: '07:00' },
            { label: '08:00 AM (Standard)', value: '08:00' },
            { label: '09:00 AM (Operational)', value: '09:00' },
            { label: '10:00 AM (Executive)', value: '10:00' }
          ]}
        />
      </div>

      <TelegramSettings data={data} onChange={onChange} />
    </div>
  );
};
