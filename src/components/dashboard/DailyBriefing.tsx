import { motion } from "motion/react";
import { Share2, Brain, Zap, TrendingUp, AlertCircle } from "lucide-react";

interface Insight {
  title: string;
  insight: string;
  impact: string;
  icon: string;
}

export function DailyBriefing({ insights = [], loading = false }: { insights?: any, loading?: boolean }) {
  // Robust data normalization
  let safeInsights: Insight[] = [];
  if (Array.isArray(insights)) {
    safeInsights = insights;
  } else if (insights && typeof insights === 'object') {
    if (Array.isArray(insights.ruleInsights)) safeInsights = insights.ruleInsights;
    else if (Array.isArray(insights.insights)) safeInsights = insights.insights;
    else if (insights.title) safeInsights = [insights as Insight];
  }

  // Map ruleInsights (title, body) to Insight (title, insight) if needed
  safeInsights = safeInsights.map(i => ({
    ...i,
    insight: (i as any).insight || (i as any).body || 'No detail available'
  }));

  if (loading) {
    return (
      <div className="brutal-card bg-slate-900 text-white p-6 md:p-8 animate-pulse shadow-[8px_8px_0px_rgba(99,102,241,0.2)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/10" />
          <div className="h-4 bg-white/10 w-48 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-white/10 w-full rounded" />
          <div className="h-3 bg-white/10 w-5/6 rounded" />
        </div>
      </div>
    );
  }

  if (safeInsights.length === 0) return null;

  const getIcon = (iconStr: string) => {
    if (iconStr?.includes('📈') || iconStr?.includes('Trending')) return <TrendingUp size={18} />;
    if (iconStr?.includes('⚠️') || iconStr?.includes('Alert')) return <AlertCircle size={18} />;
    if (iconStr?.includes('⚡') || iconStr?.includes('Zap')) return <Zap size={18} />;
    return <Brain size={18} />;
  };

  return (
    <div className="bg-slate-900 !p-12 relative overflow-hidden shadow-2xl rounded-[3rem]">
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover/hero:scale-110 transition-transform duration-700">
            <Brain className="text-white" size={36} />
          </div>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-black text-white">
                Smart Business <span className="text-indigo-400">Tips</span>
              </h2>
            </div>
            <p className="text-slate-400 text-sm font-medium">Daily insights powered by your business data</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {[
            { label: "STATUS", value: "SECURE", color: "text-emerald-400" },
            { label: "SPEED", value: "FAST", color: "text-indigo-400" }
          ].map(d => (
            <div key={d.label} className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{d.label}</div>
              <div className={`text-xs font-black ${d.color} tracking-tight`}>{d.value}</div>
            </div>
          ))}
          
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const text = safeInsights.map(i => `📍 *${i.title.toUpperCase()}*\n${i.insight}`).join('\n\n');
              const header = `💎 *VYAPARI EXECUTIVE BRIEFING*\n_Neural insights for your business growth_\n\n`;
              window.open(`https://wa.me/?text=${encodeURIComponent(header + text)}`, '_blank');
            }}
            className="px-8 py-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-600/20 hover:bg-indigo-500"
          >
            <Share2 size={16} />
            <span>Share To WhatsApp</span>
          </motion.button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10 mt-16">
        {safeInsights.map((item, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.15, type: "spring", stiffness: 100 }}
            key={idx} 
            className="group relative p-8 bg-white/5 border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.07] transition-all duration-500 rounded-[2.5rem] overflow-hidden"
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:to-indigo-500/5 transition-all duration-500" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700 shadow-inner">
                {getIcon(item.icon)}
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border backdrop-blur-md ${
                item.impact === 'High' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 
                item.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}>
                {item.impact}_Impact
              </div>
            </div>

            <h3 className="font-black text-lg uppercase tracking-tight mb-4 group-hover:text-indigo-400 transition-colors leading-none relative z-10">{item.title}</h3>
            <p className="text-[12px] font-bold text-slate-400 leading-relaxed group-hover:text-slate-100 transition-colors relative z-10">{item.insight}</p>
            
            <div className="mt-8 flex items-center justify-between relative z-10">
               <div className="h-[2px] flex-1 bg-white/5 relative overflow-hidden">
                 <motion.div 
                   initial={{ x: "-100%" }}
                   whileInView={{ x: "100%" }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 bg-indigo-500/40 w-1/3"
                 />
               </div>
               <div className="text-[8px] font-black text-indigo-500/50 uppercase ml-4 tracking-widest">Checking Data...</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
