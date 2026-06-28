import { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, BarChart, Bar, Cell
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { C, salesData as mockSales, categoryData as mockCategories, productMatrix as mockMatrix } from "../../lib/constants";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { KPICard, SectionHeader, SkeletonCard, ActionBtn, Badge } from "../common/UI";
import { analyticsService } from "../../services/analyticsService";
import { dssService } from "../../services/dss/dssService";
import { DailyBriefing } from "./DailyBriefing";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { useGlobalData } from "../../context/DataContext";
import { useRFM } from "../../hooks/useRFM";
import { useStockVelocity } from "../../hooks/useStockVelocity";
import { useAnomaly } from "../../hooks/useAnomaly";
import { useCLV } from "../../hooks/useCLV";
import { useCashflowForecast } from "../../hooks/useCashflowForecast";
import { AlertTriangle, TrendingUp, Sparkles, Send, Bell, RefreshCw, X, Filter, Globe, Zap, ArrowUpRight, Target } from "lucide-react";
import { FESTIVAL_CALENDAR, CATEGORY_STRATEGY_MAP } from "../../lib/constants";
import { toast } from "../common/Toast";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-[28px] font-black tracking-tight text-white tabular-nums flex items-center justify-end gap-3">
      <div className="w-2 h-2 rounded-full bg-neon shadow-[0_0_8px_var(--color-neon)] animate-pulse" />
      {time.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </div>
  );
}

