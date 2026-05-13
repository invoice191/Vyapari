import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, ArrowRight, Zap, Target } from 'lucide-react';
import CountUp from '../components/CountUpNumber';
import { Theme } from '../PresentationMode';

interface SlideProps {
  data: any;
  theme: Theme;
}

export default function FinancialImpactSlide({ data, theme }: SlideProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-50';

  const revenueChange = data.summary?.potential_revenue_change_percent || 24.6;
  const profitChange = data.summary?.potential_profit_change_percent || 26.4;

  return (
    <div className="w-full h-full flex flex-col px-4 lg:px-12 py-8 overflow-hidden min-h-0 relative">
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-10 z-0">
         <motion.div 
           animate={{ 
             scale: [1, 1.3, 1],
             rotate: [0, 90, 0]
           }}
           transition={{ duration: 15, repeat: Infinity }}
           className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px]" 
         />
      </div>

      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-10 relative z-10"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-1 bg-emerald-500 rounded-full" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em]">Phase 02: Projection</span>
        </div>
        <h2 className={`text-4xl lg:text-5xl font-black ${textColor} uppercase tracking-tighter italic leading-none`}>Financial <span className="text-emerald-500">Impact</span></h2>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 lg:gap-12 min-h-0 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`w-full lg:flex-1 p-8 lg:p-10 rounded-[3rem] border ${borderColor} ${cardBg} backdrop-blur-3xl text-center relative group overflow-hidden shadow-xl`}
          >
            <div className="absolute top-[-10%] right-[-10%] p-8 text-slate-500/10 group-hover:text-slate-500/20 transition-all rotate-[-15deg]">
              <TrendingUp size={180} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 inline-block">Operational Baseline</span>
            <div className={`text-4xl lg:text-5xl font-black ${textColor} tracking-tighter mb-2 italic tabular-nums`}>
              Rs.{data.current_scenario?.total_revenue?.toLocaleString() || '52,000'}
            </div>
            <div className="flex items-center justify-center gap-2">
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Monthly Mean Revenue</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            className="text-indigo-500 hidden lg:block"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(99,102,241,0.2)]">
               <ArrowRight size={32} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`w-full lg:flex-1 p-8 lg:p-10 rounded-[3rem] border-2 border-indigo-500/50 bg-indigo-500/10 backdrop-blur-3xl text-center relative group overflow-hidden shadow-2xl shadow-indigo-500/20`}
          >
            <div className="absolute top-[-10%] left-[-10%] p-8 text-indigo-500/20 group-hover:scale-110 transition-transform rotate-12">
              <Zap size={200} />
            </div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 inline-block">Strategic Target</span>
            <div className={`text-5xl lg:text-6xl font-black ${textColor} tracking-tighter mb-2 italic tabular-nums`}>
              <CountUp target={data.simulated_scenario?.total_revenue_projected || 64800} />
            </div>
            <div className="flex items-center justify-center gap-2">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Projected Growth Potential</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className={`w-full max-w-3xl p-10 lg:p-14 rounded-[3.5rem] border-2 border-emerald-500/30 bg-emerald-500/5 backdrop-blur-3xl text-center relative overflow-hidden group shadow-2xl`}
        >
          {/* Animated Glow Overlay */}
          <motion.div 
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-emerald-500/5 pointer-events-none" 
          />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500/5 pointer-events-none rotate-45">
            <Target size={300} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-[1px] bg-emerald-500/40" />
               <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.6em] inline-block">Net Monthly Surplus</span>
               <div className="w-8 h-[1px] bg-emerald-500/40" />
            </div>
            
            <div className={`text-6xl lg:text-7xl font-black ${textColor} tracking-tighter mb-4 italic tabular-nums`}>
              +Rs.{((data.simulated_scenario?.total_revenue_projected || 64800) - (data.current_scenario?.total_revenue || 52000)).toLocaleString()}
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="px-8 py-3 rounded-2xl bg-emerald-500 text-white text-[13px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/40"
              >
                +{revenueChange}% Growth Rate
              </motion.div>
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-emerald-500/20 text-sm font-black text-emerald-400 uppercase italic">
                Profit delta: +{profitChange}%
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>

  );
}
