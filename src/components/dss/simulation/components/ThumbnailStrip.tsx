import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Theme } from '../PresentationMode';

interface ThumbnailStripProps {
  slides: any[];
  current: number;
  onSelect: (index: number) => void;
  onClose: () => void;
  theme: Theme;
}

export default function ThumbnailStrip({ slides, current, onSelect, onClose, theme }: ThumbnailStripProps) {
  const bgColor = theme === 'dark' ? 'bg-[#0F172A]/90' : 'bg-white/90';
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className={`fixed bottom-0 left-0 right-0 h-48 ${bgColor} backdrop-blur-xl border-t ${borderColor} z-[100] p-6 flex flex-col gap-4`}
    >
      <div className="flex justify-between items-center px-4">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${textColor} opacity-50`}>Slide Navigator</h3>
        <button onClick={onClose} className={`p-2 rounded-lg hover:bg-white/10 ${textColor}`}>
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto flex gap-4 pb-2 custom-scrollbar items-center px-4">
        {slides.map((slide, i) => (
          <motion.button
            key={i}
            onClick={() => onSelect(i)}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`flex-shrink-0 w-40 h-24 rounded-xl border-2 transition-all relative group overflow-hidden ${
              current === i 
                ? 'border-indigo-500 shadow-xl shadow-indigo-500/20' 
                : `${borderColor} hover:border-white/30`
            }`}
          >
            <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center`}>
              <span className={`text-xs font-black ${textColor} opacity-20`}>{slide.id.toUpperCase()}</span>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm flex justify-between items-center">
              <span className="text-[8px] font-black text-white">{i + 1}</span>
              {current === i && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
