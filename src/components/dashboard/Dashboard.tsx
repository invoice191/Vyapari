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
import { getSalesSummary, getInventorySummary, seedInitialData } from "../../services/dataService";

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
    
    // Seed and fetch data
    seedInitialData().then(() => {
      const unsubSales = getSalesSummary((data) => setSales(data));
      const unsubInv = getInventorySummary((data) => setInventory(data));
      setLoading(false);
      
      return () => {
        unsubSales();
        unsubInv();
      };
    });

    return () => clearInterval(t);
  }, []);

  const fetchInsights = async () => {
    setLoadingAI(true);
    // Use real data if available, fallback to mock
    const data = { 
      salesData: sales.length > 0 ? sales : mockSales, 
      categoryData: mockCategories, 
      productMatrix: inventory.length > 0 ? inventory : mockMatrix 
    };
    const insights = await getAIInsights(data);
    setAiInsights(insights);
    setLoadingAI(false);
  };

  useEffect(() => {
    if (!loading) fetchInsights();
  }, [loading]);

  // Calculate KPIs from real data
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
      <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
        <div style={{ fontWeight: 700, color: C.dark, marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color, fontSize: 13 }}>
            {p.name}: <strong>₹{p.value?.toLocaleString("en-IN")}</strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Live Banner */}
      <div className="bg-ink text-white p-8 border-l-8 border-neon flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[8px_8px_0px_rgba(0,0,0,0.1)]">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-neon">System_Status.Live</div>
          <h1 className="text-4xl font-black tracking-tighter leading-none">REAL-TIME ANALYTICS ENGINE</h1>
        </div>
        <div className="text-right font-mono">
          <div className="text-2xl font-black tracking-tighter">{liveTime.toLocaleTimeString("en-IN")}</div>
          <div className="flex items-center gap-2 justify-end mt-2">
            <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Network_Stable</span>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <section className="brutal-card bg-white/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8 border-b border-ink/10 pb-4">
          <div>
            <h3 className="text-xl font-black tracking-tight">AI STRATEGIC INSIGHTS</h3>
            <p className="text-xs font-medium text-ink/40 uppercase tracking-widest">Neural Analysis of Current Market Vectors</p>
          </div>
          <button 
            onClick={fetchInsights} 
            disabled={loadingAI}
            className="brutal-btn !py-2 !px-4 text-xs"
          >
            {loadingAI ? "ANALYZING..." : "REFRESH_NEURAL_LINK"}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {loadingAI ? (
              [1, 2, 3, 4].map(i => (
                <motion.div 
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-32 bg-ink/5 border border-dashed border-ink/20 animate-pulse"
                />
              ))
            ) : (
              aiInsights.map((ins, i) => (
                <motion.div 
                  key={ins.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 border border-ink/10 bg-white hover:border-neon transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl group-hover:scale-125 transition-transform">{ins.icon}</span>
                    <span className="font-black text-xs uppercase tracking-widest">{ins.title}</span>
                  </div>
                  <p className="text-xs text-ink/60 leading-relaxed mb-4 font-medium">{ins.insight}</p>
                  <div className={`text-[9px] font-black uppercase tracking-[0.2em] ${ins.impact === "High" ? 'text-red-500' : ins.impact === "Medium" ? 'text-neon' : 'text-green-500'}`}>
                    {ins.impact}_IMPACT
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Revenue" value={`₹${(totalRevenue/1000).toFixed(2)}K`} change={12.4} changeLabel="vs last week" icon="💰" color={C.orange} sparkData={spark(42000)} />
        <KPICard title="Active Orders" value={activeOrders.toString()} change={8.2} changeLabel="in last hour" icon="🛒" color={C.blue} sparkData={spark(250)} />
        <KPICard title="Inventory Health" value={`${inventoryHealth}%`} change={-2.1} changeLabel="items low stock" icon="📦" color={C.green} sparkData={spark(90)} />
        <KPICard title="Customers Today" value={(sales.length * 1.2).toFixed(0)} change={5.6} changeLabel="new vs returning" icon="👥" color={C.purple} sparkData={spark(1800)} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 brutal-card">
          <SectionHeader title="Sales Performance" subtitle="Current vs Previous Period vs Target"
            action={bp.isMobile ? null :
              <div className="flex gap-2">
                {["Daily", "Weekly", "Monthly"].map((t, i) => (
                  <button key={t} className={`
                    px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-ink transition-all
                    ${i === 0 ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-ink/5'}
                  `}>{t}</button>
                ))}
              </div>
            }
          />
          <div className="h-[300px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sales.length > 0 ? sales.map(s => ({ 
                time: s.timestamp?.toDate ? s.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00',
                revenue: s.amount,
                prev: s.amount * 0.9,
                target: s.amount * 1.1
              })).reverse() : mockSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 700, fill: '#0A0A0A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#0A0A0A' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, paddingTop: 20 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#FF6B35" fill="url(#colorRev)" strokeWidth={4} />
                <Line type="monotone" dataKey="prev" name="Previous" stroke="#3B82F6" strokeWidth={2} strokeDasharray="8 8" dot={false} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brutal-card">
          <SectionHeader title="Category Mix" subtitle="Inventory Distribution" />
          <div className="h-[250px] mt-6">
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
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-ink/10">
            {mockCategories.map(c => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-ink" style={{ backgroundColor: c.color }} />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-ink/40">{c.name}</span>
                </div>
                <span className="text-xs font-black data-value">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="brutal-card">
          <SectionHeader title="Hourly Sales Heatmap" subtitle="Peak hours identification" />
          <div className="h-[220px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData.slice(6, 22)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 700, fill: '#0A0A0A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#0A0A0A' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
                <Tooltip formatter={(v: any) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="sales" name="Sales" radius={[2, 2, 0, 0]}>
                  {hourlyData.slice(6, 22).map((e, i) => (
                    <Cell key={i} fill={e.sales > 10000 ? "#FF6B35" : e.sales > 6000 ? "#0A0A0A" : "#E5E5E5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brutal-card">
          <SectionHeader title="Product Performance Matrix" subtitle="Sales Volume vs. Profit Margin" />
          <div className="h-[220px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="sales" name="Sales Vol" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="margin" name="Margin %" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <ZAxis dataKey="inventory" range={[100, 600]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }: any) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-ink text-white p-3 text-[10px] font-bold uppercase tracking-widest border border-neon">
                      <div className="text-neon mb-1">{d?.name}</div>
                      <div>Sales: {d?.sales}</div>
                      <div>Margin: {d?.margin}%</div>
                      <div>Stock: {d?.inventory}</div>
                    </div>
                  );
                }} />
                <Scatter data={inventory.length > 0 ? inventory.map(i => ({
                  name: i.name,
                  sales: Math.floor(Math.random() * 500) + 100,
                  margin: i.margin,
                  inventory: i.stock
                })) : mockMatrix} fill="#FF6B35" stroke="#0A0A0A" strokeWidth={1} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {lowStockCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500 text-white p-6 border-4 border-ink shadow-[8px_8px_0px_var(--color-ink)] flex items-center gap-6"
        >
          <div className="text-4xl">⚠️</div>
          <div className="flex-1">
            <div className="text-xl font-black uppercase tracking-tighter italic">Critical_Inventory_Alert</div>
            <div className="text-xs font-bold text-white/80 uppercase tracking-widest mt-1">
              {lowStockCount} Products Below Reorder Point: {inventory.filter(i => i.stock <= i.minStock).slice(0, 3).map(i => i.name).join(", ")}
            </div>
          </div>
          <button className="bg-white text-ink px-6 py-2 font-black text-xs uppercase tracking-widest hover:bg-ink hover:text-white transition-colors border-2 border-ink">
            Resolve_Now
          </button>
        </motion.div>
      )}
    </div>
  );
}
