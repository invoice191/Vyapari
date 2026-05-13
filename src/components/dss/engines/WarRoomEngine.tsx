import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Activity, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle2, Zap, Radar, 
  Skull, Target, Crosshair, Radio, Signal,
  MessageSquare, ArrowRight, RefreshCw, Loader2
} from 'lucide-react';
import { useGlobalData } from '../../../context/DataContext';
import { warRoomService, TacticalAlert } from '../../../services/dss/warRoomService';
import { Badge } from '../../common/UI';

export const WarRoomEngine: React.FC = () => {
  const { invoices, products, purchaseOrders, stockMovements } = useGlobalData();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<TacticalAlert[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    runWarRoom();
  }, [invoices, products, purchaseOrders, stockMovements]);

  const runWarRoom = () => {
    setLoading(true);
    setScanning(true);
    
    setTimeout(() => {
      const results = warRoomService.calculateMetrics(
        invoices, 
        products, 
        purchaseOrders || [], 
        stockMovements || []
      );
      setAlerts(results.alerts);
      setMetrics(results.metrics);
      setLoading(false);
      setScanning(false);
    }, 200);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-[2rem] bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
              <Radar size={32} className={scanning ? 'animate-spin' : ''} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                 Strategic War Room
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Tactical Command & Control - Live Signal Monitoring</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="text-right mr-4">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Link Status</div>
              <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                 Verified Live
              </div>
           </div>
           <button 
             onClick={runWarRoom}
             className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 transition-all group"
           >
              <RefreshCw size={14} className={scanning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} /> Rescan Signals
           </button>
        </div>
      </div>

      {scanning ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-6">
           <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-rose-500 rounded-full blur-2xl"
              />
              <Radar size={64} className="text-rose-500 relative z-10 animate-pulse" />
           </div>
           <div className="text-center">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.5em] mb-2">Decrypting Telemetry</h3>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Scanning sales velocity, SKU anomalies & supplier lag...</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* LEFT: LIVE ALERTS LIST */}
           <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <Signal size={16} className="text-rose-500" />
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Intercepted Signals ({alerts.length})</h3>
              </div>

              {alerts.length === 0 ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-12 text-center">
                   <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-6" />
                   <h4 className="text-lg font-black text-white uppercase italic">All Systems Nominal</h4>
                   <p className="text-xs text-slate-500 font-medium mt-2">No tactical threats or anomalies detected in current horizon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                   {alerts.map((alert, i) => (
                      <motion.div 
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-6 rounded-[2rem] border relative overflow-hidden group hover:shadow-2xl transition-all ${
                          alert.severity === 'CRITICAL' ? 'bg-rose-950/20 border-rose-500/30' :
                          alert.severity === 'WATCH' ? 'bg-amber-950/20 border-amber-500/30' :
                          'bg-indigo-950/20 border-indigo-500/30'
                        }`}
                      >
                         <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                            {alert.severity === 'CRITICAL' ? <Skull size={80} /> : <Target size={80} />}
                         </div>

                         <div className="flex gap-6 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                              alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                              alert.severity === 'WATCH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                              'bg-indigo-500/20 text-indigo-500 border-indigo-500/30'
                            }`}>
                               {alert.severity === 'CRITICAL' ? <ShieldAlert size={24} /> : <Radio size={24} />}
                            </div>

                            <div className="flex-1">
                               <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                     <h4 className="text-base font-black text-white uppercase italic tracking-tight">{alert.title}</h4>
                                     <Badge className={
                                       alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                                       alert.severity === 'WATCH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                                       'bg-indigo-500/20 text-indigo-500 border-indigo-500/30'
                                     }>{alert.severity}</Badge>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                               </div>
                               <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6 pr-12">"{alert.body}"</p>
                               
                               <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                  <div>
                                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Mission Impact</span>
                                     <span className={`text-sm font-black italic ${
                                       alert.severity === 'CRITICAL' ? 'text-rose-400' : 'text-indigo-400'
                                     }`}>{alert.impact}</span>
                                  </div>
                                  <button className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
                                    alert.severity === 'CRITICAL' ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-500/20' :
                                    'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                                  }`}>
                                     Execute Counter-Action <Crosshair size={12} />
                                  </button>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
              )}
           </div>

           {/* RIGHT: TACTICAL METRICS */}
           <div className="lg:col-span-4 space-y-8">
              {/* Radar Metric 1 */}
              <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                    <TrendingDown size={120} className="text-rose-500" />
                 </div>
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Velocity Index</h4>
                 <div className="flex items-end gap-3 mb-2">
                    <span className={`text-5xl font-black italic tracking-tighter ${metrics?.velocity < 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                       {(metrics?.velocity * 100).toFixed(1)}%
                    </span>
                    <div className={`mb-2 flex items-center gap-1 ${metrics?.velocity < 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                       {metrics?.velocity < 1 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    Sales velocity relative to last week baseline.
                 </p>
              </div>

              {/* Radar Metric 2 */}
              <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Activity size={120} className="text-amber-500" />
                 </div>
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Anomaly Count</h4>
                 <div className="flex items-end gap-3 mb-2">
                    <span className="text-5xl font-black italic tracking-tighter text-white">
                       {metrics?.anomalyCount || 0}
                    </span>
                    <div className="mb-2 text-amber-500 flex items-center gap-1">
                       <Radio size={20} className="animate-pulse" />
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    Unusual patterns detected in SKU movements.
                 </p>
              </div>

              {/* Action Log / History */}
              <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Deployment Log</h4>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Session: {new Date().getHours()}:00</span>
                 </div>
                 <div className="space-y-4">
                    <LogItem time="14:22" event="Signal Scanned" status="Success" />
                    <LogItem time="14:05" event="Neural Link Stable" status="Success" />
                    <LogItem time="13:45" event="DDS Data Synced" status="Success" />
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const LogItem = ({ time, event, status }: { time: string, event: string, status: string }) => (
  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
     <div className="flex items-center gap-3">
        <span className="text-slate-600">{time}</span>
        <span className="text-slate-300">{event}</span>
     </div>
     <span className="text-emerald-500">{status}</span>
  </div>
);
