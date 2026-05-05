import { useState, useEffect } from "react";
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis
} from "recharts";
import { C, salesData as mockSales, categoryData as mockCategories, hourlyData, productMatrix as mockMatrix } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, KPICard, SectionHeader, OrangeBtn } from "../common/UI";
import { getAIInsights } from "../../services/geminiService";
import { motion, AnimatePresence } from "motion/react";
import { analyticsService } from "../../services/analyticsService";

export default function Dashboard() {
  const bp = useBreakpoint();
  const [liveTime, setLiveTime] = useState(new Date());
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Real data states
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    
    const fetchData = async () => {
      try {
        const [salesData, invData] = await Promise.all([
          analyticsService.getSalesSummary(),
          analyticsService.getInventorySummary()
        ]);
        setSales(salesData);
        setInventory(invData);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => clearInterval(t);
  }, []);

  const fetchInsights = async () => {
    setLoadingAI(true);
    const data = { 
      salesData: sales.length > 0 ? sales : mockSales, 
      categoryData: mockCategories, 
      productMatrix: inventory.length > 0 ? inventory : mockMatrix 
    };
    try {
      const insights = await getAIInsights(data);
      setAiInsights(insights);
    } catch (err) {
      console.error("AI Insights error:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (!loading) fetchInsights();
  }, [loading]);

  // Calculate KPIs
  const totalRevenue = sales.reduce((acc, s) => acc + (s.amount || 0), 0);
  const activeOrders = sales.filter(s => {
    const sDate = s.timestamp?.toDate ? s.timestamp.toDate() : new Date();
    return new Date().getTime() - sDate.getTime() < 3600000;
  }).length;
  
  const lowStockCount = inventory.filter(i => i.stock <= i.minStock).length;
  const inventoryHealth = inventory.length > 0 
    ? ((inventory.length - lowStockCount) / inventory.length * 100).toFixed(1) 
    : "100";

  const spark = (base: number) => Array.from({ length: 12 }, (_, i) => ({
    v: base + Math.floor(Math.sin(i * 0.8) * base * 0.15 + Math.random() * base * 0.1)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border-2 border-ink p-4 shadow-[4px_4px_0px_var(--color-ink)]">
        <div className="font-black text-xs uppercase tracking-widest mb-2 border-b border-ink/10 pb-2">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4 text-[10px] font-bold uppercase tracking-tight">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="font-black">₹{p.value?.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* Live Banner */}
      <div className="bg-ink text-white p-10 border-l-[12px] border-neon flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-[12px_12px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-3 h-3 bg-neon animate-ping" />
             <span className="text-[11px] font-black uppercase tracking-[0.5em] text-neon">SYSTEM_STATUS.CRYSTAL_CLEAR</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none italic uppercase">ANALYTICS_V4.0</h1>
        </div>
        <div className="text-right font-mono relative z-10">
          <div className="text-4xl font-black tracking-tighter text-white">{liveTime.toLocaleTimeString("en-IN")}</div>
          <div className="flex items-center gap-3 justify-end mt-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">NEURAL_SYNC: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* AI Strategic Insights */}
      <section className="glass-card !bg-ink/95 border-neon shadow-[12px_12px_0px_var(--color-neon)] mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-neon animate-ping" />
              <h2 className="text-white text-3xl font-black italic tracking-tighter uppercase">Strategic_Intelligence_v4.0</h2>
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Neural_Engine_Active // Real-time_Market_Synthesis</p>
          </div>
          <button 
            onClick={fetchInsights} 
            disabled={loadingAI}
            className="brutal-btn !bg-neon !text-ink !shadow-white disabled:opacity-50"
          >
            {loadingAI ? "SYNTHESIZING..." : "GENERATE_STRATEGY"}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <AnimatePresence mode="wait">
            {loadingAI ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white/5 border border-dashed border-white/20 animate-pulse" />
              ))
            ) : aiInsights.length > 0 ? (
              aiInsights.map((ins, i) => (
                <motion.div 
                  key={ins.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 border-l-4 border-neon bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-neon uppercase tracking-widest">{ins.title}</span>
                    <span className="text-white font-black text-xs font-mono">{ins.impact}_IMPACT</span>
                  </div>
                  <p className="text-white/80 text-xs font-bold leading-relaxed uppercase tracking-tight">{ins.insight}</p>
                </motion.div>
              ))
            ) : (
                [
                    { title: "Inventory_Optimization", insight: "Low stock detected in 'Electronics'. Reorder 45 units to meet projected weekend surge. Savings potential: ₹12,400.", impact: "High" },
                    { title: "Bundle_Opportunity", insight: "High correlation found between 'Coffee' and 'Milk'. Create a 'Breakfast_Bundle' for a potential 18% revenue lift.", impact: "Medium" },
                    { title: "Churn_Alert", insight: "3 key VIP customers haven't visited in 14 days. Suggest automated loyalty outreach with 5% personalized discount.", impact: "High" }
                ].map((ins, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -5 }}
                      className="p-6 border-l-4 border-neon bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all group"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-neon uppercase tracking-widest">{ins.title}</span>
                        <span className="text-white font-black text-xs font-mono">{ins.impact}_IMPACT</span>
                      </div>
                      <p className="text-white/80 text-xs font-bold leading-relaxed uppercase tracking-tight">{ins.insight}</p>
                    </motion.div>
                ))
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard title="Total Revenue" value={`₹${(totalRevenue/1000).toFixed(2)}K`} change={12.4} changeLabel="vs last week" icon="💰" color={C.orange} sparkData={spark(42000)} />
        <KPICard title="Active Orders" value={activeOrders.toString()} change={8.2} changeLabel="in last hour" icon="🛒" color={C.blue} sparkData={spark(250)} />
        <KPICard title="Inventory Health" value={`${inventoryHealth}%`} change={-2.1} changeLabel="items low stock" icon="📦" color={C.green} sparkData={spark(90)} />
        <KPICard title="Customers Today" value={(sales.length * 1.2).toFixed(0)} change={5.6} changeLabel="new vs returning" icon="👥" color={C.purple} sparkData={spark(1800)} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-card !p-8">
          <SectionHeader title="Revenue_Projections" subtitle="Intelligent growth forecasting"
            action={bp.isMobile ? null :
              <div className="flex gap-3">
                {["Live", "7D", "30D"].map((t, i) => (
                  <button key={t} className={`
                    px-6 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-ink transition-all
                    ${i === 0 ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-ink/5'}
                  `}>{t}</button>
                ))}
              </div>
            }
          />
          <div className="h-[350px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sales.length > 0 ? sales.map(s => ({ 
                time: s.timestamp?.toDate ? s.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00',
                revenue: s.amount,
                prev: s.amount * 0.9,
                target: s.amount * 1.1
              })).reverse() : mockSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 900, fill: '#0A0A0A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#0A0A0A' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 10, fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, paddingTop: 30 }} />
                <Area type="monotone" dataKey="revenue" name="Current_Revenue" stroke="#FF6B35" fill="url(#colorRev)" strokeWidth={6} />
                <Line type="monotone" dataKey="prev" name="Baseline" stroke="#0A0A0A" strokeWidth={2} strokeDasharray="8 8" dot={false} />
                <Line type="monotone" dataKey="target" name="Optimized" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card !p-8">
          <SectionHeader title="Category_Mix" subtitle="Market share distribution" />
          <div className="h-[280px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 900, fill: '#0A0A0A' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="value" name="Share %" radius={[0, 4, 4, 0]}>
                  {mockCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-8 pt-8 border-t-2 border-ink/10">
            {mockCategories.map(c => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 border border-ink" style={{ backgroundColor: c.color }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-ink/40">{c.name}</span>
                </div>
                <span className="text-xs font-black data-value">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {lowStockCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-600 text-white p-10 border-4 border-ink shadow-[12px_12px_0px_var(--color-ink)] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rotate-45 -mr-16 -mt-16" />
          <div className="text-6xl animate-bounce">⚠️</div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-2">INVENTORY_CRITICAL_FAILURE</div>
            <div className="text-sm font-bold text-white/80 uppercase tracking-[0.2em]">
              {lowStockCount} Products Below Reorder Point // Action Required Immediately
            </div>
          </div>
          <button className="brutal-btn !bg-white !text-ink !shadow-none hover:!bg-ink hover:!text-white whitespace-nowrap">
            EXECUTE_REPLENISHMENT
          </button>
        </motion.div>
      )}
    </div>
  );
}
