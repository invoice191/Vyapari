import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, RotateCcw, Save, Download, 
  TrendingUp, TrendingDown, AlertCircle, 
  HelpCircle, Zap, Clock, Calculator
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Legend 
} from 'recharts';
import { useData } from '../../hooks/useData';
import { runSimulation, SCENARIO_PRESETS } from '../../services/dss/whatIfSimulator';
import { SimulationParams, SimulationResult, EngineInput } from '../../services/dss/types';
import rules from '../../services/dss/rules.json';
import { Card, SectionHeader, ActionBtn as Button } from '../common/UI';
import PresentationMode from './simulation/PresentationMode';

export default function WhatIfSimulator() {
  const { data: products } = useData<any>('products');
  const { data: invoices } = useData<any>('invoices');
  const [params, setParams] = useState<SimulationParams>({
    label: "Custom Scenario",
    priceChangePct: 0,
    footfallChangePct: 0,
    costChangePct: 0,
    newProductRevenue: 0,
    discountCampaignPct: 0,
    periods: 3,
    baselineMonths: 3
  });
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);

  useEffect(() => {
    const input: EngineInput = {
      inventory: products,
      stockLogs: [],
      sales: invoices.map(i => ({ id: i.id, timestamp: i.created_at || '', amount: i.total_amount || 0, item_ids: [] })),
      invoices: invoices,
      ledgerEntries: [],
      rules: rules,
      analysisDate: new Date(),
    };

    const timer = setTimeout(() => {
      setLoading(true);
      const res = runSimulation(params, input);
      setResult(res);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [params, products, invoices]);

  const applyPreset = (id: string) => {
    const preset = SCENARIO_PRESETS[id];
    if (preset) {
      setParams(prev => ({ ...prev, ...preset }));
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="bg-slate-900 text-white rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
         <div className="relative z-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Laboratory Module</h2>
            <h1 className="text-4xl font-black tracking-tight mb-4 uppercase">What-If <span className="text-indigo-400">Simulator</span></h1>
            <p className="text-slate-300 font-medium max-w-xl text-base">Test business hypotheses before committing resources. Our recursive engine models ripple effects across inventory, price, and volume.</p>
            
            <div className="flex flex-wrap gap-4 mt-8">
               {Object.entries(SCENARIO_PRESETS).map(([id, preset]) => (
                  <button 
                    key={id}
                    onClick={() => applyPreset(id)}
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-500 hover:border-indigo-400 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 group"
                  >
                    <Zap size={14} className="text-indigo-400 group-hover:text-white" /> {preset.label}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* -- Control Panel -- */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Simulation Controls</h4>
                <button onClick={() => setParams({
                    label: "Custom Scenario",
                    priceChangePct: 0,
                    footfallChangePct: 0,
                    costChangePct: 0,
                    newProductRevenue: 0,
                    discountCampaignPct: 0,
                    periods: 3,
                    baselineMonths: 3
                })} className="text-slate-400 hover:text-indigo-600"><RotateCcw size={16}/></button>
              </div>

              <div className="space-y-10">
                 <SimulationSlider 
                    label="Price Adjustment" 
                    value={params.priceChangePct} 
                    min={-50} max={50} unit="%"
                    onChange={(v) => setParams(p => ({ ...p, priceChangePct: v }))} 
                 />
                 <SimulationSlider 
                    label="Footfall Variance" 
                    value={params.footfallChangePct} 
                    min={-50} max={100} unit="%"
                    onChange={(v) => setParams(p => ({ ...p, footfallChangePct: v }))} 
                 />
                 <SimulationSlider 
                    label="Operating Cost Delta" 
                    value={params.costChangePct} 
                    min={-20} max={50} unit="%"
                    onChange={(v) => setParams(p => ({ ...p, costChangePct: v }))} 
                 />
                 <SimulationSlider 
                    label="Discount Intensity" 
                    value={params.discountCampaignPct} 
                    min={0} max={40} unit="%"
                    onChange={(v) => setParams(p => ({ ...p, discountCampaignPct: v }))} 
                 />
                 
                 <div className="pt-4 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Forecast Horizon</label>
                    <div className="grid grid-cols-3 gap-2">
                       {[1, 3, 6].map(m => (
                         <button 
                            key={m}
                            onClick={() => setParams(p => ({ ...p, periods: m }))}
                            className={`py-3 rounded-xl text-xs font-bold border transition-all ${params.periods === m ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}
                         >
                           {m} Months
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="!bg-slate-950 !border-white/5 p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">Ripple Effect Analysis</h4>
              <div className="space-y-4">
                 {result?.rippleEffects.map((effect, i) => (
                    <div key={i} className="flex gap-4 items-start">
                       <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${effect.severity === 'critical' ? 'bg-rose-500' : effect.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                       <p className="text-xs text-slate-400 font-medium leading-relaxed">{effect.description}</p>
                    </div>
                 ))}
                 {(!result?.rippleEffects.length) && <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest text-center py-4">No major ripple effects detected</p>}
              </div>
           </Card>
        </div>

        {/* -- Results Panel -- */}
        <div className="lg:col-span-8 space-y-8">
           <div className="grid grid-cols-3 gap-6">
              <ResultMetric label="Revenue Shift" value={result?.delta.revenueChange || 0} pct={result?.delta.revenueChangePct || 0} unit="Rs." />
              <ResultMetric label="Profit Delta" value={result?.delta.profitChange || 0} pct={result?.delta.profitChangePct || 0} unit="Rs." />
              <ResultMetric label="Strategic ROI" value={result?.delta.roi || 0} pct={0} unit="x" hidePct />
           </div>

           <Card className="p-8">
              <div className="flex justify-between items-center mb-10">
                 <SectionHeader title="Projection Matrix" subtitle="Animated model comparing baseline vs simulated trajectory" />
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 rounded-sm" /> <span className="text-[10px] font-bold text-slate-500 uppercase">Baseline</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-sm" /> <span className="text-[10px] font-bold text-slate-500 uppercase">Simulated</span></div>
                 </div>
              </div>

              <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result?.monthly || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                       />
                       <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                          tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}K`}
                       />
                       <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-white/10">
                                  <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">{payload[0].payload.month}</div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-bold text-white flex justify-between gap-8">
                                      Baseline: <span className="text-slate-400">Rs.{payload[0].value?.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs font-bold text-indigo-400 flex justify-between gap-8">
                                      Simulated: <span>Rs.{payload[1].value?.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                       />
                       <Bar dataKey="current.revenue" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
                       <Bar dataKey="simulated.revenue" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-xl shadow-indigo-500/20">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <Calculator size={32} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black tracking-tight">Break-even Horizon: {result?.delta.breakEvenMonths} Months</h4>
                    <p className="text-white/60 text-sm font-medium">Predicted timeline to recover strategic investment costs.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                <Button className="!border-white/20 !text-white hover:!bg-white/10 !px-8 !py-4 !rounded-2xl font-black uppercase tracking-widest text-[10px]">
                   Download Detailed Report
                </Button>
                <Button 
                  onClick={() => setShowPresentation(true)}
                  className="!bg-white !text-indigo-600 hover:!bg-indigo-50 !px-8 !py-4 !rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
                >
                   Present Results
                </Button>
              </div>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {showPresentation && result && (
          <PresentationMode 
            data={{
              ...result,
              summary: {
                headline: `Projecting Rs.${result.delta.revenueChange.toLocaleString()} revenue shift with ${result.delta.roi}x ROI.`,
                overall_confidence: 94,
                potential_revenue_change_percent: result.delta.revenueChangePct,
                potential_profit_change_percent: result.delta.profitChangePct
              },
              current_scenario: {
                total_revenue: result.delta.revenueChange / ((result.delta.revenueChangePct || 1) / 100)
              },
              simulated_scenario: {
                total_revenue_projected: (result.delta.revenueChange / ((result.delta.revenueChangePct || 1) / 100)) + result.delta.revenueChange
              },
              input_params: {
                horizon: params.periods * 30,
                marketCondition: 'Normal'
              }
            }} 
            business={{ name: 'Vyapari Partner' }} 
            onExit={() => setShowPresentation(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SimulationSlider({ label, value, min, max, unit, onChange }: { label: string, value: number, min: number, max: number, unit: string, onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</label>
          <span className={`text-sm font-black tracking-tighter ${value > 0 ? 'text-emerald-500' : value < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
            {value > 0 ? '+' : ''}{value}{unit}
          </span>
       </div>
       <input 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
       />
    </div>
  );
}

function ResultMetric({ label, value, pct, unit, hidePct = false }: { label: string, value: number, pct: number, unit: string, hidePct?: boolean }) {
  const positive = value >= 0;
  return (
    <Card className="p-8 group hover:border-indigo-500/30 transition-all duration-500">
       <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">{label}</div>
       <div className="flex items-end gap-3 mb-2">
          <div className={`text-4xl font-black tracking-tighter ${positive ? 'text-slate-900' : 'text-rose-600'}`}>
             {unit === 'Rs.' ? 'Rs.' : ''}{(Math.abs(value)/1000).toFixed(1)}K{unit === 'x' ? 'x' : ''}
          </div>
          {!hidePct && (
            <div className={`text-xs font-black mb-1.5 flex items-center gap-1 ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
               {positive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
               {Math.abs(pct).toFixed(1)}%
            </div>
          )}
       </div>
    </Card>
  );
}
