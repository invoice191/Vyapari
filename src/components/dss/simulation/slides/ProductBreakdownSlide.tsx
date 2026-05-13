import React from 'react';
import { motion } from 'motion/react';
import { Box, TrendingUp, ShieldCheck } from 'lucide-react';
import { Theme } from '../PresentationMode';

interface SlideProps {
  data: any;
  theme: Theme;
}

export default function ProductBreakdownSlide({ data, theme }: SlideProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-50';

  const rows = data.per_product_analysis || [];

  return (
    <div className="w-full h-full flex flex-col px-8 py-6 overflow-hidden min-h-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className={`text-4xl font-black ${textColor} uppercase tracking-tight mb-2 italic`}>Product Analysis</h2>
        <div className="w-32 h-1.5 bg-indigo-500 rounded-full" />
      </motion.div>

      <div className={`flex-1 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-xl overflow-hidden flex flex-col min-h-0`}>
        <div className="p-6 border-b border-white/5 bg-black/10 grid grid-cols-6 gap-6 shrink-0">
          <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Node</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Baseline Rs.</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Simulated Rs.</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Rev Change</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Risk</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {rows.map((row: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={`px-6 py-3 grid grid-cols-6 gap-6 border-b ${borderColor} items-center hover:bg-white/5 transition-colors group`}
            >
              <div className="col-span-2 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} flex items-center justify-center text-indigo-400`}>
                  <Box size={18} />
                </div>
                <div className={`text-sm font-black ${textColor} uppercase truncate`}>{row.name}</div>
              </div>
              <div className={`text-sm font-black ${textColor} text-center opacity-60`}>Rs.{row.current_price?.toLocaleString()}</div>
              <div className={`text-sm font-black text-indigo-400 text-center italic`}>Rs.{row.simulated_price?.toLocaleString()}</div>
              <div className={`text-sm font-black text-emerald-400 text-center`}>+Rs.{(row.projected_revenue - row.current_revenue).toLocaleString()}</div>
              <div className="flex justify-center">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={14} />
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className={`p-6 grid grid-cols-6 gap-6 bg-indigo-600 text-white items-center sticky bottom-0`}
          >
            <div className="col-span-2 text-sm font-black uppercase tracking-widest">Aggregate Potential</div>
            <div className="text-center opacity-60">-</div>
            <div className="text-center opacity-60">-</div>
            <div className="text-center text-lg font-black italic">+Rs.{(data.simulated_scenario?.total_revenue_projected - data.current_scenario?.total_revenue).toLocaleString()}</div>
            <div className="flex justify-center">
              <div className="px-3 py-1 rounded-lg bg-white/20 text-white text-[10px] font-black uppercase">SAFE</div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-4 flex items-center justify-center gap-4 shrink-0"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">All strategic nodes show positive revenue impact</span>
      </motion.div>
    </div>
  );
}
