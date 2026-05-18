import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingDown, UserX, CheckCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { systemAlertService, SystemAlert } from '../../services/systemAlertService';
import { fraudGuardService } from '../../services/fraudGuardService';

export const FraudGuard: React.FC<{ businessId: string }> = ({ businessId }) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    // Subscribe to new alerts
    const subscription = systemAlertService.subscribeToAlerts(businessId, (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [businessId]);

  const loadAlerts = async () => {
    try {
      const data = await systemAlertService.getAlerts(businessId);
      setAlerts(data.filter(a => ['FRAUD', 'MARGIN_RISK', 'VENDOR_RISK'].includes(a.type)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (id: string) => {
    await systemAlertService.resolveAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-2xl">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Neural Fraud Guard</h1>
            <p className="text-gray-400">Real-time margin protection and vendor anomaly detection</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl">
            <span className="text-red-400 text-sm font-medium uppercase tracking-wider">Risk Level</span>
            <div className="text-2xl font-bold text-red-500">
              {alerts.length > 5 ? 'CRITICAL' : alerts.length > 0 ? 'ELEVATED' : 'STABLE'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white px-2">Active Anomalies</h2>
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Scanning neural patterns...</div>
            ) : alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center"
              >
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-white font-medium">No Threats Detected</h3>
                <p className="text-gray-400 text-sm mt-2">All transactions and margins are within healthy parameters.</p>
              </motion.div>
            ) : (
              alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative overflow-hidden bg-white/5 border border-white/10 p-6 rounded-3xl group hover:border-red-500/30 transition-all duration-500`}
                >
                  <div className="flex gap-5">
                    <div className={`p-4 rounded-2xl ${
                      alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                    }`}>
                      {alert.type === 'MARGIN_RISK' ? <TrendingDown className="w-6 h-6" /> : 
                       alert.type === 'VENDOR_RISK' ? <UserX className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white">{alert.title}</h3>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-1 leading-relaxed">{alert.message}</p>
                      
                      {alert.metadata?.recommendations && (
                        <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">AI Recommendation</p>
                          <p className="text-sm text-gray-300 italic">"Adjust pricing strategy or verify vendor credentials immediately."</p>
                        </div>
                      )}

                      <div className="mt-6 flex gap-3">
                        <button 
                          onClick={() => resolveAlert(alert.id)}
                          className="px-4 py-2 bg-white/10 hover:bg-emerald-500/20 text-white hover:text-emerald-400 rounded-xl text-sm font-medium transition-all"
                        >
                          Dismiss & Audit
                        </button>
                        <button className="px-4 py-2 border border-white/10 hover:bg-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 p-6 rounded-3xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              Vendor Benchmarking
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Avg. Market Drift</span>
                <span className="text-emerald-400 font-mono">-2.4%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Suspect Vendors</span>
                <span className="text-red-400 font-mono">1 Active</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-indigo-500 w-3/4 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 text-center">Data refreshed 2 mins ago via Neural Mesh</p>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl">
            <h3 className="text-emerald-400 font-bold mb-2">Shield Status</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Your margin protection shield is currently monitoring 124 SKUs. High-risk pricing has been auto-flagged in the feed.
            </p>
            <button className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
              Update Thresholds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
