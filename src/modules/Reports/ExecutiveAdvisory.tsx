import { motion } from "motion/react";
import { BrainCircuit, TrendingUp, Target, AlertTriangle, Zap, Copy, Share2 } from "lucide-react";
import { Badge } from "../../components/common/UI";

interface ExecutiveAdvisoryProps {
  advisory: string[];
  loading?: boolean;
}

export default function ExecutiveAdvisory({ advisory, loading }: ExecutiveAdvisoryProps) {
  const copyToWhatsApp = () => {
    const text = `*Vyapari Executive Advisory*\n\n${advisory.map((point, i) => `${i + 1}. ${point}`).join('\n\n')}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = () => {
    const text = advisory.map((point, i) => `${i + 1}. ${point}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden shadow-2xl animate-pulse">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0" />
          <div className="space-y-6 flex-1 w-full">
            <div className="h-8 bg-slate-800 rounded-xl w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!advisory || advisory.length === 0) return null;

  const icons = [TrendingUp, Target, AlertTriangle, Zap];
  const labels = ["Core Trend", "Revenue Opportunity", "GST/Compliance Risk", "Operational Vector"];
  const colors = ["text-blue-400", "text-green-400", "text-orange-400", "text-neon"];

  return (
    <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden shadow-2xl group border border-white/5">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-neon/5 rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3 group-hover:bg-neon/10 transition-all duration-1000" />
      
      <div className="flex flex-col lg:flex-row items-start gap-8 relative z-10">
        <div className="w-20 h-20 rounded-xl bg-neon text-white flex items-center justify-center flex-shrink-0 shadow-2xl shadow-neon/30 group-hover:scale-110 transition-transform duration-700">
          <BrainCircuit size={40} />
        </div>

        <div className="flex-1 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <Badge status="Smart Advisory" />
                 <div className="w-1 h-1 rounded-full bg-white/20"></div>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Executive Summary</span>
              </div>
              <h4 className="text-3xl lg:text-4xl font-black tracking-tighter text-white leading-tight uppercase italic">
                Strategic <span className="text-neon">Intelligence</span>
              </h4>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={copyToClipboard}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
              >
                <Copy size={14} /> Copy_Text
              </button>
              <button 
                onClick={copyToWhatsApp}
                className="p-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
              >
                <Share2 size={14} /> WhatsApp_Share
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advisory.map((point, idx) => {
              const Icon = icons[idx] || Zap;
              return (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon/30 transition-all duration-500 items-start group/card"
                >
                  <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${colors[idx]} flex-shrink-0 border border-white/5 group-hover/card:scale-110 transition-all duration-500`}>
                     <Icon size={18} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">{labels[idx]}</div>
                    <span className="text-sm font-bold text-slate-200 leading-relaxed group-hover/card:text-white transition-colors">
                      {point}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
