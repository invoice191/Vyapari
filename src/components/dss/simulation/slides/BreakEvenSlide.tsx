import React from 'react';
import { motion } from 'motion/react';
import { Target, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Theme } from '../PresentationMode';

interface SlideProps {
  data: any;
  theme: Theme;
}

export default function BreakEvenSlide({ data, theme }: SlideProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-50';

  return (
    <div className="w-full h-full flex flex-col px-8 py-6 overflow-hidden min-h-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h2 className={`text-2xl lg:text-3xl font-black ${textColor} uppercase tracking-tight mb-2 italic`}>Break-Even & Risk</h2>
        <div className="w-24 h-1 bg-indigo-500 rounded-full" />
      </motion.div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-6 lg:p-8 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-xl relative overflow-hidden flex flex-col justify-center`}
        >
          <div className="absolute top-0 right-0 p-8 text-indigo-500/5 pointer-events-none">
            <Target size={160} />
          </div>
          
          <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${textColor} mb-6`}>Break-Even Analysis</h3>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required Units</span>
                <p className={`text-3xl font-black ${textColor} tracking-tighter italic`}>847 Units</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Velocity</span>
                <p className="text-xl font-black text-indigo-400 italic">40 units/day</p>
              </div>
            </div>

            <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Break-Even Time</span>
                <p className={`text-3xl font-black ${textColor} tracking-tighter italic`}>21 Days</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Day</span>
                <p className="text-xl font-black text-emerald-500 italic">Day 22</p>
              </div>
            </div>

            <div className="pt-6">
              <div className="flex items-center gap-4 text-emerald-500">
                <ShieldCheck size={24} />
                <span className="text-sm font-black uppercase tracking-[0.2em] italic">Projection: HIGHLY ACHIEVABLE</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className={`p-6 lg:p-8 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-xl relative overflow-hidden flex flex-col justify-center`}
        >
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
            <Activity size={160} />
          </div>
          
          <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${textColor} mb-6`}>Risk Matrix</h3>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {[
              { label: 'Price Risk', val: 'LOW', color: 'text-emerald-500', icon: <ShieldCheck size={16} /> },
              { label: 'Demand Risk', val: 'LOW', color: 'text-emerald-500', icon: <ShieldCheck size={16} /> },
              { label: 'Market Risk', val: 'MED', color: 'text-amber-500', icon: <AlertTriangle size={16} /> },
              { label: 'Overall Risk', val: 'LOW', color: 'text-emerald-500', icon: <ShieldCheck size={16} /> }
            ].map((risk, i) => (
              <div key={i} className={`p-4 rounded-xl bg-black/10 border ${borderColor} flex justify-between items-center group hover:border-indigo-500/30 transition-all`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${textColor} opacity-60`}>{risk.label}</span>
                <div className={`flex items-center gap-2 ${risk.color}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest italic">{risk.val}</span>
                  {risk.icon}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Score</span>
              <span className="text-sm font-black text-indigo-500 italic">{data.summary?.overall_confidence || 87}%</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.summary?.overall_confidence || 87}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-indigo-500"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
