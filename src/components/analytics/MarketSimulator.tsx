import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Zap, 
  RefreshCw,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MarketSimulator() {
  const [scenario, setScenario] = useState({
    priceChange: 0,
    costChange: 0,
    demandShift: 0,
    competitionLevel: 'medium'
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Mock Simulation Logic
      const baseProfit = 150000;
      const profitDelta = (scenario.priceChange * 1000) - (scenario.costChange * 800) + (scenario.demandShift * 500);
      const newProfit = baseProfit + profitDelta;
      
      setResults({
        projectedProfit: newProfit,
        profitChange: ((newProfit - baseProfit) / baseProfit) * 100,
        riskScore: scenario.competitionLevel === 'high' ? 85 : 45,
        confidence: 92
      });
      setIsSimulating(false);
      toast.success("Market Simulation Complete");
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md text-white flex items-center justify-center rounded-2xl border border-white/20">
              <BarChart3 size={28} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">What-If Lab</h1>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest pl-1">Generative Market Simulation Engine</p>
        </div>
        <div className="relative z-10 flex items-center gap-4 text-white/40 font-black text-[10px] uppercase tracking-widest">
           <span className="flex items-center gap-2 text-indigo-400"><Layers size={14} /> Monte Carlo Analysis</span>
           <span className="w-[1px] h-4 bg-white/10" />
           <span className="flex items-center gap-2 text-emerald-400"><Zap size={14} /> AI Optimized</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-8">
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Simulation Parameters</h3>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                       <span>Price Sensitivity</span>
                       <span className={scenario.priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{scenario.priceChange}%</span>
                    </div>
                    <input 
                      type="range" min="-20" max="20" step="1"
                      value={scenario.priceChange}
                      onChange={(e) => setScenario({...scenario, priceChange: parseInt(e.target.value)})}
                      className="w-full accent-indigo-600"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                       <span>COGS Inflation</span>
                       <span className="text-rose-500">+{scenario.costChange}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="30" step="1"
                      value={scenario.costChange}
                      onChange={(e) => setScenario({...scenario, costChange: parseInt(e.target.value)})}
                      className="w-full accent-rose-500"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                       <span>Demand Shift</span>
                       <span className="text-indigo-600">{scenario.demandShift}%</span>
                    </div>
                    <input 
                      type="range" min="-50" max="50" step="5"
                      value={scenario.demandShift}
                      onChange={(e) => setScenario({...scenario, demandShift: parseInt(e.target.value)})}
                      className="w-full accent-indigo-600"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Competition Density</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['low', 'medium', 'high'].map(l => (
                          <button 
                            key={l}
                            onClick={() => setScenario({...scenario, competitionLevel: l})}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${scenario.competitionLevel === l ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                          >
                             {l}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>

              <button 
                onClick={runSimulation}
                disabled={isSimulating}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                 {isSimulating ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                 {isSimulating ? "Synthesizing Future..." : "Project Outcomes"}
              </button>
           </div>
        </div>

        {/* RESULTS */}
        <div className="lg:col-span-8">
           <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 min-h-[500px] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                 {!results && !isSimulating && (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6 max-w-sm"
                    >
                       <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-300 mx-auto">
                          <BarChart3 size={40} />
                       </div>
                       <h4 className="text-xl font-black text-slate-900 uppercase">Awaiting Strategy</h4>
                       <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                          Adjust the market variables on the left to see how your business profit and risk profile will evolve over the next quarter.
                       </p>
                    </motion.div>
                 )}

                 {isSimulating && (
                    <motion.div 
                      key="simulating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                       <div className="flex gap-2">
                          {[0, 1, 2].map(i => (
                             <motion.div 
                               key={i}
                               animate={{ height: [20, 60, 20] }}
                               transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                               className="w-4 bg-indigo-500 rounded-full"
                             />
                          ))}
                       </div>
                       <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Processing 10,000 Iterations...</p>
                    </motion.div>
                 )}

                 {results && !isSimulating && (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                       <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl text-left">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Projected Profit (Q3)</span>
                          <div className="text-4xl font-black text-slate-900">₹{results.projectedProfit.toLocaleString()}</div>
                          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${results.profitChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {results.profitChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                             {results.profitChange.toFixed(1)}% Variance
                          </div>
                       </div>

                       <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl text-left">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Risk Profile Score</span>
                          <div className="text-4xl font-black text-slate-900">{results.riskScore}/100</div>
                          <div className="mt-6 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${results.riskScore}%` }}
                               className={`h-full ${results.riskScore > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                             />
                          </div>
                       </div>

                       <div className="md:col-span-2 bg-slate-900 text-white p-8 rounded-[2rem] text-left relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8">
                             <Info size={24} className="text-white/20" />
                          </div>
                          <h5 className="font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                             <Zap size={16} className="text-neon" /> Strategic Advice
                          </h5>
                          <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">
                             {results.profitChange > 0 
                               ? "Your pricing strategy is resilient. Increasing prices by " + scenario.priceChange + "% in the current demand climate will likely capture additional margin without significant churn."
                               : "High risk detected. The combination of cost inflation and competition density makes this move dangerous. Focus on cost optimization before price adjustments."}
                          </p>
                          <button className="flex items-center gap-2 text-neon text-[10px] font-black uppercase tracking-widest hover:translate-x-2 transition-transform">
                             Export Decision Briefing <ArrowRight size={14} />
                          </button>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