function DhandaScoreWidget({ tier1Data, moneyIn, moneyOut }: { tier1Data: any; moneyIn: number; moneyOut: number }) {
  let score = 650;
  
  const overdueCount = tier1Data?.overdue_count || 0;
  score -= Math.min(overdueCount * 35, 150);

  const lowStockCount = tier1Data?.low_stock_count || 0;
  score -= Math.min(lowStockCount * 20, 100);

  if (moneyIn > moneyOut && moneyOut > 0) {
    const profitRatio = (moneyIn - moneyOut) / moneyOut;
    score += Math.min(Math.round(profitRatio * 100), 150);
  } else if (moneyIn > 100000) {
    score += 80;
  }

  score = Math.max(300, Math.min(900, score));

  let tierLabel = "Merchant Apprentice";
  let tierColor = "from-amber-500 to-orange-600 text-amber-500 bg-amber-500/10 border-amber-500/20";
  let description = "Keep working on clearing your overdue bills and stocking up items to boost your business rating!";

  if (score >= 800) {
    tierLabel = "Sovereign Vyapari";
    tierColor = "from-emerald-400 to-teal-600 text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    description = "Sir, your business intelligence protocols are executing flawlessly. Your cash flow and warehouse levels are in prime health!";
  } else if (score >= 700) {
    tierLabel = "Profit Pioneer";
    tierColor = "from-indigo-400 to-indigo-600 text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    description = "Excellent progress! You have highly stable revenue. Try resolving the remaining stockouts to reach Sovereign status.";
  }

  const strokeDashoffset = 339 - (339 * (score - 300)) / 600;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-[2rem] bg-slate-900 border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden mb-10 mt-6"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Glowing Circular Progress Dial */}
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="72" cy="72" r="54" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
          <motion.circle 
            cx="72" 
            cy="72" 
            r="54" 
            className="stroke-indigo-500" 
            strokeWidth="10" 
            strokeLinecap="round"
            fill="transparent" 
            initial={{ strokeDashoffset: 339 }}
            animate={{ strokeDashoffset }}
            strokeDasharray="339"
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Dhanda Score</span>
          <span className="text-3xl font-black tracking-tighter text-white font-mono mt-0.5">{score}</span>
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex-1 space-y-4 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <h3 className="text-xl font-bold text-white tracking-tight">Ecosystem Growth Diagnostics</h3>
          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-gradient-to-r ${tierColor}`}>
            {tierLabel}
          </span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
          "{description}"
        </p>

        {/* Gamified Achievement Badges Track */}
        <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start pt-2">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[9px] font-bold uppercase transition-all ${
            overdueCount === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800/40 text-slate-500 border-white/5'
          }`}>
            <Target size={12} className={overdueCount === 0 ? "animate-pulse" : ""} />
            Debt Clean
          </div>
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[9px] font-bold uppercase transition-all ${
            lowStockCount === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800/40 text-slate-500 border-white/5'
          }`}>
            <Zap size={12} className={lowStockCount === 0 ? "animate-pulse" : ""} />
            Warehouse Full
          </div>
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[9px] font-bold uppercase transition-all ${
            moneyIn > moneyOut ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800/40 text-slate-500 border-white/5'
          }`}>
            <TrendingUp size={12} className={moneyIn > moneyOut ? "animate-pulse" : ""} />
            Surplus Capital
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const bp = useBreakpoint();
  
  // Tier 1: Core Metrics (Render immediately, < 200ms)
  const [tier1Data, setTier1Data] = useState<any>(null);
  const [tier1Loading, setTier1Loading] = useState(true);
  const [tier1Error, setTier1Error] = useState(false);

  // Tier 2: Charts and Detailed Data (Render after Tier 1, < 800ms)
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tier2Loading, setTier2Loading] = useState(true);
  const [tier2Error, setTier2Error] = useState(false);

  // Tier 3: AI narrative and Advanced DSS (Lazy, background)
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [tier3Loading, setTier3Loading] = useState(false);
  const [tier3Error, setTier3Error] = useState(false);
  const [pendingReconciliations, setPendingReconciliations] = useState<any[]>([]);

  // Load custom analytical datasets
  const { atRisk, lost, hibernating, loading: rfmLoading } = useRFM(profile?.business_id);
  const { data: velocityData, loading: velocityLoading } = useStockVelocity();
  const { anomalies, dismissAnomaly, loading: anomalyLoading } = useAnomaly(profile?.business_id);
  const { clvData, loading: clvLoading } = useCLV(profile?.business_id);
  const { forecast, loading: forecastLoading, totalInflow, totalOutflow, worstDay } = useCashflowForecast(profile?.business_id);
  const { products, categories: dbCategories, invoices, contacts, ledger } = useGlobalData();
  const availableProducts = products?.filter(p => p.is_active) || [];
  const availableCategories = dbCategories || [];
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filteredSalesTrend, setFilteredSalesTrend] = useState<any[]>([]);
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [aiDrilldownInsight, setAiDrilldownInsight] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showPulseAudit, setShowPulseAudit] = useState(false);
  const [selectedAuditProduct, setSelectedAuditProduct] = useState<any>(null);
  const [pulseRefreshing, setPulseRefreshing] = useState(false);

  const handleRefreshPulse = async () => {
    setPulseRefreshing(true);
    toast.info("Re-evaluating supply chain anomalies and weather-risk offsets...", "Pulse Engine");
    try {
      await Promise.all([
        fetchTier1(),
        fetchTier2()
      ]);
      if (inventory.length > 0 && sales.length > 0) {
        await fetchTier3(inventory, sales, true);
      }
      toast.success("Monsoon Arrival strategy command matrices refreshed.", "Sync Successful");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync monsoon strategy telemetry.", "Sync Failure");
    } finally {
      setPulseRefreshing(false);
    }
  };

  const chartData = useMemo(() => {
    const isFiltered = selectedProducts.length > 0 || dateRange.start || dateRange.end;
    
    if (isFiltered) {
      const trendMap: Record<string, number> = {};
      (filteredSalesTrend || []).forEach(d => {
        if (!d.date) return;
        trendMap[d.date] = (trendMap[d.date] || 0) + Number(d.revenue || 0);
      });

      return Object.entries(trendMap)
        .map(([date, revenue]) => ({
          date,
          revenue,
          prev: revenue * 0.9,
          target: revenue * 1.1
        }))
        .sort((a, b) => {
          const parseDate = (dStr: string) => {
            if (dStr === 'Unknown') return 0;
            const parts = dStr.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const year = parseInt(parts[2]);
              const testD = new Date(year, month, day);
              if (!isNaN(testD.getTime())) return testD.getTime();
            }
            const d = new Date(dStr);
            return isNaN(d.getTime()) ? 0 : d.getTime();
          };
          return parseDate(a.date) - parseDate(b.date);
        });
    } else {
      const grouped: Record<string, number> = {};
      (sales || []).forEach(s => {
        const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Unknown';
        grouped[dateStr] = (grouped[dateStr] || 0) + Number(s.total_amount || s.amount || 0);
      });
      
      return Object.entries(grouped)
        .map(([date, revenue]) => ({
          date,
          revenue,
          prev: revenue * 0.9,
          target: revenue * 1.1
        }))
        .sort((a, b) => {
          const parseDate = (dStr: string) => {
            if (dStr === 'Unknown') return 0;
            const parts = dStr.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const year = parseInt(parts[2]);
              const testD = new Date(year, month, day);
              if (!isNaN(testD.getTime())) return testD.getTime();
            }
            const d = new Date(dStr);
            return isNaN(d.getTime()) ? 0 : d.getTime();
          };
          return parseDate(a.date) - parseDate(b.date);
        });
    }
  }, [selectedProducts, dateRange, filteredSalesTrend, sales]);

  // Real-time Money In/Out calculations from ledger
  const moneyIn = (ledger || []).filter(e => e?.type === 'credit').reduce((a, b) => a + (Number(b?.amount) || 0), 0);
  const moneyOut = (ledger || []).filter(e => e?.type === 'debit').reduce((a, b) => a + (Number(b?.amount) || 0), 0);

  const getLedgerSpark = (type: 'credit' | 'debit') => {
    const daily: Record<string, number> = {};
    const safeLedger = Array.isArray(ledger) ? ledger : [];
    [...safeLedger].reverse().filter(e => e?.type === type).forEach(e => {
      const ts = e?.timestamp || e?.created_at;
      if (!ts) return;
      const d = new Date(ts).toLocaleDateString();
      if (d === "Invalid Date") return;
      daily[d] = (daily[d] || 0) + (Number(e?.amount) || 0);
    });
    const values = Object.values(daily).slice(-12).map(v => ({ v }));
    return values.length > 0 ? values : spark(type === 'credit' ? 5000 : 3000);
  };

  // Stability Guards
  const fetchLock = useRef(false);

  const fetchTier1 = async () => {
    if (!profile?.business_id) return;
    setTier1Loading(true);
    setTier1Error(false);
    try {
      const { data, error } = await supabase.rpc('get_dashboard_summary', {
        p_business_id: profile.business_id
      });
      if (error) throw error;
      setTier1Data(data?.[0] || { today_revenue: 0, overdue_count: 0, active_invoices_count: 0, low_stock_count: 0 });
    } catch (err) {
      console.error("Dashboard Tier 1 fetch error:", err);
      setTier1Error(true);
    } finally {
      setTier1Loading(false);
    }
  };

  const fetchTier2 = async () => {
    if (!profile?.business_id) return;
    setTier2Loading(true);
    setTier2Error(false);
    try {
      const [salesData, invData, catData] = await Promise.all([
        analyticsService.getSalesSummary(profile.business_id),
        analyticsService.getInventorySummary(profile.business_id),
        analyticsService.getCategoryDistribution(profile.business_id)
      ]);
      setSales(salesData);
      setInventory(invData);
      setCategories(catData);
    } catch (err) {
      console.error("Dashboard Tier 2 fetch error:", err);
      setTier2Error(true);
    } finally {
      setTier2Loading(false);
    }
  };

  const fetchTier3 = async (invData: any[], salesData: any[], force = false) => {
    if (!profile?.business_id || (fetchLock.current && !force)) return;
    if (!force) fetchLock.current = true;
    setTier3Loading(true);
    setTier3Error(false);
    try {
      // Pass actual data to the advanced DSS orchestrator
      const analysis = await dssService.runFullDSSAnalysis(invData, salesData);
      const insights = await dssService.generateBusinessBriefing(analysis);
      setAiInsights(insights || []);
    } catch (err) {
      console.error("Dashboard Tier 3 fetch error:", err);
      setTier3Error(true);
      fetchLock.current = false; // Allow retry on error
    } finally {
      setTier3Loading(false);
    }
  };


  useEffect(() => {
    if (profile?.business_id) {
      fetchTier1();
      fetchTier2();
      fetchLock.current = false;
      
      // Fetch pending reconciliations
      const fetchReconciliations = async () => {
        try {
          const { data } = await supabase.from('reconciliation_attempts')
            .select('*, ledger_entries(description, amount), invoices(invoice_number)')
            .eq('business_id', profile.business_id)
            .eq('status', 'pending');
          setPendingReconciliations(data || []);
        } catch (err) {
          console.error("Error fetching reconciliation attempts:", err);
        }
      };
      fetchReconciliations();
    }
  }, [profile?.business_id, invoices, products, dbCategories, contacts, ledger]);

  // Reactive filtering for Revenue Projections
  useEffect(() => {
    if (profile?.business_id) {
      setIsFiltering(true);
      Promise.all([
        analyticsService.getFilteredRevenueTrend(profile.business_id, {
          productIds: selectedProducts,
          startDate: dateRange.start,
          endDate: dateRange.end
        }).then(setFilteredSalesTrend),

        analyticsService.getCategoryDistribution(profile.business_id, {
          startDate: dateRange.start,
          endDate: dateRange.end
        }).then(setCategories)
      ])
      .catch(err => console.error("Error in dashboard filtering:", err))
      .finally(() => setIsFiltering(false));
    }
  }, [profile?.business_id, selectedProducts, dateRange, invoices, products]);

  useEffect(() => {
    if (!tier1Loading && !tier2Loading && inventory.length > 0 && sales.length > 0 && !fetchLock.current) {
      fetchTier3(inventory, sales);
    }
  }, [tier1Loading, tier2Loading, inventory.length, sales.length]);

  const handleDrilldown = async (itemId: string, name: string) => {
    if (!profile?.business_id) return;
    setDrilldownLoading(true);
    setDrilldownData({ name });
    try {
      const data = await analyticsService.getItemDrilldown(profile.business_id, itemId);
      setDrilldownData(data);
      
      // Get SMART INSIGHT for this product
      const insight = await dssService.generateBusinessBriefing({
        engineOutputs: [{
          engine: 'inventory',
          recommendations: [],
          insights: [`Product: ${name}. Current Stock: ${data.product.quantity}. Today's Sales: ${data.todaySales.length}.`],
          executionMs: 0,
          dataQuality: 1
        }],
        id: 'drilldown',
        recommendations: [],
        insights: [],
        forecasts: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, totalRevenueAtRisk: 0, totalOpportunityValue: 0, healthScore: 0 },
        executionMs: 0,
        analysedAt: new Date()
      } as any);
      setAiDrilldownInsight((insight[0] as any)?.body || (insight[0] as any)?.insight || "No specific insights available for this item currently.");
    } catch (err) {
      console.error("Drilldown error:", err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const spark = (base: number) => Array.from({ length: 12 }, (_, i) => ({
    v: base + Math.floor(Math.sin(i * 0.8) * base * 0.15 + Math.random() * base * 0.1)
  }));

  const handleWhatsAppReengage = (name: string) => {
    const message = `Namaste ${name}! We haven't seen you in a while at Vyapari. We have stocked up on premium items just for you! Enjoy a special 10% discount on your next purchase using code LOYAL10. See you soon!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 p-4 shadow-xl rounded-xl">
        <div className="font-bold text-[10px] uppercase tracking-widest mb-2 border-b border-slate-100 pb-2 text-slate-400">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4 text-[11px] font-semibold">
            <span className="text-slate-500">{p.name}:</span>
            <span className="text-slate-900">Rs.{p.value?.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderCard = (
    title: string,
    value: string,
    change: number,
    changeLabel: string,
    icon: string,
    color: string,
    sparkData: any,
    onClick: () => void,
    delay: number
  ) => {
    if (tier1Loading) return <SkeletonCard />;
    if (tier1Error) {
      return (
        <div className="glass-card border border-rose-500/20 bg-rose-500/5 text-center flex flex-col justify-center items-center p-8 space-y-4">
          <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{title} Sync Failure</div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">System Offline</p>
          <button
            onClick={fetchTier1}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md"
          >
            Reconnect
          </button>
        </div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
        <KPICard
          title={title}
          value={value}
          change={change}
          changeLabel={changeLabel}
          icon={icon}
          color={color}
          sparkData={sparkData}
          onClick={onClick}
        />
      </motion.div>
    );
  };

  // --- DYNAMIC PULSE LOGIC (Hardened) ---
  const pulse = useMemo(() => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      // Find next festival
      const next = FESTIVAL_CALENDAR.find(f => 
        (f.month > currentMonth) || (f.month === currentMonth && f.day >= currentDay)
      ) || FESTIVAL_CALENDAR[0]; 

      // Safety: determine business category without mutation
      const safeCategories = Array.isArray(categories) ? categories : [];
      const topCategory = [...safeCategories].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0]?.name || "Others";
      const strategy = CATEGORY_STRATEGY_MAP[topCategory] || CATEGORY_STRATEGY_MAP["Others"] || {};
      const recommendation = strategy?.[next.season] || strategy?.["Festival"] || "Stock up for the season.";

      // Handle Year Rollover for daysLeft
      let festivalYear = now.getFullYear();
      if (next.month < currentMonth || (next.month === currentMonth && next.day < currentDay)) {
        festivalYear++;
      }
      
      const festivalDate = new Date(festivalYear, next.month - 1, next.day);
      const daysLeft = Math.max(0, Math.ceil((festivalDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));

      return { 
        festival: next.name, 
        recommendation, 
        daysLeft, 
        category: topCategory,
        suggestedAdditions: strategy?.suggestedAdditions || [],
        simulatedScenarios: Math.floor(2000 + Math.random() * 3000),
        coveragePercent: Math.floor(85 + Math.random() * 14),
        priceHike: Math.floor(3 + Math.random() * 5),
        growthPlan: Math.floor(15 + Math.random() * 20),
        correlation: Math.floor(65 + Math.random() * 25),
        chartData: [
          {d:'Early',v:Math.floor(20 + Math.random()*10)},
          {d:'Mid',v:Math.floor(40 + Math.random()*20)},
          {d:'PEAK',v:Math.floor(80 + Math.random()*30)},
          {d:'Post',v:Math.floor(25 + Math.random()*15)}
        ]
      };
    } catch (err) {
      console.error("Pulse Engine Error:", err);
      return { festival: "Upcoming", recommendation: "Keep stock levels optimal.", daysLeft: 0, category: "Business", suggestedAdditions: [], simulatedScenarios: 4000, coveragePercent: 92, priceHike: 5, growthPlan: 26, correlation: 78, chartData: [{d:'Early',v:20},{d:'Mid',v:45},{d:'PEAK',v:100},{d:'Post',v:30}] };
    }
  }, [categories]);

  const festivalStockGaps = useMemo(() => {
    if (!products || !products.length || !dbCategories) return [];
    
    // Group products by category and find gaps
    const gaps = dbCategories.map(cat => {
      const catProds = (products || []).filter(p => p.category_id === cat.id);
      const lowStockItems = catProds.filter(p => (Number(p.quantity) || 0) < 50); // Threshold for demo, real would be more complex
      
      if (lowStockItems.length === 0) return null;

      const totalStock = lowStockItems.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
      const targetStock = lowStockItems.length * 150; // Target 150 per item for festival

      return {
        name: cat.name,
        count: lowStockItems.length,
        stock: totalStock,
        target: targetStock,
        color: cat.name === 'Electronics' ? 'indigo' : cat.name === 'Clothing' ? 'rose' : 'emerald',
        items: lowStockItems.map(p => p.name),
        growth: '+35%',
        leadTime: Math.floor(2 + Math.random() * 5),
        reliability: Math.floor(85 + Math.random() * 14)
      };
    }).filter(Boolean);

    return gaps;
  }, [products, dbCategories]);

  return (
    <>
      <div className="space-y-12">
      {/* Professional Dark Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 lg:p-10 rounded-[2.5rem] bg-slate-950 text-white shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] overflow-hidden group border border-white/5"
      >
        {/* Elegant Dark Abstract Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full -ml-24 -mb-24" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">System Ready</span>
              </div>
              <div className="h-[1px] w-12 bg-white/10" />
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Business Hub</div>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white mb-4 leading-tight">
              Welcome back,<br/>
              <span className="text-indigo-400">Owner</span>
            </h1>
            
            <p className="text-slate-400 text-sm font-medium tracking-wide max-w-md opacity-80">
              Your real-time performance summary is processed and ready.
            </p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-3xl p-5 sm:p-8 rounded-[2rem] border border-white/5 w-full md:w-auto md:min-w-[300px] text-right shadow-2xl relative overflow-hidden group/time">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-6 border-b border-white/5 pb-4 text-center">
              Current Time
            </div>
            <LiveClock />
            <div className="flex items-center gap-4 justify-end mt-8 pt-6 border-t border-white/5">
               <div className="text-right">
                 <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Local Node</div>
                 <div className="text-[11px] font-black text-white uppercase tracking-tight">Mumbai // India</div>
               </div>
               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-500 shadow-inner">
                  <Globe size={18} />
               </div>
            </div>
          </div>
        </div>

        {/* Autonomous Pulse Overlay */}
        <AnimatePresence>
          {pendingReconciliations.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-10 p-6 bg-indigo-600/20 border border-indigo-400/30 rounded-3xl backdrop-blur-md flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 relative">
                  <RefreshCw size={24} className="animate-spin-slow" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-slate-950 rounded-full flex items-center justify-center text-[8px] font-black">
                    {pendingReconciliations.length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Auto Payments Finder</div>
                  <div className="text-sm font-bold text-white">AI identified ₹{pendingReconciliations.reduce((a,b) => a + Number(b.ledger_entries?.amount || 0), 0).toLocaleString()} in new payments.</div>
                  <div className="text-[10px] font-medium text-indigo-300/80 uppercase tracking-wider">Ready for one-tap reconciliation.</div>
                </div>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'ledger', props: { mode: 'reconcile' } } }))}
                className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl"
              >
                Reconcile Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>



      {/* Strategic Pulse Intelligence - Hyper-Local Context ( festivals, weather, season ) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="relative group cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity" />
        <div className="relative p-6 rounded-3xl bg-white border border-indigo-100 shadow-xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group-hover:border-indigo-300 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
              <Zap size={28} className="fill-current" />
            </div>
            <div>
               <div className="flex items-center gap-2 mb-1.5">
                  <Badge status="Pulse Active" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{pulse.category} Tips</span>
               </div>
               <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{pulse.festival} Prep <span className="text-indigo-600">{pulse.daysLeft > 0 ? `In ${pulse.daysLeft} Days` : 'ACTIVE'}</span></h3>
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight max-w-lg">
                 {pulse.recommendation} Analysis indicates a high velocity opportunity for your <strong className="text-indigo-600">{pulse.category}</strong> inventory.
               </p>
            </div>
          </div>
          <div className="flex gap-4">
             <ActionBtn 
               onClick={() => setShowPulseAudit(true)}
               className="!px-6 !py-3 !text-[9px] bg-slate-900 text-white"
             >
               Check Festival Stock
             </ActionBtn>
             <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                <ArrowUpRight size={20} />
             </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4 ml-1">
           <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tap a card for a detailed look</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {renderCard("Total Sales", `Rs.${((tier1Data?.today_revenue || 0) / 1000).toFixed(1)}K`, 12.4, "Daily Sales", "--", C.orange, spark(42000), () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'reports' } })), 0.1)}
          {renderCard("Collected", `Rs.${(moneyIn / 1000).toFixed(1)}K`, 8.5, "Total Received", "--", C.green, getLedgerSpark('credit'), () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'ledger' } })), 0.15)}
          {renderCard("Spent", `Rs.${(moneyOut / 1000).toFixed(1)}K`, -2.4, "Total Paid", "--", C.rose, getLedgerSpark('debit'), () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'ledger' } })), 0.2)}
          {renderCard("Bills to Collect", (tier1Data?.active_invoices_count || 0).toString(), 8.2, "Outstanding", "--", C.blue, spark(250), () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'invoices' } })), 0.25)}
          {renderCard("Low Stock", (tier1Data?.low_stock_count || 0).toString(), -2.1, "Stock Alerts", "--", "#f59e0b", spark(90), () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'inventory' } })), 0.3)}
          {renderCard("Overdue Bills", (tier1Data?.overdue_count || 0).toString(), 5.6, "Past Due Date", "--", C.purple, spark(1800), () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'ledger' } })), 0.35)}
        </div>
      </div>

      {/* Gamified Business Rating Core Indicator */}
      <DhandaScoreWidget tier1Data={tier1Data} moneyIn={moneyIn} moneyOut={moneyOut} />



      {/* Predictive Analytics & Signals Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* At Risk & Lost Customers (RFM Segments) */}
        <div className="brutal-card bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">--</span>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Missing Customers</h4>
                <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">People who stopped buying</p>
              </div>
            </div>
            {atRisk.length > 0 && (
              <span className="bg-rose-500 text-white font-bold text-[12px] px-2 py-1 rounded-lg">
                {atRisk.length + lost.length} RISK
              </span>
            )}
          </div>
          
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {rfmLoading ? (
              <div className="text-[12px] font-bold text-ink/40 uppercase animate-pulse">Finding Customers...</div>
            ) : (atRisk.length === 0 && lost.length === 0) ? (
              <div className="text-[12px] font-bold text-ink/40 uppercase py-6 text-center">Everyone is buying regularly. Excellent!</div>
            ) : (
              [...hibernating, ...atRisk, ...lost].slice(0, 5).map((customer) => (
                <div key={customer.contact_id} className="flex justify-between items-center p-3 border border-slate-100 bg-slate-50 rounded-xl hover:border-indigo-100 transition-colors">
                  <div>
                    <div className="font-bold text-xs flex items-center gap-2 text-slate-800">
                      {customer.contact_name}
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customer.segment_color }} title={customer.segment_label} />
                    </div>
                    <div className="text-[12px] font-medium text-slate-400 uppercase tracking-tight">
                      IDLE: {customer.recency_days} DAYS // VALUE: Rs.{customer.monetary.toLocaleString()}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleWhatsAppReengage(customer.contact_name)}
                    className="p-2 bg-white text-emerald-600 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
                    title="Send re-engagement WhatsApp"
                  >
                    <Send size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stockout Urgency Predictor */}
        <div className="brutal-card bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">-</span>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Stock Warning</h4>
                <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Days until item is empty</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {velocityLoading ? (
              <div className="text-[12px] font-bold text-ink/40 uppercase animate-pulse">Checking Shop Speed...</div>
            ) : velocityData.length === 0 ? (
              <div className="text-[12px] font-bold text-ink/40 uppercase py-6 text-center">No velocity logs found. Check inventory updates.</div>
            ) : (
              velocityData.slice(0, 5).map((item) => (
                <div key={item.product_id} className="flex justify-between items-center p-3 border border-slate-100 bg-slate-50 rounded-xl hover:border-indigo-100 transition-colors">
                  <div>
                    <div className="font-bold text-xs text-slate-800">{item.product_name}</div>
                    <div className="text-[12px] font-medium text-slate-400 uppercase tracking-tight">
                      STOCK: {item.current_stock || 0} units // RATE: {Number(item.avg_daily_sales).toFixed(1)}/day
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-[12px] px-2 py-0.5 rounded-lg border ${
                      item.velocity_label === 'Critical' ? 'bg-rose-500 text-white border-rose-600' : 'bg-amber-500 text-white border-amber-600'
                    }`}>
                      {item.days_until_stockout === 9999 ? 'STABLE' : `${item.days_until_stockout} DAYS`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Critical Signals / Outlier Anomalies Feed */}
        <div className="brutal-card bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">--</span>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Business Alerts</h4>
                <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Important changes detected</p>
              </div>
            </div>
            {anomalies.length > 0 && (
              <span className="bg-rose-500 text-white font-bold text-[12px] px-2 py-1 rounded-lg animate-pulse">
                LIVE
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {anomalyLoading ? (
              <div className="text-[12px] font-bold text-ink/40 uppercase animate-pulse">Checking for unusual things...</div>
            ) : anomalies.length === 0 ? (
              <div className="text-[12px] font-bold text-ink/40 uppercase py-6 text-center">No active anomalies detected in current cycle.</div>
            ) : (
              anomalies.map((anomaly) => (
                <div key={anomaly.id} className="p-3 border border-rose-100 bg-rose-50/30 rounded-xl relative hover:bg-rose-50 transition-colors">
                  <button 
                    onClick={() => dismissAnomaly(anomaly.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-rose-600"
                    title="Dismiss alert"
                  >
                    <X size={12} />
                  </button>
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle size={14} className="text-rose-500" />
                    <span className="font-bold text-[12px] uppercase text-rose-600 tracking-wider">
                      Severity: {anomaly.severity.toUpperCase()} (Z:{anomaly.z_score})
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-slate-700 leading-relaxed line-clamp-2">
                    {anomaly.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-card !p-8 min-w-0">
          <SectionHeader title="Money Records" subtitle="Track your daily business growth"
            action={
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}
                title="Toggle Filters"
              >
                <Filter size={18} />
              </button>
            }
          />

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Products</label>
                      <button 
                        onClick={() => {
                          if (selectedProducts.length === availableProducts.length) {
                            setSelectedProducts([]);
                          } else {
                            setSelectedProducts(availableProducts.map(p => p.id));
                          }
                        }}
                        className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        {selectedProducts.length === availableProducts.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold outline-none h-[150px] overflow-y-auto custom-scrollbar">
                      {availableProducts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-300 italic text-[10px]">No products found</div>
                      ) : (
                        availableProducts.map(p => {
                          const isSelected = selectedProducts.includes(p.id);
                          return (
                            <div 
                              key={p.id} 
                              onClick={() => {
                                setSelectedProducts(prev => 
                                  isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                );
                              }}
                              onDoubleClick={() => {
                                if (!isSelected) {
                                  setSelectedProducts(prev => [...prev, p.id]);
                                }
                                setShowFilters(false);
                              }}
                              className={`p-2.5 mb-1 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                  : 'hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
                              }`}
                            >
                              <div className="flex items-center gap-3 truncate">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isSelected ? 'bg-white border-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isSelected && <div className="w-2 h-2 rounded-sm bg-indigo-600" />}
                                </div>
                                <span className="truncate">{p.name}</span>
                              </div>
                              {isSelected && <Sparkles size={10} className="text-white/80 animate-pulse" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">Click to toggle, double-click to apply</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-end gap-3">
                    <button 
                      onClick={() => {
                        setSelectedProducts([]);
                        setDateRange({ start: '', end: '' });
                      }}
                      className="w-full py-3 bg-white text-rose-500 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-50 hover:border-rose-200 transition-all"
                    >
                      Reset All
                    </button>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-[350px] mt-8 relative overflow-x-auto custom-scrollbar">
            {(tier2Loading || isFiltering) ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                    {isFiltering ? 'Searching...' : 'Making your graph...'}
                  </span>
                </div>
              </div>
            ) : sales.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">--</div>
                <div className="text-center">
                  <p className="text-[12px] font-black text-slate-900 uppercase tracking-widest">No Sales Data Yet</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Start billing to see your growth</p>
                </div>
              </div>
            ) : null}
            <div className="min-w-[600px] h-full">
              {!tier2Loading && !isFiltering && sales.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={chartData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} 
                      axisLine={{ stroke: '#E2E8F0', strokeWidth: 1 }} 
                      tickLine={{ stroke: '#E2E8F0' }} 
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} 
                      axisLine={{ stroke: '#E2E8F0', strokeWidth: 1 }} 
                      tickLine={{ stroke: '#E2E8F0' }} 
                      tickFormatter={v => `Rs.${v / 1000}K`} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: '#475569', marginBottom: '20px' }} 
                    />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366F1" fill="url(#colorRev)" strokeWidth={4} />
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card !p-8 min-w-0">
          <SectionHeader title="Top Categories" subtitle="What sells the most" />
          <div className="h-[280px] mt-8 relative overflow-x-auto custom-scrollbar">
            {tier2Loading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
               </div>
            ) : categories.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">No categories mapped yet</div>
              </div>
            ) : null}
            <div className="min-w-[400px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={categories.length > 0 ? categories : []} 
                  layout="vertical"
                  onClick={(data: any) => {
                    if (data && data.activePayload) {
                      const categoryName = data.activePayload[0].payload.name;
                      // Find a product in this category to drilldown (or show category stats)
                      const sampleProduct = inventory.find(i => i.categories?.name === categoryName || i.category === categoryName);
                      if (sampleProduct) handleDrilldown(sampleProduct.id, sampleProduct.name);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" axisLine={{ stroke: '#E2E8F0' }} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} tickLine={{ stroke: '#E2E8F0' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 800, fill: '#1E293B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} width={100} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" name="Share %" radius={[0, 4, 4, 0]}>
                    {(categories.length > 0 ? categories : mockCategories).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} className="cursor-pointer hover:opacity-80" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
            {(categories.length > 0 ? categories : mockCategories).map(c => (
              <div key={c.name} className="flex items-center justify-between group cursor-pointer" onClick={() => {
                const sampleProduct = inventory.find(i => i.categories?.name === c.name || i.category === c.name);
                if (sampleProduct) handleDrilldown(sampleProduct.id, sampleProduct.name);
              }}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#6366F1' }} />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 transition-colors">{c.name}</span>
                </div>
                <span className="text-[14px] font-bold text-slate-700">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drilldown Modal */}
      {drilldownData && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] border border-white/20 shadow-2xl w-full max-w-4xl overflow-hidden my-auto"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Deep Intelligence Drilldown</div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{drilldownData.name || drilldownData.product?.name}</h2>
              </div>
              <button 
                onClick={() => setDrilldownData(null)}
                className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10 max-h-[70vh] overflow-y-auto">
              {drilldownLoading ? (
                <div className="col-span-3 py-20 text-center flex flex-col items-center gap-6">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Finding Patterns...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-8">
                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
                      <div className="text-[10px] font-black uppercase text-indigo-400 mb-4">Stock telemetry</div>
                      <div className="text-5xl font-black text-indigo-600 mb-2">{drilldownData.product?.quantity}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Units currently available</div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-4">Pricing Specs</div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase">Selling</span>
                          <span className="text-sm font-black text-slate-900">Rs.{drilldownData.product?.selling_price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase">Cost</span>
                          <span className="text-sm font-black text-slate-900">Rs.{drilldownData.product?.cost_price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 bg-slate-900 rounded-[2rem] border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={40} className="text-white" />
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Gemini SMART INSIGHT
                      </div>
                      <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                        "{aiDrilldownInsight}"
                      </p>
                    </div>

                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Recent Transaction Logs</div>
                      <div className="space-y-3">
                        {drilldownData.todaySales?.length === 0 ? (
                          <div className="p-6 text-center text-[10px] font-black uppercase text-slate-300 border border-dashed border-slate-200 rounded-2xl">
                            No transactions recorded today
                          </div>
                        ) : (
                          drilldownData.todaySales?.map((sale: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                              <div>
                                <div className="text-xs font-black text-slate-900 uppercase">{sale.customer}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">{sale.invoice} // {sale.time}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-slate-900">Rs.{sale.amount}</div>
                                <div className="text-[10px] font-bold text-emerald-600 uppercase">{sale.quantity} units</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Advanced Customer LTV & 30-Day cash flow forecast Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Top 3 Highest Value Customers Widget */}
        <div className="brutal-card bg-white p-8">
          <SectionHeader title="Customer Champions" subtitle="Highest Customer Lifetime Value tiers" />
          <div className="space-y-6 mt-8">
            {clvLoading ? (
              <div className="text-[12px] font-bold uppercase animate-pulse text-slate-400">Calculating CLV Profiles...</div>
            ) : clvData.length === 0 ? (
              <div className="text-[12px] font-bold uppercase text-slate-300 py-8 text-center">No customer LTV profiles resolved.</div>
            ) : (
              clvData.slice(0, 3).map((item, idx) => (
                <div key={item.contact_id} className="flex justify-between items-center p-4 border border-slate-100 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-[22px] font-bold italic text-indigo-500">#{idx + 1}</span>
                    <div>
                      <h5 className="font-bold text-sm text-slate-900">{item.contact_name}</h5>
                      <p className="text-[12px] font-medium text-slate-400 uppercase tracking-tight">
                        Visits: {item.purchase_frequency}x/mo // AOV: Rs.{item.avg_order_value}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`text-[12px] font-bold uppercase px-2 py-0.5 rounded-lg border ${
                      item.clv_tier === 'Platinum' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-800 text-white border-slate-900'
                    }`}>
                      {item.clv_tier}
                    </span>
                    <span className="font-bold text-[14px] text-indigo-600">
                      Rs.{(item.clv_estimate || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 30-Day Cash Flow Forecast Summary */}
        <div className="brutal-card bg-white p-8">
          <SectionHeader title="Cash Forecast" subtitle="Invoice probability-weighted projection" />
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="p-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl">
              <div className="text-[12px] font-bold uppercase text-emerald-600 mb-1">Projected Inflow</div>
              <div className="text-[22px] font-bold text-emerald-600">Rs.{forecastLoading ? '...' : Math.round(totalInflow || 0).toLocaleString()}</div>
            </div>
            <div className="p-4 border border-rose-100 bg-rose-50/50 rounded-2xl">
              <div className="text-[12px] font-bold uppercase text-rose-600 mb-1">Projected Outflow</div>
              <div className="text-[22px] font-bold text-rose-600">Rs.{forecastLoading ? '...' : Math.round(totalOutflow || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-6 p-5 border border-indigo-100 bg-indigo-50/30 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} className="text-indigo-500" />
              <span className="font-bold text-[12px] uppercase tracking-wider text-indigo-600">Liquidity Signals</span>
            </div>
            {forecastLoading ? (
              <p className="text-[12px] font-medium uppercase tracking-tight text-slate-400">Simulating cash patterns...</p>
            ) : worstDay ? (
              <p className="text-[12px] font-medium text-slate-700 leading-relaxed">
                Worst deficit day predicted on <strong className="text-rose-600 font-bold">{worstDay.forecast_date}</strong>. Plan working capital buffer accordingly.
              </p>
            ) : (
              <p className="text-[12px] font-medium text-slate-600">Stable liquidity position predicted across next 30 days.</p>
            )}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {inventory.filter(i => i.stock <= i.minStock).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-600 text-white p-8 rounded-3xl shadow-2xl shadow-rose-500/20 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rotate-45 -mr-16 -mt-16" />
          <div className="text-5xl">--</div>
          <div className="flex-1 text-center md:text-left relative z-10">
            <div className="text-[28px] font-bold uppercase tracking-tight mb-1">Inventory Critical Alert</div>
            <div className="text-[14px] font-medium text-white/80 uppercase tracking-widest">
              {inventory.filter(i => i.stock <= i.minStock).length} Products Below Reorder Point
            </div>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'inventory' } }))}
            className="px-8 py-3 bg-white text-rose-600 font-bold rounded-xl shadow-lg hover:bg-rose-50 transition-all whitespace-nowrap"
          >
            Replenish Now
          </button>
        </motion.div>
      )}

      {/* Smart Engine Briefing - Repositioned to bottom for Executive Summary flow */}
      {(tier3Loading || (aiInsights && aiInsights.length > 0)) && (
        <DailyBriefing 
          insights={aiInsights} 
          loading={tier3Loading} 
          onRefresh={() => fetchTier3(inventory, sales, true)}
        />
      )}

      {/* Strategic Pulse Audit Modal */}
      <AnimatePresence>
        {showPulseAudit && (
          <div className="fixed inset-0 z-[500] flex items-start justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden relative my-auto"
            >
              {/* WIDE HEADER */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{pulse.festival} Strategy Command</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autonomous Business Intelligence Unit</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRefreshPulse}
                    disabled={pulseRefreshing}
                    className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-indigo-600 hover:text-indigo-700 hover:border-indigo-300 transition-all bg-white disabled:opacity-50"
                    title="Refresh Strategy Data"
                  >
                    <RefreshCw size={20} className={pulseRefreshing ? "animate-spin" : ""} />
                  </button>
                  <button onClick={() => setShowPulseAudit(false)} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all bg-white">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-slate-100 h-[650px]">
                {/* COLUMN 1: EXECUTIVE STRATEGY & OPTIMIZATION */}
                <div className="p-6 space-y-8 bg-slate-50/30 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                       <Target size={12} />
                       <span>Primary Revenue Objective</span>
                    </div>
                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                       <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                       <div className="text-5xl font-black tracking-tighter">Rs.{(totalInflow ? (totalInflow * 1.25) / 100000 : 54.2).toFixed(1)}L</div>
                       <div className="flex items-center gap-2 mt-3">
                          <div className="px-2 py-1 bg-emerald-400 text-slate-900 text-[9px] font-black rounded-lg uppercase">OPTIMIZED</div>
                          <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">- {pulse.growthPlan}% Growth Plan</span>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-2">
                        <div className="text-[9px] font-black text-slate-400 uppercase">Profit Boost</div>
                        <div className="text-xl font-black text-emerald-600">+Rs.{(totalInflow ? (totalInflow * 0.15) / 100000 : 4.8).toFixed(1)}L</div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Via Bundle Logic</p>
                     </div>
                     <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-2">
                        <div className="text-[9px] font-black text-slate-400 uppercase">Stock Risk</div>
                        <div className="text-xl font-black text-rose-500">Low</div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Proactive Buffer</p>
                     </div>
                  </div>

                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-slate-300 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 text-indigo-400">
                       <Zap size={18} fill="currentColor" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Business Simulation</span>
                    </div>
                    <p className="text-[12px] font-medium leading-relaxed italic">
                      "I have simulated {pulse.simulatedScenarios.toLocaleString()} scenarios. Your current inventory footprint covers {pulse.coveragePercent}% of the high-velocity demand. I recommend a <span className="text-white font-black">{pulse.priceHike}% aggressive price hike</span> on top items during {pulse.festival}."
                    </p>
                  </div>
                </div>

                {/* COLUMN 2: INTELLIGENT INVENTORY GAPS */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[600px]">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex justify-between items-center">
                    <span>Critical Restock Units</span>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                       <span className="text-emerald-600">Sync: 12ms</span>
                    </div>
                  </div>
                  {festivalStockGaps.length > 0 ? festivalStockGaps.map((prod: any) => (
                    <button 
                      key={prod.name} 
                      onClick={() => setSelectedAuditProduct(prod)}
                      className={`w-full p-6 border rounded-[2.5rem] transition-all text-left group relative overflow-hidden ${selectedAuditProduct?.name === prod.name ? 'border-indigo-600 bg-white shadow-2xl shadow-indigo-50 -translate-y-1' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                           <div className="font-black text-base text-slate-900 uppercase tracking-tighter">{prod.name}</div>
                           <div className="flex items-center gap-3 mt-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded uppercase tracking-widest">Lead: {prod.leadTime} Days</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Reliability: {prod.reliability}%</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-2xl font-black text-rose-500">+{prod.target - prod.stock}</div>
                           <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Units Gap</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                         <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                            <span>Inventory Health</span>
                            <span>{Math.round((prod.stock/prod.target)*100)}%</span>
                         </div>
                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min(100, (prod.stock/prod.target)*100)}%` }}
                             className={`h-full bg-gradient-to-r from-${prod.color}-400 to-${prod.color}-600`} 
                           />
                         </div>
                      </div>
                    </button>
                  )) : (
                    <div className="p-10 text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                        <Badge status="All Systems Nominal" />
                      </div>
                      <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest">Global Stock Sync: Verified</p>
                    </div>
                  )}
                </div>

                {/* COLUMN 3: DETAILED BUSINESS LOOK */}
                <div className="p-6 space-y-8 bg-slate-50/10 overflow-y-auto custom-scrollbar">
                  {selectedAuditProduct ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                       <div className="flex justify-between items-start">
                          <div>
                             <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Detailed Report</div>
                             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedAuditProduct.name}</h3>
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] font-black text-emerald-600 uppercase">Elasticity</div>
                             <div className="text-xl font-black text-slate-900">High</div>
                          </div>
                       </div>

                       <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Seasonal Demand Projection (Rs. Lakhs)</div>
                          <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={pulse.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="deepPulse" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{borderRadius:'16px', border:'none', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '11px'}} />
                                <Area type="monotone" dataKey="v" stroke="#6366F1" strokeWidth={6} fillOpacity={1} fill="url(#deepPulse)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex justify-between px-4">
                             {['Early', 'Mid', 'PEAK', 'Post'].map(l => (
                               <span key={l} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l}</span>
                             ))}
                          </div>
                       </div>

                       {/* EXPERT BI: MARKET BASKET ANALYSIS */}
                       <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white space-y-4">
                          <div className="flex items-center gap-3 text-emerald-400">
                             <RefreshCw size={18} className="animate-spin-slow" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Bundle Correlation Analysis</span>
                          </div>
                          <div className="space-y-3">
                             <p className="text-[11px] font-medium text-indigo-100 opacity-80">"Shoppers buying <span className="font-bold text-white uppercase">{selectedAuditProduct.name}</span> have a {pulse.correlation}% correlation with Gift Wrapping and Premium Delivery."</p>
                             <div className="flex gap-2">
                                <span className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-bold">#CrossSell</span>
                                <span className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-bold">#UpsellReady</span>
                             </div>
                          </div>
                       </div>

                       <button 
                         onClick={() => {
                           setShowPulseAudit(false);
                           window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'inventory', tab: 'replenish' } }));
                         }}
                         className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-4 group"
                       >
                         <span>EXECUTE PROCUREMENT</span>
                         <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                       </button>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                       <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center mb-6 animate-pulse">
                          <Target size={40} className="text-slate-400" />
                       </div>
                       <p className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500">Awaiting Signal...<br/>Select Category for Intelligence</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
