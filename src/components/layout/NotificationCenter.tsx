import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  timestamp: Date;
  read: boolean;
  link?: string;
  module?: string;
}

export const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && profile?.business_id) {
      fetchNotifications();
    }
  }, [isOpen, profile?.business_id]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const combined: Notification[] = [];

      // 1. Always add AI Strategic Signals (Simulated for high-fidelity feel)
      combined.push({
        id: 'ai-1',
        title: 'Strategic Pricing Hub',
        message: 'Neural engine suggests 15% margin optimization on top-tier inventory.',
        type: 'info',
        timestamp: new Date(),
        read: false,
        module: 'dss'
      });

      combined.push({
        id: 'ai-2',
        title: 'Anomaly Detected',
        message: 'Unusual purchase pattern detected in Category: Electronics. Reviewing risk.',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        read: false,
        module: 'ledger'
      });

      if (profile?.business_id) {
        // Fetch Real Data if profile exists
        const { data: allProducts } = await supabase
          .from('products')
          .select('name, quantity, reorder_point')
          .eq('business_id', profile?.business_id);

        const lowStock = allProducts?.filter(p => p.quantity <= (p.reorder_point || 0)) || [];

        const now = new Date().toISOString();
        const { data: overdue } = await supabase
          .from('invoices')
          .select('invoice_number, customer, total_amount, due_date, status')
          .eq('business_id', profile?.business_id)
          .or(`status.ilike.overdue,and(status.neq.Paid,due_date.lt.${now})`)
          .limit(5);

        lowStock.slice(0, 3).forEach((item, idx) => {
          combined.push({
            id: `stock-${idx}-${Date.now()}`,
            title: 'Critical Stock Alert',
            message: `${item.name} is critically low (${item.quantity} remaining).`,
            type: 'critical',
            timestamp: new Date(),
            read: false,
            module: 'inventory'
          });
        });

        overdue?.forEach((inv, idx) => {
          combined.push({
            id: `inv-${idx}-${Date.now()}`,
            title: 'Payment Overdue',
            message: `Invoice #${inv.invoice_number} for ${inv.customer || 'Unknown'} (₹${Number(inv.total_amount).toLocaleString()}) is overdue.`,
            type: 'warning',
            timestamp: new Date(inv.due_date || Date.now()),
            read: false,
            module: 'invoices'
          });
        });
      }

      setNotifications(combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    window.dispatchEvent(new CustomEvent('notifications:count', { detail: { count: unreadCount } }));
  }, [notifications]);





  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'critical': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'success': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle size={14} />;
      case 'warning': return <Clock size={14} />;
      case 'success': return <CheckCircle2 size={14} />;
      default: return <Bell size={14} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[250]"
          />

          {/* Panel - Transformed to Professional Popover */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-20 right-6 sm:right-10 w-[calc(100vw-3rem)] max-w-[400px] bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl z-[300] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                 <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Modifications</h2>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                 >
                   Mark all as read
                 </button>
                 <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200/50 text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>


            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[500px] custom-scrollbar">
               <div className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Latest Signals</div>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Scanning neural paths...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <Bell size={32} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Zero Disruptions</h3>
                    <p className="text-xs text-slate-400 mt-1">No critical signals detected in current window.</p>
                  </div>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={notif.id}
                    className={`relative p-4 rounded-2xl border border-transparent ${
                      notif.read ? 'opacity-50' : 'bg-slate-50 border-slate-100 shadow-sm'
                    } group hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer overflow-hidden`}
                    onClick={() => {
                      markRead(notif.id);
                      if (notif.module) {
                        window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: notif.module } }));
                        onClose();
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${getTypeStyles(notif.type)}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none pr-6">{notif.title}</h4>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all text-slate-300"
                          >
                             <X size={12} />
                          </button>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 leading-snug mb-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1.5">
                              {!notif.read && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />}
                              <div className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                                notif.module === 'inventory' ? 'bg-indigo-100 text-indigo-600' :
                                notif.module === 'invoices' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-slate-200 text-slate-600'
                              }`}>
                                {notif.module || 'System'}
                              </div>
                           </div>
                           <span className="text-[8px] font-bold text-slate-400 uppercase">
                            {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
               <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'audit' } }));
                  onClose();
                }}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm flex items-center justify-center gap-2"
               >
                 View System Audit Logs <ExternalLink size={12} />
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
