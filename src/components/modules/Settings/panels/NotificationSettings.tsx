import React from 'react';
import { Bell, MessageSquare, Mail, Zap, Calendar, Smartphone, Moon, ArrowUpRight, Filter, Clock, ShieldAlert } from 'lucide-react';
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

      {/* Enterprise Alert Additions */}
      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
          <ShieldAlert size={14} className="text-amber-500" /> Advanced Alert Protocol
        </h4>
        
        <ToggleRow 
          label="Do Not Disturb (DND)" 
          description="Suppress non-critical alerts outside of operational hours" 
          icon={<Moon size={18} />} 
          value={data.dnd_enabled || false} 
          onChange={(v) => onChange('dnd_enabled', v)} 
        />
        
        {data.dnd_enabled && (
          <div className="ml-12 pl-4 border-l border-slate-700/50 space-y-4 mb-4 mt-2">
            <SelectRow 
              label="DND Operational Window" 
              description="Alerts will be silent outside these hours" 
              icon={<Clock size={16} className="text-slate-500" />} 
              value={data.dnd_window || '22-06'} 
              onChange={(v) => onChange('dnd_window', v)}
              options={[
                { label: '10:00 PM to 06:00 AM', value: '22-06' },
                { label: '08:00 PM to 08:00 AM', value: '20-08' },
                { label: 'Weekend Silence Only', value: 'weekend' }
              ]}
            />
          </div>
        )}

        <SelectRow 
          label="Priority-Based Routing" 
          description="How critical system alerts are handled" 
          icon={<Filter size={18} />} 
          value={data.alert_routing || 'intelligent'} 
          onChange={(v) => onChange('alert_routing', v)}
          options={[
            { label: 'Intelligent (AI predicts priority)', value: 'intelligent' },
            { label: 'Critical -> SMS & Email, Warn -> In-App', value: 'critical_escalate' },
            { label: 'All Alerts to All Channels', value: 'broadcast' }
          ]}
        />

        <ToggleRow 
          label="Escalation Rules" 
          description="If an alert is unread for 1 hour, escalate to SMS automatically" 
          icon={<ArrowUpRight size={18} />} 
          value={data.escalation_enabled || false} 
          onChange={(v) => onChange('escalation_enabled', v)} 
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Per-User Preferences</h4>
         <SelectRow 
          label="My Active Role Profile" 
          description="Filters noise. You will only receive alerts relevant to this role." 
          icon={<Bell size={18} />} 
          value={data.user_notification_role || 'owner'} 
          onChange={(v) => onChange('user_notification_role', v)}
          options={[
            { label: 'Business Owner (All Alerts)', value: 'owner' },
            { label: 'Inventory Manager (Stock only)', value: 'inventory' },
            { label: 'Sales Exec (Invoices only)', value: 'sales' },
            { label: 'Silent Mode (History only)', value: 'silent' }
          ]}
        />
      </div>

      <TelegramSettings data={data} onChange={onChange} />
    </div>
  );
};
