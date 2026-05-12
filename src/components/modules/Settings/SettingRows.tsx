import React from 'react';
import { motion } from 'motion/react';
import { Copy, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface RowProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export const ToggleRow = ({ label, description, icon, value, onChange }: RowProps & { value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between py-6 border-b border-white/5 last:border-0 group">
    <div className="flex gap-4">
      {icon && <div className="text-slate-400 group-hover:text-neon transition-colors">{icon}</div>}
      <div>
        <div className="text-sm font-bold text-white uppercase tracking-tight font-display">{label}</div>
        {description && <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{description}</div>}
      </div>
    </div>
    <motion.div
      onClick={() => onChange(!value)}
      whileTap={{ scale: 0.95 }}
      className={`w-12 h-6 rounded-full cursor-pointer flex items-center p-1 transition-all duration-500 ${
        value ? 'bg-neon shadow-[0_0_15px_rgba(159,239,0,0.3)]' : 'bg-slate-800'
      }`}
    >
      <motion.div 
        animate={{ x: value ? 24 : 0 }}
        className="w-4 h-4 bg-white rounded-full shadow-md"
      />
    </motion.div>
  </div>
);

export const SelectRow = ({ label, description, icon, value, onChange, options }: RowProps & { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) => (
  <div className="flex items-center justify-between py-6 border-b border-white/5 last:border-0 group">
    <div className="flex gap-4">
      {icon && <div className="text-slate-400 group-hover:text-neon transition-colors">{icon}</div>}
      <div>
        <div className="text-sm font-bold text-white uppercase tracking-tight font-display">{label}</div>
        {description && <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{description}</div>}
      </div>
    </div>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-800 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest p-2 rounded-lg outline-none focus:border-neon transition-all appearance-none px-4"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const InputRow = ({ label, description, icon, value, onChange, placeholder, type = "text" }: RowProps & { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div className="flex flex-col gap-4 py-6 border-b border-white/5 last:border-0 group">
    <div className="flex gap-4">
      {icon && <div className="text-slate-400 group-hover:text-neon transition-colors">{icon}</div>}
      <div>
        <div className="text-sm font-bold text-white uppercase tracking-tight font-display">{label}</div>
        {description && <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{description}</div>}
      </div>
    </div>
    <div className="relative">
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white font-mono text-xs outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
      />
    </div>
  </div>
);

export const SliderRow = ({ label, description, icon, value, onChange, min = 0, max = 100, step = 1, unit = "" }: RowProps & { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) => (
  <div className="flex flex-col gap-4 py-6 border-b border-white/5 last:border-0 group">
    <div className="flex justify-between items-center">
      <div className="flex gap-4">
        {icon && <div className="text-slate-400 group-hover:text-neon transition-colors">{icon}</div>}
        <div>
          <div className="text-sm font-bold text-white uppercase tracking-tight font-display">{label}</div>
          {description && <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{description}</div>}
        </div>
      </div>
      <div className="font-mono text-neon font-black text-xs">{value}{unit}</div>
    </div>
    <input 
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon"
    />
  </div>
);

export const BadgeRow = ({ label, description, icon, status, badgeColor = "neon" }: RowProps & { status: string; badgeColor?: string }) => (
  <div className="flex items-center justify-between py-6 border-b border-white/5 last:border-0 group">
    <div className="flex gap-4">
      {icon && <div className="text-slate-400 group-hover:text-neon transition-colors">{icon}</div>}
      <div>
        <div className="text-sm font-bold text-white uppercase tracking-tight font-display">{label}</div>
        {description && <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{description}</div>}
      </div>
    </div>
    <div className={`px-4 py-1.5 rounded-full border border-white/10 font-black text-[9px] uppercase tracking-[0.2em] ${
      badgeColor === 'neon' ? 'bg-neon/10 text-neon' : 'bg-brand/10 text-brand'
    }`}>
      {status}
    </div>
  </div>
);

export const KeyDisplayRow = ({ label, description, icon, apiKey }: RowProps & { apiKey: string }) => {
  const [show, setShow] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 py-6 border-b border-white/5 last:border-0 group">
      <div className="flex gap-4">
        {icon && <div className="text-slate-400 group-hover:text-neon transition-colors">{icon}</div>}
        <div>
          <div className="text-sm font-bold text-white uppercase tracking-tight font-display">{label}</div>
          {description && <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{description}</div>}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl p-4 font-mono text-[10px] text-slate-400 overflow-hidden relative">
          {show ? apiKey : apiKey.replace(/./g, '•').slice(0, 32)}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3">
            <button onClick={() => setShow(!show)} className="text-slate-500 hover:text-white transition-colors">
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <button 
          onClick={handleCopy}
          className="px-6 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          {copied ? <CheckCircle2 size={14} className="text-neon" /> : <Copy size={14} />}
          <span className="text-[9px] font-black uppercase tracking-widest">{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>
    </div>
  );
};
