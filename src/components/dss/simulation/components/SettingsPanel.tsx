import React from 'react';
import { motion } from 'motion/react';
import { X, Moon, Sun, Type, Zap, Clock, Hash } from 'lucide-react';
import { Theme, AnimationSpeed } from '../PresentationMode';

interface SettingsPanelProps {
  onClose: () => void;
  settings: {
    autoPlay: boolean;
    slideDuration: number;
    animationSpeed: AnimationSpeed;
    theme: Theme;
    fontSize: 'normal' | 'large';
    showSlideNumbers: boolean;
  };
  onUpdate: (key: string, val: any) => void;
  theme: Theme;
}

export default function SettingsPanel({ onClose, settings, onUpdate, theme }: SettingsPanelProps) {
  const bgColor = theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className={`fixed top-0 right-0 bottom-0 w-full max-w-sm ${bgColor} ${borderColor} border-l shadow-2xl z-[100] p-8 flex flex-col`}
    >
      <div className="flex justify-between items-center mb-8">
        <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${textColor}`}>Presentation Settings</h3>
        <button onClick={onClose} className={`p-2 rounded-lg hover:bg-white/10 ${textColor}`}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        {/* Auto Play */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 opacity-50">
            <Clock size={14} className={textColor} />
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>Auto-Play</h4>
          </div>
          <div className="flex p-1 bg-black/20 rounded-xl">
            {['OFF', 'ON'].map((val, i) => (
              <button
                key={val}
                onClick={() => onUpdate('autoPlay', i === 1)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                  (settings.autoPlay === (i === 1)) 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </section>

        {/* Slide Duration */}
        {settings.autoPlay && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 opacity-50">
              <Clock size={14} className={textColor} />
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>Slide Duration</h4>
            </div>
            <div className="flex gap-2">
              {[3, 5, 10, 15].map(s => (
                <button
                  key={s}
                  onClick={() => onUpdate('slideDuration', s)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black border ${borderColor} transition-all ${
                    settings.slideDuration === s ? 'bg-indigo-600 border-indigo-500 text-white' : textColor + ' hover:bg-white/5'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Animation Speed */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 opacity-50">
            <Zap size={14} className={textColor} />
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>Animation Speed</h4>
          </div>
          <div className="flex gap-2">
            {['slow', 'normal', 'fast'].map(s => (
              <button
                key={s}
                onClick={() => onUpdate('animationSpeed', s)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black border ${borderColor} capitalize transition-all ${
                  settings.animationSpeed === s ? 'bg-indigo-600 border-indigo-500 text-white' : textColor + ' hover:bg-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 opacity-50">
            <Moon size={14} className={textColor} />
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>Visual Theme</h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate('theme', 'dark')}
              className={`flex-1 py-4 rounded-2xl border ${borderColor} flex flex-col items-center gap-2 transition-all ${
                settings.theme === 'dark' ? 'bg-indigo-600 border-indigo-500 text-white' : textColor + ' hover:bg-white/5'
              }`}
            >
              <Moon size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Dark</span>
            </button>
            <button
              onClick={() => onUpdate('theme', 'light')}
              className={`flex-1 py-4 rounded-2xl border ${borderColor} flex flex-col items-center gap-2 transition-all ${
                settings.theme === 'light' ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : textColor + ' hover:bg-white/5 shadow-sm'
              }`}
            >
              <Sun size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Light</span>
            </button>
          </div>
        </section>

        {/* Font Size */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 opacity-50">
            <Type size={14} className={textColor} />
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>Font Size</h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate('fontSize', 'normal')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black border ${borderColor} transition-all ${
                settings.fontSize === 'normal' ? 'bg-indigo-600 border-indigo-500 text-white' : textColor + ' hover:bg-white/5'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => onUpdate('fontSize', 'large')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black border ${borderColor} transition-all ${
                settings.fontSize === 'large' ? 'bg-indigo-600 border-indigo-500 text-white' : textColor + ' hover:bg-white/5'
              }`}
            >
              Large
            </button>
          </div>
        </section>

        {/* Slide Numbers */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 opacity-50">
            <Hash size={14} className={textColor} />
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>Slide Numbers</h4>
          </div>
          <button
            onClick={() => onUpdate('showSlideNumbers', !settings.showSlideNumbers)}
            className={`w-full py-3 rounded-xl border ${borderColor} text-[10px] font-black uppercase tracking-widest transition-all ${
              settings.showSlideNumbers ? 'bg-indigo-600 border-indigo-500 text-white' : textColor + ' hover:bg-white/5'
            }`}
          >
            {settings.showSlideNumbers ? 'Visible' : 'Hidden'}
          </button>
        </section>
      </div>

      <button
        onClick={onClose}
        className="mt-8 w-full py-4 bg-white/5 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:text-white hover:bg-white/10 transition-all"
      >
        Close Settings
      </button>
    </motion.div>
  );
}
