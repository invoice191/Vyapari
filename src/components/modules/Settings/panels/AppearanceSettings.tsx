import React from 'react';
import { Palette, Eye, Zap, Layers, Maximize, Box } from 'lucide-react';
import { ToggleRow, SelectRow } from '../SettingRows';

export const AppearanceSettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Palette size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Visual Engine</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure interface telemetry and aesthetic parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { id: 'Executive Indigo', color: '#4F46E5', desc: 'Modern Professional' },
          { id: 'Deep Emerald', color: '#10B981', desc: 'Financial Growth' },
          { id: 'Slate Command', color: '#334155', desc: 'Minimalist Focus' }
        ].map(theme => (
          <button 
            key={theme.id}
            onClick={() => onChange('theme', theme.id)}
            className={`brutal-card !bg-white/[0.02] !border-white/[0.05] !p-6 text-left group transition-all ${
              data.theme === theme.id ? '!border-brand shadow-xl shadow-brand/10' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: theme.color + '20' }}>
              <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: theme.color }}></div>
            </div>
            <div className="text-[11px] font-black uppercase text-white tracking-tight">{theme.id}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{theme.desc}</div>
          </button>
        ))}
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Interface Dynamics</h4>
        <ToggleRow 
          label="Glassmorphic Surfaces" 
          description="Enable translucent background blur on modules" 
          icon={<Layers size={18} />} 
          value={data.glassmorphism} 
          onChange={(v) => onChange('glassmorphism', v)} 
        />
        <ToggleRow 
          label="3D Heatmap Visualization" 
          description="Enable depth-aware analytical charts" 
          icon={<Box size={18} />} 
          value={data.heatmap_3d} 
          onChange={(v) => onChange('heatmap_3d', v)} 
        />
        <ToggleRow 
          label="High-Density Grid" 
          description="Reduce whitespace for maximized data visibility" 
          icon={<Maximize size={18} />} 
          value={data.high_density} 
          onChange={(v) => onChange('high_density', v)} 
        />
        <ToggleRow 
          label="Kinetic Transitions" 
          description="Enable 60fps micro-animations on interaction" 
          icon={<Zap size={18} />} 
          value={data.animations} 
          onChange={(v) => onChange('animations', v)} 
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Display Calibration</h4>
        <SelectRow 
          label="Global Font Engine" 
          description="Select primary typography system" 
          icon={<Eye size={18} />} 
          value={data.font_family || 'Outfit'} 
          onChange={(v) => onChange('font_family', v)}
          options={[
            { label: 'Outfit (Standard)', value: 'Outfit' },
            { label: 'Space Grotesk (Modern)', value: 'Space Grotesk' },
            { label: 'Inter (Technical)', value: 'Inter' }
          ]}
        />
      </div>
    </div>
  );
};
