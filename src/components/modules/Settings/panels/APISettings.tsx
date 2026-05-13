import React from 'react';
import { Key, Globe, Zap, RotateCcw, Shield, ExternalLink, Cpu, Loader2 } from 'lucide-react';
import { KeyDisplayRow, ToggleRow, SelectRow, BadgeRow, InputRow } from '../SettingRows';
import { useToast } from '../../../common/Toast';

export const APISettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  const { toast } = useToast();
  const [rotating, setRotating] = React.useState(false);

  const handleRotateKey = () => {
    setRotating(true);
    toast('RECYCLING OPERATIONAL CREDENTIALS...', 'info');
    setTimeout(() => {
      setRotating(false);
      toast('NEW NEURAL KEY COMMITTED', 'success');
    }, 2000);
  };

  const handleConfigure = (service: string) => {
    toast(`OPENING ${service.toUpperCase()} CONFIGURATION BRIDGE...`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Key size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Neural Integrations</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage API credentials and external system bridges</p>
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Vyapari Neural Key</h4>
        <KeyDisplayRow 
          label="Operational API Key" 
          description="Used for external terminal authentication and dunning hooks" 
          icon={<Key size={18} />} 
          apiKey="sb_live_09x_p_22A09Z_VYAPARI_NODE_CORE_778X" 
        />
        <div className="mt-8 flex gap-4">
          <button 
            onClick={handleRotateKey}
            disabled={rotating}
            className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50"
          >
            {rotating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} className="text-slate-500" />}
            <span className="text-[9px] font-black uppercase tracking-widest">Rotate Operational Key</span>
          </button>
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">External Neural Bridges</h4>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#4F46E5]/10 rounded-lg flex items-center justify-center text-[#4F46E5]">
                <Cpu size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-tight">Google Gemini Engine</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Model: v1.5 Pro | Status: ACTIVE</div>
              </div>
            </div>
            <button 
              onClick={() => handleConfigure('Gemini')}
              className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-2"
            >
              CONFIGURE <ExternalLink size={10} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F22F46]/10 rounded-lg flex items-center justify-center text-[#F22F46]">
                <Zap size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-tight">Twilio SMS Trunk</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SID: AC_99... | Status: STANDBY</div>
              </div>
            </div>
            <button 
              onClick={() => handleConfigure('Twilio')}
              className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-2"
            >
              CONFIGURE <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Webhook Telemetry</h4>
        <InputRow 
          label="System Webhook Secret" 
          description="Used to sign outgoing payloads for third-party verification" 
          icon={<Shield size={18} />} 
          value={data.webhook_secret || 'whsec_...'} 
          onChange={(v) => onChange('webhook_secret', v)} 
        />
        <SelectRow 
          label="Key Rotation Schedule" 
          description="Automated credential recycling interval" 
          icon={<RotateCcw size={18} />} 
          value={data.rotation_schedule || '90d'} 
          onChange={(v) => onChange('rotation_schedule', v)}
          options={[
            { label: '30 Days (Military-Grade)', value: '30d' },
            { label: '90 Days (Corporate)', value: '90d' },
            { label: 'Manual Only', value: 'manual' }
          ]}
        />
      </div>
    </div>
  );
};
