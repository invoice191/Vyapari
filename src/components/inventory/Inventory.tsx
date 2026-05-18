import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Replenishment from "./Replenishment";
import MasterInventoryControl from "./MasterInventoryControl";
import VisualVerification from "./VisualVerification";
import { supabase } from "../../lib/supabase";

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<"list" | "replenish" | "verify">("list");

  useEffect(() => {
    const handleDeepLink = (e: any) => {
      if (e.detail?.module === 'inventory' && e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('app:navigate', handleDeepLink);
    return () => {
      window.removeEventListener('app:navigate', handleDeepLink);
      supabase.removeAllChannels();
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <div className="flex gap-4 bg-slate-100/50 p-2 rounded-3xl border border-slate-200/40 backdrop-blur-md w-fit">
        {["list", "replenish", "verify"].map((t) => (
          <button 
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === t ? "bg-white text-neon shadow-xl shadow-indigo-500/10 border border-indigo-100" : "text-slate-400 hover:text-slate-600"}`}
          >
            {t === "list" ? "Your Stock" : t === "replenish" ? "Order Advice" : "vPOD Intelligence"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "list" ? (
            <MasterInventoryControl />
          ) : activeTab === "replenish" ? (
            <Replenishment />
          ) : (
            <VisualVerification />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
import { AnimatePresence } from "motion/react";


