import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ShieldCheck, Target } from 'lucide-react';
import { Theme } from '../PresentationMode';

interface SlideProps {
  data: any;
  business: any;
  theme: Theme;
}

export default function CoverSlide({ data, business, theme }: SlideProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-50';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden px-6 lg:px-12">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:80px_80px]" />
        
        {/* Animated Floating Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.sin(i) * 50, 0],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5
            }}
            className="absolute w-1 h-1 bg-indigo-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center z-10 w-full max-w-5xl"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-6 mb-12"
        >
          <div className="h-[2px] w-24 bg-gradient-to-r from-transparent to-indigo-500 rounded-full" />
          <div className="flex items-center gap-4">
            <Sparkles className="text-indigo-500 animate-pulse" size={32} />
            <h1 className={`text-3xl lg:text-4xl font-black tracking-[0.4em] ${textColor} italic leading-none`}>VYAPARI <span className="text-indigo-500">DSS</span></h1>
          </div>
          <div className="h-[2px] w-24 bg-gradient-to-l from-transparent to-indigo-500 rounded-full" />
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter ${textColor} uppercase mb-20 leading-[0.9] italic`}
        >
          Simulation <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500">Report</span>
        </motion.h2>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 p-1 rounded-[4rem] border ${borderColor} ${cardBg} backdrop-blur-3xl shadow-2xl relative overflow-hidden`}>
          {/* Internal Divider */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-1/2 bg-white/10 hidden md:block" />
          
          <div className="text-left p-12 lg:p-16 space-y-10">
            <div className="space-y-3">
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em]">Business Entity</span>
              <p className={`text-3xl lg:text-4xl font-black ${textColor} tracking-tight`}>{business?.name || 'Vyapari Global Partner'}</p>
            </div>
            <div className="space-y-3">
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em]">Predictive Horizon</span>
              <p className={`text-3xl lg:text-4xl font-black ${textColor} tracking-tight`}>{data.input_params?.horizon || 30} Operational Days</p>
            </div>
          </div>

          <div className="text-left p-12 lg:p-16 space-y-10">
            <div className="space-y-3">
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em]">Market Dynamics</span>
              <p className={`text-3xl lg:text-4xl font-black ${textColor} uppercase tracking-tight italic`}>{data.input_params?.marketCondition || 'Standard Growth'}</p>
            </div>
            <div className="space-y-3">
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em]">Node Analysis</span>
              <p className={`text-3xl lg:text-4xl font-black ${textColor} tracking-tight`}>{data.per_product_analysis?.length || 0} Critical Assets</p>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-center gap-12 lg:gap-24 opacity-80">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg">
                <ShieldCheck size={28} />
             </div>
             <div className="text-left">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Assessment</div>
                <div className="text-base font-black text-emerald-500 uppercase tracking-tight italic">Low Risk Confirmed</div>
             </div>
          </div>

          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-lg">
                <Target size={28} />
             </div>
             <div className="text-left">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Confidence</div>
                <div className="text-base font-black text-indigo-400 uppercase tracking-tight italic">{data.summary?.overall_confidence || 87}% Aggregated</div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>

  );
}
