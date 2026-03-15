import { useState, useEffect } from "react";
import {
  ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line, ResponsiveContainer
} from "recharts";
import { C, forecastData } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, SectionHeader, OrangeBtn } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";

export default function Prediction() {
  const bp = useBreakpoint();
  const [step, setStep] = useState(1);
  const [newPrice, setNewPrice] = useState(1100);
  const [horizon, setHorizon] = useState("1 month");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setStep(3);
    }, 2000);
  };

  const demandInsights = [
    { item: "Organic Milk", trend: "up", change: "+12%", reason: "Seasonal shift" },
    { item: "Whole Wheat Bread", trend: "down", change: "-5%", reason: "Competitor promotion" },
    { item: "Greek Yogurt", trend: "up", change: "+24%", reason: "Health trend viral" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center gap-0 overflow-x-auto pb-4 custom-scrollbar">
        {[{ n: 1, label: "Configure" }, { n: 2, label: "Review" }, { n: 3, label: "Results" }].map((s, i) => (
          <div key={s.n} className="flex items-center flex-shrink-0">
            <motion.div
              onClick={() => setStep(s.n)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center gap-3 cursor-pointer px-6 py-3 border-2 transition-all
                ${step === s.n ? 'bg-ink text-white border-ink' : step > s.n ? 'bg-neon/10 text-neon border-neon' : 'bg-white text-ink/40 border-ink/10'}
              `}
            >
              <span className={`
                w-6 h-6 flex items-center justify-center text-[10px] font-black border-2
                ${step === s.n ? 'bg-white text-ink border-white' : step > s.n ? 'bg-neon text-white border-neon' : 'bg-ink/5 text-ink/40 border-ink/10'}
              `}>{step > s.n ? "✓" : s.n}</span>
              <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
            </motion.div>
            {i < 2 && <div className={`w-12 h-1 border-b-2 ${step > s.n ? 'border-neon' : 'border-ink/10'}`} />}
          </div>
        ))}
        <div className="ml-auto flex gap-3 pl-8">
          {step > 1 && <button onClick={() => setStep((s: any) => s - 1)} className="brutal-btn !bg-white !text-ink border-2 border-ink !py-2">BACK</button>}
          {step < 3 && (
            <button 
              onClick={step === 2 ? handleRunSimulation : () => setStep((s: any) => s + 1)} 
              disabled={isSimulating}
              className="brutal-btn !py-2"
            >
              {isSimulating ? "SIMULATING_NEURAL_PATH..." : step === 2 ? "RUN_SIMULATION" : "NEXT_STEP"}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="brutal-card bg-white">
              <h3 className="text-lg font-black tracking-tight uppercase mb-8 border-b-2 border-ink pb-2">Product_Configuration</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2 block">Select_Target_Entity</label>
                  <select className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10 transition-colors">
                    <option>iPhone 15 Pro (EL-001)</option>
                    <option>Nike Air Max (CL-204)</option>
                    <option>Organic Groceries (GR-500)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2 block">Price_Adjustment (₹) — Current: ₹1,000</label>
                  <div className="flex items-center gap-6 p-4 bg-ink/5 border-2 border-ink">
                    <input type="range" min={500} max={2000} value={newPrice}
                      onChange={e => setNewPrice(Number(e.target.value))}
                      className="flex-1 accent-ink" />
                    <span className="text-2xl font-black tracking-tighter text-ink min-w-[100px] text-right">₹{newPrice}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="brutal-card bg-white">
              <h3 className="text-lg font-black tracking-tight uppercase mb-8 border-b-2 border-ink pb-2">Simulation_Parameters</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-ink/40 uppercase tracking-widest mb-4 block">Time_Horizon_Window</label>
                  <div className="flex gap-3">
                    {["1 week", "1 month", "3 months"].map(h => (
                      <button 
                        key={h} 
                        onClick={() => setHorizon(h)} 
                        className={`
                          flex-1 py-3 border-2 text-[10px] font-black uppercase tracking-widest transition-all
                          ${horizon === h ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink/10 hover:border-ink'}
                        `}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-ink text-white p-4 border-l-4 border-neon">
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    💡 Neural network processing: Longer horizons incorporate multi-seasonal cycles but increase variance bands.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div className="brutal-card bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-4 border-ink pb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Simulation_Summary</h2>
                  <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-2">Verify neural scan parameters before execution</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Target Product", val: "iPhone 15 Pro", icon: "📱" },
                  { label: "Price Change", val: `₹1,000 → ₹${newPrice}`, icon: "💰" },
                  { label: "Horizon", val: horizon, icon: "📅" },
                  { label: "Model Type", val: "LSTM Neural Network", icon: "🧠" },
                ].map(item => (
                  <div key={item.label} className="p-6 border-2 border-ink bg-ink/5 group hover:bg-ink hover:text-white transition-colors">
                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                    <div className="text-[10px] font-black text-ink/40 group-hover:text-white/40 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-sm font-black uppercase tracking-tight">{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Expected Revenue Change", value: "+₹45,000", pct: "+12%", color: '#10B981', icon: "📈" },
                { label: "Expected Profit Change", value: "+₹12,000", pct: "+8%", color: '#3B82F6', icon: "💹" },
                { label: "Risk Score", value: "3.2/10", pct: "Low", color: '#10B981', icon: "🛡️" },
                { label: "Confidence Level", value: "87%", pct: "High", color: '#FF6B35', icon: "🎯" },
              ].map(m => (
                <div key={m.label} className="brutal-card bg-white text-center group hover:bg-ink hover:text-white transition-colors">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
                  <div className="text-[10px] font-black text-ink/40 group-hover:text-white/40 uppercase tracking-widest mb-2">{m.label}</div>
                  <div className="text-2xl font-black tracking-tighter" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: m.color }}>{m.pct}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 brutal-card bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-4 border-ink pb-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase leading-none">Revenue_Trajectory_Forecast</h2>
                    <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-2">Current vs. Projected neural output</p>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 900 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickFormatter={v => `₹${v / 1000}K`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff', borderRadius: '0px' }}
                        itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                        formatter={(v: any) => v ? `₹${v.toLocaleString("en-IN")}` : "—"} 
                      />
                      <Legend iconType="rect" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                      <Line dataKey="actual" name="Actual" stroke="#3B82F6" strokeWidth={4} dot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
                      <Line dataKey="predicted" name="Predicted" stroke="#FF6B35" strokeWidth={4} strokeDasharray="8 4" dot={{ r: 6, fill: '#FF6B35', strokeWidth: 2, stroke: '#fff' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="brutal-card bg-white">
                <h3 className="text-lg font-black tracking-tight uppercase mb-8 border-b-2 border-ink pb-2">AI_Demand_Insights</h3>
                <div className="space-y-4">
                  {demandInsights.map((d, i) => (
                    <motion.div
                      key={d.item}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-4 border-2 border-ink bg-ink/5 border-l-8 ${d.trend === "up" ? 'border-l-green-500' : 'border-l-red-500'} group hover:bg-ink hover:text-white transition-colors`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black uppercase tracking-tight">{d.item}</span>
                        <span className={`text-xs font-black ${d.trend === "up" ? 'text-green-500' : 'text-red-500'}`}>{d.change}</span>
                      </div>
                      <div className="text-[10px] font-bold text-ink/40 group-hover:text-white/40 uppercase tracking-widest">{d.reason}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
