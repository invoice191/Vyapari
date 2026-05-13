import React from 'react';
import { motion } from 'motion/react';
import { Zap, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Theme } from '../PresentationMode';

interface SlideProps {
  data: any;
  theme: Theme;
}

export default function RecommendationsSlide({ data, theme }: SlideProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-50';

  const recs = data.recommendations || [];

  return (
    <div className="w-full h-full flex flex-col px-8 py-6 overflow-hidden min-h-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 mb-2">
           <Zap className="text-indigo-500 animate-pulse" size={32} />
           <h2 className={`text-4xl font-black ${textColor} uppercase tracking-tight italic`}>AI Recommendations</h2>
        </div>
        <div className="w-32 h-1.5 bg-indigo-500 rounded-full" />
      </motion.div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-0">
        {recs.slice(0, 3).map((rec: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + (i * 0.2) }}
            className={`p-6 lg:p-8 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-xl flex flex-col relative group overflow-hidden hover:border-indigo-500/50 transition-all`}
          >
            <div className="absolute top-0 right-0 p-8 text-indigo-500/5 pointer-events-none group-hover:text-indigo-500/10 transition-colors">
              <Sparkles size={120} />
            </div>

            <div className="flex justify-between items-start mb-4 lg:mb-8">
              <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>
                {i === 0 ? 'High Priority' : 'Strategic'}
              </div>
              <div className="text-slate-500">
                 {i === 0 ? <Zap size={20} /> : <ShieldCheck size={20} />}
              </div>
            </div>

            <h3 className={`text-lg font-black ${textColor} uppercase tracking-tight mb-2 leading-tight`}>{rec.title}</h3>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic mb-4 lg:mb-8 pr-2">"{rec.description || rec.expected_impact}"</p>

            <div className="mt-auto space-y-4">
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Expected Impact</span>
                 <span className="text-sm font-black text-emerald-400 italic">Rs.{rec.rupee_impact?.toLocaleString() || 'High'}</span>
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group-hover:bg-indigo-500 transition-all">
                Implement Now <ArrowRight size={12} />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Watch Out / Warning Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className={`p-6 lg:p-8 rounded-[2.5rem] border-2 border-amber-500/30 bg-amber-500/5 backdrop-blur-xl flex flex-col relative overflow-hidden hidden lg:flex`}
        >
          <div className="flex items-center gap-4 text-amber-500 mb-8">
            <AlertCircle size={24} />
            <h3 className="text-sm font-black uppercase tracking-[0.3em]">Watch Points</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
               <div className={`text-[11px] font-black ${textColor} uppercase`}>Monitor Price Sensitivity</div>
               <p className="text-[10px] font-bold text-slate-500 italic">Track sales volume for first 7 days. Revert if drop exceeds 15%.</p>
            </div>
            <div className="space-y-2">
               <div className={`text-[11px] font-black ${textColor} uppercase`}>Competitor Reaction</div>
               <p className="text-[10px] font-bold text-slate-500 italic">Watch local pricing for similar SKUs in your vicinity.</p>
            </div>
          </div>

          <div className="mt-auto p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center">
             <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Caution: Market Volatility</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
