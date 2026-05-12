import { useState, useEffect } from "react";
import { replenishmentService, ReplenishmentDraft, InventoryInsight } from "../../services/replenishmentService";
import { useAuth } from "../../hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle, PackageSearch, Zap, TrendingDown, Layers, RefreshCcw, Ghost, ArrowRightLeft } from "lucide-react";
import { ActionBtn, Badge, Card } from "../common/UI";
import { useToast } from "../common/Toast";

export default function Replenishment() {
  const { profile } = useAuth();
  const [drafts, setDrafts] = useState<ReplenishmentDraft[]>([]);
  const [insights, setInsights] = useState<InventoryInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    try {
      const [dData, iData] = await Promise.all([
        replenishmentService.getDrafts(profile.business_id),
        replenishmentService.getInsights(profile.business_id)
      ]);
      setDrafts(dData);
      setInsights(iData);
    } catch (err) {
      console.error("Replenishment error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!profile?.business_id) return;
    setRefreshing(true);
    try {
      await replenishmentService.runIntelligenceEngine(profile.business_id);
      await fetchData();
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const executeOrder = async (draftId: string) => {
    const draft = drafts.find(d => d.product_id === draftId);
    if (!draft) return;
    
    const message = `*Vyapari PO Draft*%0AProduct: ${draft.product_name}%0AQuantity: ${draft.suggested_quantity}%0AStatus: ${draft.priority}`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
    
    setDrafts(prev => prev.filter(d => d.product_id !== draftId));
  };

  const executeAll = () => {
    toast("Order list generated! Ready to contact your suppliers.", "success");
    setDrafts([]);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Order Advice</h2>
          <div className="flex items-center gap-3 mt-4">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
               Updates automatically based on daily sales speed
             </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-neon transition-all"
          >
            <RefreshCcw size={16} className={refreshing ? "animate-spin text-neon" : "text-slate-400"} />
            {refreshing ? "Checking..." : "Check Stock Now"}
          </button>
          {drafts.length > 0 && (
            <ActionBtn onClick={executeAll} className="!px-10">
              Order All <Zap size={18} />
            </ActionBtn>
          )}
        </div>
      </div>

      {/* INTELLIGENCE FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Suggested Orders</h3>
          
          {loading ? (
            <div className="p-20 text-center brutal-card bg-white/50">
               <div className="w-16 h-16 border-4 border-neon border-t-transparent rounded-full animate-spin mx-auto mb-6" />
               <p className="font-black text-slate-300 text-[10px] uppercase tracking-[0.3em]">Checking your stock levels...</p>
            </div>
          ) : drafts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="brutal-card bg-white flex flex-col items-center justify-center p-20 text-center"
            >
              <PackageSearch size={48} className="text-emerald-500 mb-6" />
              <h3 className="font-black text-2xl text-slate-900 uppercase">Stock is Healthy!</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">No immediate reorders detected</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {drafts.map((draft, idx) => (
                  <motion.div
                    key={draft.product_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`brutal-card group hover:border-neon transition-all duration-500 ${draft.is_dead_stock ? 'bg-slate-50 border-dashed' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                       <Badge status={draft.priority === 'CRITICAL' ? "Overdue" : draft.priority === 'WATCH' ? "Pending" : "Completed"} />
                       {draft.is_dead_stock && (
                         <div className="flex items-center gap-2 text-rose-500">
                           <Ghost size={16} />
                           <span className="text-[10px] font-black uppercase tracking-tighter">DEAD STOCK</span>
                         </div>
                       )}
                    </div>
                    
                    <div className="mb-6">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Item Name</div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">{draft.product_name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-100">
                          <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Stock in Shop</div>
                          <div className="text-lg font-black text-slate-900">{draft.current_stock}</div>
                       </div>
                       <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-100">
                          <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Days Left</div>
                          <div className={`text-lg font-black ${draft.days_remaining < 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                             {draft.days_remaining} Days
                          </div>
                       </div>
                    </div>

                    <div className="mb-8 p-5 bg-neon/5 rounded-2xl border border-neon/10">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-neon uppercase tracking-widest">Suggested Order</span>
                          <TrendingDown className="text-neon" size={14} />
                       </div>
                       <div className="text-2xl font-black text-slate-900">{draft.eoq_quantity} <span className="text-xs text-slate-400 uppercase">Items</span></div>
                    </div>

                    {draft.substitution_id && (
                      <div className="mb-8 flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-tighter">
                        <ArrowRightLeft size={14} />
                        Similar item available in stock
                      </div>
                    )}

                    <ActionBtn onClick={() => executeOrder(draft.product_id)} className="w-full !py-4 !h-auto">
                       {draft.is_dead_stock ? "Create Discount Offer" : "Create Order"}
                    </ActionBtn>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* SIDEBAR INSIGHTS */}
        <div className="space-y-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Smart Tips</h3>
          <div className="space-y-4">
            {insights.map((insight) => (
              <motion.div 
                key={insight.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-5 bg-white border border-slate-200 rounded-3xl hover:border-neon transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full ${insight.severity === 'critical' ? 'bg-rose-500' : insight.severity === 'watch' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{insight.type}</span>
                </div>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{insight.message}</p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-[8px] font-black text-slate-300 uppercase">{new Date(insight.created_at).toLocaleTimeString()}</span>
                  <button className="text-[9px] font-black text-neon uppercase hover:underline">Details</button>
                </div>
              </motion.div>
            ))}
            {insights.length === 0 && !loading && (
              <div className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Everything is running smoothly!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


