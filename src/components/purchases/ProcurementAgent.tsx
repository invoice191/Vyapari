import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  MessageSquare, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Zap,
  Users,
  Search,
  RefreshCw,
  ShoppingCart,
  Phone
} from 'lucide-react';
import { toast } from '../common/Toast';
import { useAuth } from '../../hooks/useAuth';
import { procurementService, ReorderDraft } from '../../services/procurementService';
import { supabase } from '../../lib/supabase';

export default function ProcurementAgent({ runDraft = false }: { runDraft?: boolean }) {
  const { profile } = useAuth();
  const [drafts, setDrafts] = useState<ReorderDraft[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');

  useEffect(() => {
    if (runDraft || (profile?.business_id && drafts.length === 0)) {
      fetchDrafts();
    }
  }, [profile?.business_id, runDraft]);

  const fetchDrafts = async () => {
    if (!profile?.business_id) return;
    setIsProcessing(true);
    toast.info("Scanning inventory velocity logs...");
    try {
      const data = await procurementService.generateReorderDrafts(profile.business_id);
      setDrafts(data);
      if (data.length > 0) {
        toast.success(`VANI identified ${data.length} items staged for replenishment.`, 'Scan Complete');
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to scan inventory.", 'Database Sync Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (draft: ReorderDraft) => {
    if (!profile?.business_id) return;
    
    toast.info(`Finalizing PO for ${draft.product_name}...`, 'Procurement Engine');
    try {
      // 1. Create real PO
      const po = await procurementService.finalizeDraft(profile.business_id, draft);
      
      // 2. Dispatch to Supplier
      await procurementService.dispatchToSupplier(draft, po.id);
      
      toast.success(`Purchase Order PO-${po.id.slice(0,8)} registered & dispatched to ${draft.supplier_name}.`, 'PO Successful');
      setDrafts(prev => prev.filter(d => d.product_id !== draft.product_id));
    } catch (err: any) {
      console.error(err);
      toast.error(`Procurement execution failed: ${err.message || err}`, 'Execution Blocked');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#9FEF00] text-slate-950 flex items-center justify-center rounded-2xl shadow-[0_0_30px_rgba(159,239,0,0.3)]">
              <Bot size={28} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Agentic Procurement</h1>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest pl-1">Autonomous Supply Chain Orchestrator</p>
        </div>

        <div className="relative z-10 flex gap-3">
          <button 
            onClick={fetchDrafts}
            disabled={isProcessing}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />} 
            Scan Inventory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* REORDER DRAFTS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">Intelligent Reorder Drafts</h3>
            <span className="flex items-center gap-2 text-[10px] font-black text-[#9FEF00] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9FEF00] animate-pulse" /> VANI Agent Active
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {drafts.length === 0 && !isProcessing ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-slate-900/50 border border-dashed border-slate-800 rounded-[2rem] p-12 text-center"
              >
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart size={24} className="text-slate-500" />
                </div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No replenishment needed at this time.</p>
              </motion.div>
            ) : (
              drafts.map((draft) => (
                <motion.div
                  key={draft.product_id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden text-slate-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <Zap size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg">{draft.product_name}</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users size={12} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">{draft.supplier_name}</span>
                          </div>
                          {draft.supplier_phone && (
                             <div className="flex items-center gap-1">
                              <Phone size={10} className="text-emerald-500" />
                              <span className="text-[10px] font-bold text-slate-400">{draft.supplier_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proposed Qty</div>
                      <div className="text-indigo-400 font-black text-xl">{draft.quantity} <span className="text-[10px] opacity-50">PCS</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 mb-6">
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unit Cost</span>
                      <div className="font-black text-white">₹{draft.unit_cost.toLocaleString()}</div>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-800" />
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Order Value</span>
                      <div className="font-black text-emerald-400">₹{draft.total_cost.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 italic">"Autonomous reorder based on historical consumption velocity."</p>
                    <button 
                      onClick={() => handleApprove(draft)}
                      className="px-6 py-3 bg-[#9FEF00] text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#b0ff1a] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#9FEF00]/10"
                    >
                      Authorize & Dispatch
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* AGENT STATS */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10" />
            <h3 className="text-xl font-black uppercase tracking-tighter mb-8">Supply Chain Health</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                  <span>Stock Availability</span>
                  <span>84%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#9FEF00] w-[84%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                  <span>Replenishment Speed</span>
                  <span>Fast</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[90%]" />
                </div>
              </div>
            </div>

            <div className="mt-12 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={16} className="text-[#9FEF00]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Protocol: VANI-SENTINEL</span>
              </div>
              <p className="text-[10px] font-bold opacity-70 leading-relaxed">
                Agent is monitoring low safety stock levels. Staging demonstration items when active stock is depleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
