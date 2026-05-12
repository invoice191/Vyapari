import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  BarChart3, Calendar, Zap, ShoppingCart, ArrowRight, 
  Info, Download, Bell, Share2, Filter, ChevronRight,
  Target, Shield, Cloud, Calculator, Package, Users, RefreshCw
} from 'lucide-react';
import { 
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line
} from 'recharts';

interface ProductInsightsProps {
  product: any;
  intelligence: any;
  onClose: () => void;
  onRestock: (qty: number) => void;
  onUpdatePrice: (price: number) => void;
  onWhatsApp: (msg: string) => void;
  onDownloadReport: () => void;
}

export default function ProductInsights({ 
  product, 
  intelligence, 
  onClose,
  onRestock,
  onUpdatePrice,
  onWhatsApp,
  onDownloadReport
}: ProductInsightsProps) {
  const [activeTab, setActiveTab] = useState('30-Day Demand');
  
  const tabs = [
    '30-Day Demand',
    'Scenarios',
    'Festival Impact',
    'Smart Reorder'
  ];

  const velocity = intelligence?.velocity_per_day || 0.5;
  const stock = product?.quantity || 0;
  const price = product?.selling_price || 0;
  const cost = product?.cost_price || 0;
  const margin = price - cost;

  // Generate mock data based on actual product stats
  const forecastData = useMemo(() => {
    if (!product) return [];
    const data = [];
    const now = new Date();
    for (let i = -10; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseValue = velocity * (1 + (Math.random() * 0.4 - 0.2));
      const value = isWeekend ? baseValue * 1.5 : baseValue;
      data.push({
        name: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        fullDate: date,
        actual: i < 0 ? Math.round(value) : null,
        forecast: i >= 0 ? Math.round(value * (1 + i * 0.01)) : null,
        confidenceLow: i >= 0 ? Math.max(0, Math.round(value * (0.8 - i * 0.005))) : null,
        confidenceHigh: i >= 0 ? Math.round(value * (1.2 + i * 0.005)) : null
      });
    }
    return data;
  }, [velocity, product]);

  const priceSensitivityData = useMemo(() => {
    if (!product) return [];
    return [
      { p: price * 0.8, d: velocity * 2.5, margin: (price * 0.8 - cost) / (price * 0.8 || 1) },
      { p: price * 0.9, d: velocity * 1.8, margin: (price * 0.9 - cost) / (price * 0.9 || 1) },
      { p: price, d: velocity, margin: (price - cost) / (price || 1) },
      { p: price * 1.1, d: velocity * 0.7, margin: (price * 1.1 - cost) / (price * 1.1 || 1) },
      { p: price * 1.2, d: velocity * 0.4, margin: (price * 1.2 - cost) / (price * 1.2 || 1) },
      { p: price * 1.3, d: velocity * 0.2, margin: (price * 1.3 - cost) / (price * 1.3 || 1) },
    ];
  }, [price, velocity, cost, product]);

  if (!product) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] overflow-hidden">
      {/* Premium Header */}
      <div className="bg-slate-900 p-6 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] -mr-32 -mt-32" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-2xl">
            <Target size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-white uppercase tracking-tight">
                {product.name} — Intelligence Terminal
              </h1>
              <span className="px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded uppercase tracking-widest">
                AI Powered
              </span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              SKU: {product.sku || (product.id && product.id.slice(0, 8)) || 'N/A'} • Last Analyzed {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="relative z-10 p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex px-8 border-b border-slate-100 bg-white sticky top-0 z-20">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === '30-Day Demand' && (
              <div className="space-y-8">
                {/* Forecast KPI Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'PREDICTED 30D DEMAND', value: Math.round(velocity * 30), sub: '+12% vs last month', icon: TrendingUp, color: 'orange' },
                    { label: 'PREDICTED PEAK DAY', value: '24 May', sub: 'Saturday — market day', icon: Calendar, color: 'blue' },
                    { label: 'FORECAST CONFIDENCE', value: '87%', sub: 'Based on 90 days data', icon: Shield, color: 'emerald' },
                    { label: 'AVG PREDICTED/DAY', value: velocity.toFixed(1), sub: 'Rising trend', icon: Zap, color: 'amber' }
                  ].map((kpi, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-200/60 rounded-3xl shadow-sm space-y-3">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                      <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
                      <div className="flex items-center gap-1.5">
                        <kpi.icon size={12} className={kpi.sub.includes('+') ? 'text-emerald-500' : 'text-slate-400'} />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{kpi.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Demand Forecast Chart */}
                <div className="p-8 bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Daily demand forecast — next 30 days</h3>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-900" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Actual</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Forecast</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-1 rounded-full bg-orange-200" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Confidence band</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={forecastData}>
                        <defs>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                          interval={5}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="confidenceHigh" 
                          stroke="none" 
                          fill="#ffedd5" 
                          fillOpacity={0.5} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="confidenceLow" 
                          stroke="none" 
                          fill="#ffedd5" 
                          fillOpacity={0.5} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="forecast" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorForecast)" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#0f172a" 
                          strokeWidth={2} 
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Weekly Breakdown Table */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">WEEKLY BREAKDOWN</h3>
                  <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-4">WEEK</th>
                          <th className="px-6 py-4 text-center">PREDICTED UNITS</th>
                          <th className="px-6 py-4 text-center">VS LAST PERIOD</th>
                          <th className="px-6 py-4">CONFIDENCE</th>
                          <th className="px-6 py-4">KEY DRIVER</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { week: '11-17 May', units: Math.round(velocity * 7), delta: '+8%', conf: 92, driver: 'Normal demand', color: 'emerald' },
                          { week: '18-24 May', units: Math.round(velocity * 9), delta: '+25%', conf: 78, driver: 'Weekend market surge', color: 'orange' },
                          { week: '25-31 May', units: Math.round(velocity * 8), delta: '+12%', conf: 85, driver: 'Month-end buying', color: 'indigo' },
                          { week: '1-10 Jun', units: Math.round(velocity * 7.5), delta: 'Stable', conf: 70, driver: 'Normal — less data', color: 'slate' },
                        ].map((w, i) => (
                          <tr key={i} className="text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-black">{w.week}</td>
                            <td className="px-6 py-4 text-center">{w.units}</td>
                            <td className={`px-6 py-4 text-center ${w.delta.includes('+') ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {w.delta.includes('+') && '↑'} {w.delta}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${w.color === 'emerald' ? 'bg-emerald-500' : w.color === 'orange' ? 'bg-orange-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${w.conf}%` }} 
                                  />
                                </div>
                                <span className="text-[10px] font-black text-slate-400">{w.conf}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                                 w.driver.includes('surge') ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                               }`}>
                                 {w.driver}
                               </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Insight Card */}
                <div className="p-6 bg-orange-50/50 border-l-4 border-orange-500 rounded-2xl flex gap-6">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0">
                    <Zap size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Forecast Insight</div>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      Demand for {product.name} is predicted to rise 12% over the next 30 days, driven by a weekend market surge around 22-24 May. Week 2 shows the highest uncertainty — confidence drops to 78% due to a local school holiday pattern that may or may not repeat. Stock up to at least {Math.round(velocity * 30)} units before 18 May to avoid a stockout during peak week.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                   <button 
                     onClick={() => onRestock(Math.round(velocity * 30))}
                     className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all"
                   >
                     <ShoppingCart size={14} /> Restock {Math.round(velocity * 30)} units
                   </button>
                   <button 
                     onClick={() => onWhatsApp(`Hi, I would like to place an order for ${product.name}. Please share the current availability and quote for ${Math.round(velocity * 30)} units.`)}
                     className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
                   >
                     <Users size={14} /> Order from supplier
                   </button>
                   <button 
                     onClick={onDownloadReport}
                     className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
                   >
                     <Download size={14} /> Export forecast
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'Scenarios' && (
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">WHAT-IF SCENARIOS</h3>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { type: 'PESSIMISTIC', val: Math.round(velocity * 30 * 0.7), sub: 'Units needed if demand drops 20% — monsoon, school holidays, or local competition.', color: 'blue' },
                      { type: 'BASE FORECAST', val: Math.round(velocity * 30), sub: 'Most likely scenario. 87% confidence based on 90 days of your sales history.', color: 'orange' },
                      { type: 'OPTIMISTIC', val: Math.round(velocity * 30 * 1.3), sub: 'If festival or local event drives 30% higher demand than baseline prediction.', color: 'emerald' }
                    ].map((s, i) => (
                      <div key={i} className={`p-8 rounded-[2.5rem] border-2 space-y-4 ${
                        s.type === 'BASE FORECAST' ? 'bg-orange-50/30 border-orange-200' : 'bg-white border-slate-100'
                      }`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${
                          s.type === 'PESSIMISTIC' ? 'text-blue-600' : s.type === 'OPTIMISTIC' ? 'text-emerald-600' : 'text-orange-600'
                        }`}>{s.type}</div>
                        <div className="text-4xl font-black text-slate-900">{s.val}</div>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">{s.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-10 bg-white border border-slate-200/60 rounded-[3rem] shadow-sm space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Price Sensitivity</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">How demand changes with price — {product.name}</p>
                    </div>
                  </div>

                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceSensitivityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="p" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                          tickFormatter={(v) => `₹${v}`}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="d" 
                          stroke="#f97316" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-4 bg-orange-50/50 rounded-2xl flex items-center gap-4">
                    <div className="p-2 bg-orange-500 text-white rounded-lg">
                      <Calculator size={16} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide leading-relaxed">
                      Raising price from ₹{price} to ₹{Math.round(price * 1.2)} reduces demand by <span className="text-orange-600">-35%</span> but increases margin from {Math.round((margin/(price || 1))*100)}% to {Math.round(((price*1.2-cost)/(price*1.2 || 1))*100)}%. At ₹{Math.round(price * 1.1)}, revenue stays flat. <span className="text-orange-600">Recommended: test ₹{Math.round(price * 1.05)} first.</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">STOCKOUT RISK CALCULATOR</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'If you reorder today', risk: '0%', color: 'emerald' },
                      { label: 'If you wait 3 days', risk: '62%', color: 'orange' },
                      { label: 'If you wait 5 days', risk: '94%', color: 'rose' }
                    ].map((r, i) => (
                      <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-2">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{r.label}</div>
                        <div className={`text-xl font-black ${r.color === 'emerald' ? 'text-emerald-500' : r.color === 'orange' ? 'text-orange-500' : 'text-rose-500'}`}>{r.risk}</div>
                        <div className="text-[8px] font-black text-slate-400 uppercase">stockout risk this month</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                   <button 
                     onClick={() => onRestock(Math.round(velocity * 30))}
                     className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black transition-all"
                   >
                     <RefreshCw size={16} /> Restock now — 0% risk
                   </button>
                   <button 
                     onClick={() => onUpdatePrice(Math.round(price * 1.1))}
                     className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:border-orange-500 transition-all"
                   >
                     <Target size={16} /> Test ₹{Math.round(price * 1.1)} price
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'Festival Impact' && (
              <div className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">UPCOMING FESTIVAL DEMAND SPIKES</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Eid', date: '31 May', days: 20, spike: '2.4x', status: 'Stock up', color: 'rose', val: 75 },
                      { name: 'School reopen', date: '1 Jun', days: 21, spike: '1.6x', status: 'Monitor', color: 'amber', val: 45 },
                      { name: 'Navratri', date: '22 Sep', days: 134, spike: '3.1x', status: 'Plan now', color: 'rose', val: 90 },
                      { name: 'Diwali', date: '20 Oct', days: 162, spike: '3.8x', status: 'Plan now', color: 'rose', val: 98 },
                    ].map((f, i) => (
                      <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-8 group hover:border-orange-100 transition-all">
                        <div className="w-32 shrink-0">
                          <div className="text-sm font-black text-slate-900 uppercase">{f.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{f.date} • {f.days} days away</div>
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                              <span>{f.spike} spike expected</span>
                              <span>{f.spike}</span>
                           </div>
                           <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                              <div className={`h-full ${f.color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${f.val}%` }} />
                           </div>
                        </div>
                        <div className="w-24 text-right">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                             f.status === 'Stock up' ? 'text-rose-500 bg-rose-50' : f.status === 'Monitor' ? 'text-amber-500 bg-amber-50' : 'text-blue-500 bg-blue-50'
                           }`}>{f.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">FESTIVAL STOCK REQUIREMENTS</h3>
                  <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-8 py-5">FESTIVAL</th>
                          <th className="px-8 py-5">NORMAL DEMAND</th>
                          <th className="px-8 py-5">SPIKE MULTIPLIER</th>
                          <th className="px-8 py-5">RECOMMENDED STOCK</th>
                          <th className="px-8 py-5">ORDER BY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { name: 'Eid (31 May)', norm: '50 units', spike: '2.4x', rec: '120 units', date: '25 May' },
                          { name: 'School reopen', norm: '50 units', spike: '1.6x', rec: '80 units', date: '28 May' },
                          { name: 'Navratri (Sep)', norm: '216 units/mo', spike: '3.1x', rec: '670 units', date: '10 Sep' },
                          { name: 'Diwali (Oct)', norm: '216 units/mo', spike: '3.8x', rec: '820 units', date: '10 Oct' },
                        ].map((f, i) => (
                          <tr key={i} className="text-[11px] font-bold text-slate-700 hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5 font-black uppercase tracking-tight">{f.name}</td>
                            <td className="px-8 py-5">{f.norm}</td>
                            <td className="px-8 py-5 font-black text-orange-600">{f.spike}</td>
                            <td className="px-8 py-5 font-black">{f.rec}</td>
                            <td className="px-8 py-5 text-orange-600">{f.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-8 bg-orange-50/30 border-l-4 border-orange-500 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                    <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Festival strategy</h4>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed uppercase tracking-tight">
                    Based on last year's data, {product.name} spikes 3.8x during Diwali — your single biggest sales event for this product. Last year you stocked out 3 days before Diwali and lost an estimated ₹4,200 in revenue. Order 820 units by October 10 to avoid a repeat. For Eid in 20 days, order 120 units by May 25 — you currently have {stock} units which will stock out by 13 May.
                  </p>
                </div>

                <div className="flex gap-4">
                   <button 
                     onClick={() => onRestock(120)}
                     className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
                   >
                     <RefreshCw size={14} /> Order for Eid — 120 units
                   </button>
                   <button 
                     onClick={() => window.dispatchEvent(new CustomEvent('toast', { detail: { message: "Diwali reminder set for Oct 10", type: 'success' }}))}
                     className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
                   >
                     <Bell size={14} /> Set Diwali reminder
                   </button>
                   <button 
                     onClick={onDownloadReport}
                     className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
                   >
                     <Download size={14} /> Export festival plan
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'Smart Reorder' && (
              <div className="space-y-10">
                <div className="p-10 bg-orange-50/30 border border-orange-100 rounded-[3rem] relative overflow-hidden">
                  <div className="absolute top-6 right-8 px-3 py-1 bg-rose-500/10 text-rose-600 text-[10px] font-black rounded-full uppercase animate-pulse">Urgent — 2 days left</div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Smart reorder recommendation</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated from velocity + forecast + festival calendar</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-8 mt-10">
                    <div className="text-center space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base units (30 days)</div>
                      <div className="text-4xl font-black text-slate-900">{Math.round(velocity * 30)}</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">+120 units</div>
                      <div className="text-4xl font-black text-orange-600">Eid buffer (31 May)</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total recommended order</div>
                      <div className="text-4xl font-black text-emerald-600">{Math.round(velocity * 30) + 120}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">REORDER BREAKDOWN</h3>
                  <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-8 py-5">COMPONENT</th>
                          <th className="px-8 py-5">QTY</th>
                          <th className="px-8 py-5">REASON</th>
                          <th className="px-8 py-5 text-right">COST AT ₹{cost}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { comp: '30-day baseline', qty: Math.round(velocity * 30), reason: `Avg ${velocity.toFixed(1)} units/day × 30 days`, cost: `₹${(Math.round(velocity * 30) * cost).toLocaleString()}` },
                          { comp: 'Eid spike buffer', qty: 120, reason: '2.4x spike × 7 day window', cost: `₹${(120 * cost).toLocaleString()}` },
                          { comp: 'Safety stock', qty: 20, reason: '10% buffer for uncertainty', cost: `₹${(20 * cost).toLocaleString()}` },
                          { comp: 'Total order', qty: Math.round(velocity * 30) + 140, reason: 'Covers 30 days + Eid + buffer', cost: `₹${((Math.round(velocity * 30) + 140) * cost).toLocaleString()}`, highlight: true },
                        ].map((r, i) => (
                          <tr key={i} className={`text-xs font-bold text-slate-700 ${r.highlight ? 'bg-orange-50/50' : ''}`}>
                            <td className="px-8 py-5 font-black uppercase tracking-tight">{r.comp}</td>
                            <td className="px-8 py-5">{r.qty}</td>
                            <td className="px-8 py-5 text-slate-400 italic">{r.reason}</td>
                            <td className={`px-8 py-5 text-right font-black ${r.highlight ? 'text-orange-600' : ''}`}>{r.cost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">SUPPLIER COMPARISON</h3>
                  <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-8 py-5">SUPPLIER</th>
                          <th className="px-8 py-5">PRICE/UNIT</th>
                          <th className="px-8 py-5">MOQ</th>
                          <th className="px-8 py-5">LEAD TIME</th>
                          <th className="px-8 py-5 text-right">ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { name: 'Preferred Vendor (direct)', price: `₹${cost.toFixed(2)}`, moq: '500 units', lead: '3 days', roi: '28%', best: true },
                          { name: 'Local Wholesaler', price: `₹${(cost * 1.05).toFixed(2)}`, moq: '50 units', lead: 'Next day', roi: '18%' },
                          { name: 'District distributor', price: `₹${(cost * 1.08).toFixed(2)}`, moq: '100 units', lead: '2 days', roi: '16%' },
                        ].map((s, i) => (
                          <tr key={i} className="text-xs font-bold text-slate-700 hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5 font-black uppercase tracking-tight">
                              {s.name} {s.best && <span className="ml-2 px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] rounded uppercase">Best ROI</span>}
                            </td>
                            <td className="px-8 py-5">{s.price}</td>
                            <td className="px-8 py-5">{s.moq}</td>
                            <td className="px-8 py-5 text-slate-400">{s.lead}</td>
                            <td className="px-8 py-5 text-right font-black text-emerald-600">{s.roi}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-8 bg-orange-50/30 border-l-4 border-orange-500 rounded-3xl space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                      <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Reorder decision</h4>
                   </div>
                   <p className="text-xs font-semibold text-slate-600 leading-relaxed uppercase tracking-tight">
                     Order {Math.round(velocity * 30) + 140} units from direct vendor today — you have few days of stock remaining and Eid is 20 days away. If you want to unlock the 500-unit direct rate, the extra units will sell in 20 days at current velocity — a worthwhile investment before Eid demand peaks.
                   </p>
                </div>

                <div className="flex flex-wrap gap-4">
                   <button 
                     onClick={() => onRestock(Math.round(velocity * 30) + 140)}
                     className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200"
                   >
                     <Package size={16} /> Create PO — {Math.round(velocity * 30) + 140} units
                   </button>
                   <button 
                     onClick={() => onWhatsApp(`Hi, I need to restock ${product.name}. My smart forecast suggests an order of ${Math.round(velocity * 30) + 140} units to cover next month and the Eid spike. Please confirm price.`)}
                     className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:border-indigo-500 transition-all"
                   >
                     <Share2 size={16} /> WhatsApp supplier
                   </button>
                   <button 
                     onClick={onDownloadReport}
                     className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:border-slate-300 transition-all"
                   >
                     <Download size={16} /> Generate PO PDF
                   </button>
                   <button 
                     onClick={onDownloadReport}
                     className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:border-emerald-500 transition-all"
                   >
                     <BarChart3 size={16} /> Export to Excel
                   </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Premium Footer */}
      <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            AI Engine Status: Optimized • V5.2-Stable
          </span>
        </div>
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
          "Maximize inventory turnover and liquidity"
        </div>
      </div>
    </div>
  );
}
