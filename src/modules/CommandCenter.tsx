import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, Shield, Activity, 
  ArrowUpRight, 
  ChevronRight,
  Maximize2, Box, CreditCard, Brain,
  AlertTriangle, Eye, TrendingUp, Search, Calendar,
  CheckCircle, Filter, Clock
} from "lucide-react";
import { dssService } from "../services/dss/dssService";
import { warRoomService, TacticalAlert } from "../services/dss/warRoomService";
import { InventoryHeatmap } from "../components/3d/InventoryHeatmap";
import { useAuth } from "../hooks/useAuth";
import { systemAlertService, SystemAlert } from "../services/systemAlertService";
import { useGlobalData } from "../context/DataContext";
import { supabase } from "../lib/supabase";

export default function CommandCenter() {
  const [activeTier, setActiveTier] = useState<string>("operational");
  const [tacticalAlerts, setTacticalAlerts] = useState<TacticalAlert[]>([]);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dbAlerts, setDbAlerts] = useState<SystemAlert[]>([]);
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { user, profile } = useAuth();
  const { products, invoices, purchaseOrders, stockMovements, categories: dbCategories } = useGlobalData();

  // 1. Auto-switch logic: Morning (Ops), Evening (Strategic)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) {
      setActiveTier("strategic");
    } else {
      setActiveTier("operational");
    }
  }, []);

  // 2. Tactical Monitoring Loop
  useEffect(() => {
    const runTacticalAnalysis = () => {
      if (!products.length) return;
      const results = warRoomService.calculateMetrics(invoices, products, purchaseOrders, stockMovements);
      setTacticalAlerts(results.alerts);
      setLoading(false);
    };

    runTacticalAnalysis();
    // Neural Heartbeat: Refresh every 10 seconds for "real-time" feel
    const interval = setInterval(() => {
      runTacticalAnalysis();
      setRefreshKey(prev => prev + 1);
    }, 10 * 1000);
    return () => clearInterval(interval);
  }, [products, invoices, purchaseOrders, stockMovements]);

  // Fetch DB Alerts
  useEffect(() => {
    if (!profile?.business_id) return;

    const fetchDbAlerts = async () => {
      const data = await systemAlertService.getAlerts(profile.business_id);
      setDbAlerts(data);
    };

    fetchDbAlerts();

    const channel = systemAlertService.subscribeToAlerts(profile.business_id, (newAlert) => {
      setDbAlerts(prev => [newAlert, ...prev]);
    });

    return () => { supabase.removeChannel(channel); };
  }, [profile?.business_id]);

  // Fetch and Subscribe to Audit Logs (Live Activity)
  useEffect(() => {
    if (!profile?.business_id) return;

    const fetchLogs = async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('timestamp', { ascending: false })
        .limit(20);
      if (data) setLiveActivity(data);
    };

    fetchLogs();

    const channel = supabase
      .channel('live-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs', filter: `business_id=eq.${profile.business_id}` },
        (payload) => {
          setLiveActivity(prev => [payload.new, ...prev].slice(0, 20));
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [profile?.business_id]);

  // 3. Filtered Alerts
  const filteredAlerts = useMemo(() => {
    const combined = [
      ...tacticalAlerts.map(a => ({ ...a, source: 'tactical' as const })),
      ...dbAlerts.map(a => ({ 
        id: a.id, 
        title: a.title, 
        body: a.message, 
        severity: a.severity, 
        module: a.type, 
        timestamp: a.created_at,
        impact: 'CRITICAL' as const,
        source: 'db' as const
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return combined.filter(alert => {
      if (resolvedIds.has(alert.id)) return false;
      const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            alert.body.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = dateFilter ? alert.timestamp.startsWith(dateFilter) : true;
      return matchesSearch && matchesDate;
    });
  }, [tacticalAlerts, dbAlerts, resolvedIds, searchQuery, dateFilter]);

  // 4. Resolve Handler
  const handleResolve = async (alert: any) => {
    setResolvedIds(prev => new Set(prev).add(alert.id));
    
    if (alert.source === 'db') {
      await systemAlertService.resolveAlert(alert.id);
    }

    // Log to Audit Trail
    if (profile?.business_id) {
      await supabase.from('audit_logs').insert({
        business_id: profile.business_id,
        user_id: user?.id,
        action: 'RESOLVE_TACTICAL_ALERT',
        module: 'CommandCenter',
        metadata: { alert_id: alert.id, title: alert.title, resolution_time: new Date().toISOString() }
      });
    }
  };

  const categories = useMemo(() => {
    return ["All", ...dbCategories.map(c => c.name)];
  }, [dbCategories]);

  const stats = useMemo(() => {
    const metrics = warRoomService.calculateMetrics(invoices, products, purchaseOrders, stockMovements).metrics;
    const inventoryHealth = products.length ? (products.filter(p => (Number(p.quantity) || 0) > (Number(p.reorder_point) || 0)).length / products.length) * 100 : 0;
    
    return [
      { 
        label: "Revenue Velocity", 
        value: `${(metrics.velocity * 100).toFixed(0)}%`, 
        trend: metrics.velocity >= 1 ? "Positive" : "Lagging", 
        icon: TrendingUp, 
        color: metrics.velocity >= 1 ? "text-emerald-400" : "text-rose-400" 
      },
      { 
        label: "Inventory Health", 
        value: `${inventoryHealth.toFixed(0)}%`, 
        trend: "Healthy SKUs", 
        icon: Box, 
        color: "text-indigo-400" 
      },
      { 
        label: "Neural Anomalies", 
        value: tacticalAlerts.length, 
        trend: "Active Intelligence", 
        icon: Brain, 
        color: "text-amber-400" 
      },
    ];
  }, [invoices, products, purchaseOrders, stockMovements, tacticalAlerts]);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case 'WATCH': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case 'OPPORTUNITY': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="bg-slate-900 text-white p-10 rounded-3xl border border-white/10 shadow-2xl shadow-indigo-500/20 flex flex-wrap justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400">Tactical War Room - Live</div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [4, 12, 4], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
                    className="w-1 bg-indigo-400 rounded-full"
                  />
                ))}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white uppercase italic">COMMAND CENTER</h1>
        </div>
        
        <div className="flex flex-col items-end gap-4 relative z-10">
          <div className="flex gap-2 items-center bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isSubscribed ? 'Neural_Link_Active' : 'Neural_Link_Offline'}
            </span>
          </div>
          <div className="flex gap-3 bg-white/5 p-1 rounded-2xl border border-white/10">
            {["Operational", "Strategic"].map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier.toLowerCase())}
                className={`px-6 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${
                  activeTier === tier.toLowerCase() 
                  ? "bg-white text-slate-900 shadow-lg" 
                  : "text-slate-400 hover:text-white"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 bg-slate-50 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stat.trend}</div>
            </div>
            <div className="text-5xl font-black tracking-tighter mb-1 text-slate-900">{stat.value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left: 3D Visualizer */}
        <div className="xl:col-span-8">
          <div className="bg-slate-900 text-white rounded-[2rem] h-[700px] relative overflow-hidden flex flex-col border border-white/10 shadow-2xl">
            <div className="p-8 flex justify-between items-center relative z-10 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
              <div>
                <h3 className="text-[22px] font-black tracking-tight text-white uppercase italic">Inventory Resonance</h3>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.3em]">Active Sector Velocity Mapping</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                   <Filter size={14} className="text-indigo-400" />
                   <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-[12px] font-bold uppercase tracking-wider outline-none cursor-pointer"
                   >
                     {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                   </select>
                </div>
                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10">
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#050505] relative">
               <InventoryHeatmap selectedCategory={selectedCategory} />
            </div>

            <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl relative z-10 flex justify-between items-center">
              <div className="flex gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                  <span className="text-[12px] font-black uppercase tracking-widest text-slate-400">High_Velocity</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <span className="text-[12px] font-black uppercase tracking-widest text-slate-400">Stable_Stock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Intelligence Feed */}
        <div className="xl:col-span-4 flex flex-col space-y-8">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                  <Brain size={28} />
                </div>
                <div>
                  <h3 className="font-black tracking-tight text-xl text-slate-900 uppercase italic">Intelligence</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Neural Alerts</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4 mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Alert List */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-[400px]">
              <AnimatePresence mode="popLayout">
                {filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getSeverityStyles(alert.severity)}`}>
                        {alert.severity}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase">
                        {alert.module}
                      </span>
                    </div>
                    
                    <h4 className="font-black text-sm mb-2 text-slate-900 leading-tight uppercase">
                      {alert.title}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-6">
                      {alert.body}
                    </p>

                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Projected Impact</span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{alert.impact}</span>
                       </div>
                       <div className="flex gap-2">
                         <button 
                          onClick={() => handleResolve(alert)}
                          className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                         >
                           <CheckCircle size={18} />
                         </button>
                         <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md">
                           <ChevronRight size={18} />
                         </button>
                       </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                      <Shield size={48} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">All Clear</p>
                      <p className="text-[10px] font-bold text-slate-400">System operating within normal parameters</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
              
              {loading && <div className="text-[10px] font-black text-slate-200 animate-pulse text-center py-10 italic uppercase tracking-[0.5em]">Syncing_Neural_Feed...</div>}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('app:toast', {
                    detail: {
                      title: "Executing Strategic Command",
                      message: "Monsoon supply shift activated. Procurement pipelines prioritized for Rainwear and Agricultural sectors.",
                      type: 'smart'
                    }
                  }));
                  setRefreshKey(prev => prev + 1);
                }}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
              >
                <Zap size={18} className="text-indigo-400" />
                Execute Strategy
              </button>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-slate-900 text-white rounded-[2rem] p-8 border border-white/10 shadow-2xl flex flex-col h-[400px]">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={20} className="text-indigo-400" />
              <h3 className="font-black tracking-tight text-lg uppercase italic">Live Activity Feed</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {liveActivity.length > 0 ? liveActivity.map((log) => (
                <div key={log.id} className="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    log.severity === 'Critical' ? 'bg-rose-500' : 
                    log.severity === 'Warning' ? 'bg-amber-500' : 'bg-indigo-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-white truncate">{log.action}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{log.module} - {new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-[10px] font-black uppercase tracking-widest italic">
                  Monitoring_System_Pulses...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
