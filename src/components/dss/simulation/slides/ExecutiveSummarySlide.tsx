import React from 'react';
import { motion } from 'motion/react';
import { Brain, CheckCircle2, AlertTriangle, Sparkles, ShieldAlert } from 'lucide-react';
import { Theme } from '../PresentationMode';

interface SlideProps {
  data: any;
  theme: Theme;
}

export default function ExecutiveSummarySlide({ data, theme }: SlideProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-50';

  return (
    <div className="w-full h-full flex flex-col px-4 lg:px-12 py-8 overflow-hidden min-h-0 relative">
      {/* Background Floating Nodes */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
         <motion.div 
           animate={{ 
             y: [0, -20, 0],
             opacity: [0.1, 0.3, 0.1]
           }}
           transition={{ duration: 8, repeat: Infinity }}
           className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500 rounded-full blur-[80px]" 
         />
         <motion.div 
           animate={{ 
             y: [0, 20, 0],
             opacity: [0.1, 0.2, 0.1]
           }}
           transition={{ duration: 10, repeat: Infinity, delay: 1 }}
           className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-emerald-500 rounded-full blur-[100px]" 
         />
      </div>

      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-10 relative z-10"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-1 bg-indigo-500 rounded-full" />
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em]">Phase 01: Synthesis</span>
        </div>
        <h2 className={`text-4xl lg:text-5xl font-black ${textColor} uppercase tracking-tighter italic leading-none`}>Executive <span className="text-indigo-500">Summary</span></h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`lg:col-span-7 p-10 lg:p-12 rounded-[3.5rem] border ${borderColor} ${cardBg} backdrop-blur-3xl relative overflow-hidden flex flex-col shadow-2xl`}
        >
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#80808015_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
          
          <div className="absolute top-[-5%] right-[-5%] p-8 text-indigo-500/10 rotate-12">
            <Brain size={240} />
          </div>
          
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
              <Sparkles size={28} />
            </div>
            <div>
               <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${textColor} opacity-50`}>NEURAL CORE INSIGHT</h3>
               <div className="text-sm font-black text-indigo-500 uppercase">Strategic Directive</div>
            </div>
          </div>

          <div className={`text-3xl lg:text-4xl font-black ${textColor} leading-[1.1] mb-auto italic pr-12 relative z-10 tracking-tight`}>
            "{data.summary?.headline || "Positive growth detected across all selected product nodes with high strategic confidence."}"
          </div>

          <div className="mt-16 relative z-10 bg-black/5 p-8 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Statistical Signal Strength</span>
              </div>
              <span className="text-xl font-black text-indigo-500 italic">{data.summary?.overall_confidence || 87}%</span>
            </div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.summary?.overall_confidence || 87}%` }}
                transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
                className="h-full bg-indigo-500 rounded-full shadow-[0_0_20px_#6366f1]"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5 space-y-4 lg:space-y-6 flex flex-col justify-between min-h-0"
        >
          <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${textColor} opacity-30 ml-2`}>Strategic Findings</h3>
            
            <div className="space-y-4">
              {data.ai_insights?.slice(0, 3).map((insight: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1) }}
                  className={`p-6 rounded-[2rem] border ${borderColor} ${cardBg} flex items-start gap-5 hover:border-indigo-500/40 hover:bg-white/5 transition-all group shadow-sm`}
                >
                  <div className={`mt-1 p-2 rounded-lg ${insight.priority === 'HIGH' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className={`text-[11px] font-black uppercase ${textColor} mb-1 tracking-tight group-hover:text-indigo-400 transition-colors`}>{insight.title}</h4>
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic line-clamp-2 opacity-80">"{insight.detail}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className={`p-8 rounded-[2.5rem] border-2 border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between shadow-2xl relative overflow-hidden group/risk mt-4`}>
             <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 -translate-x-full group-hover/risk:translate-x-full transition-transform duration-1000" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/20">
                   <ShieldAlert size={32} />
                </div>
                <div>
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Risk Assessment</div>
                   <div className="text-2xl font-black text-emerald-500 uppercase italic tracking-tighter">LOW RISK</div>
                </div>
             </div>
             <div className="text-right relative z-10">
                <div className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30">OPERATIONAL</div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>

  );
}
