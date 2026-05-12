import React from 'react';
import { Mic, Zap, Cpu, Search, Activity, Volume2 } from 'lucide-react';
import { ToggleRow, SelectRow, SliderRow, BadgeRow } from '../SettingRows';

export const VANISettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Mic size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">VANI / Voice Engine</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure neural speech synthesis and AI execution thresholds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
          <BadgeRow label="Engine Core Status" description="VANI voice recognition & synthesis state" icon={<Activity size={18} />} status="OPERATIONAL" />
        </div>
        <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
          <BadgeRow label="Neural Latency" description="Average command dispatch response time" icon={<Zap size={18} />} status="12ms" />
        </div>
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Voice Synthesis Parameters</h4>
        <SelectRow 
          label="Neural TTS Voice" 
          description="Select the primary voice profile for system feedback" 
          icon={<Volume2 size={18} />} 
          value={data.voice_profile || 'Executive Male'} 
          onChange={(v) => onChange('voice_profile', v)}
          options={[
            { label: 'Executive Male (Standard)', value: 'Executive Male' },
            { label: 'Precision Female (Analytical)', value: 'Precision Female' },
            { label: 'Deep Neural (Synthetic)', value: 'Deep Neural' }
          ]}
        />
        <SliderRow 
          label="Speech Playback Rate" 
          description="Adjust the speed of vocal feedback" 
          icon={<Activity size={18} />} 
          value={data.speech_rate || 100} 
          min={50} 
          max={150} 
          unit="%"
          onChange={(v) => onChange('speech_rate', v)} 
        />
        <SliderRow 
          label="Neural Pitch Control" 
          description="Adjust the frequency of synthesis" 
          icon={<Activity size={18} />} 
          value={data.speech_pitch || 100} 
          min={50} 
          max={150} 
          unit="%"
          onChange={(v) => onChange('speech_pitch', v)} 
        />
      </div>

      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">AI Execution Core</h4>
        <SelectRow 
          label="Gemini Model Engine" 
          description="Large Language Model for command interpretation" 
          icon={<Cpu size={18} />} 
          value={data.ai_model || 'Gemini 1.5 Pro'} 
          onChange={(v) => onChange('ai_model', v)}
          options={[
            { label: 'Gemini 1.5 Pro (Strategic)', value: 'Gemini 1.5 Pro' },
            { label: 'Gemini 1.5 Flash (Tactical)', value: 'Gemini 1.5 Flash' },
            { label: 'Neural Core v2 (Legacy)', value: 'Neural Core v2' }
          ]}
        />
        <SliderRow 
          label="OCR Approval Threshold" 
          description="Confidence level for automated scan validation" 
          icon={<Search size={18} />} 
          value={data.ocr_threshold || 85} 
          min={50} 
          max={100} 
          unit="%"
          onChange={(v) => onChange('ocr_threshold', v)} 
        />
      </div>
    </div>
  );
};
