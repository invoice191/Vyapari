import { useState, useEffect } from "react";
import { ledgerService } from "../../services/ledgerService";
import { rfmService } from "../../services/rfmService";
import { Card, SectionHeader, Badge, KPICard, ActionBtn, SkeletonCard } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { Search, Plus, Wallet, ArrowUpRight, ArrowDownLeft, Calendar, History } from "lucide-react";
import { supabase } from "../../lib/supabase";
import LedgerEntryModal from "./LedgerEntryModal";

import { useGlobalData } from "../../contexts/DataContext";

export default function Ledger() {
  const { profile } = useAuth();
  const { ledger: entries, loading, refresh } = useGlobalData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rfmLabels, setRfmLabels] = useState<Record<string, string>>({});
  const pageSize = 15;

  useEffect(() => {
    if (profile?.business_id) {
      rfmService.getRFMSegments(profile.business_id)
        .then(data => {
          const mapping: Record<string, string> = {};
          Object.entries(data).forEach(([label, rows]: [string, any[]]) => {
            rows.forEach(r => {
              mapping[r.contact_id] = label;
            });
          });
          setRfmLabels(mapping);
        })
        .catch(err => console.error("RFM loading failed:", err));
    }
  }, [profile?.business_id]);

  useEffect(() => {
    // We can still trigger a manual refresh on mount if we want,
    // but useGlobalData handles it.
  }, [profile?.business_id]);

  useEffect(() => {
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  const filtered = entries.filter(e => {
    const contactName = e.contacts?.name?.toLowerCase() || "";
    const entityName = e.entity_name?.toLowerCase() || "";
    const desc = e.description?.toLowerCase() || "";
    const phone = e.contacts?.phone || "";
    const gstin = e.contacts?.gstin?.toLowerCase() || "";
    const s = search.toLowerCase();
    const matchSearch = !search || contactName.includes(s) || entityName.includes(s) || desc.includes(s) || phone.includes(s) || gstin.includes(s);
    return matchSearch;
  });

  const totalCount = filtered.length;
  const paginatedEntries = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);
  const cashOnHand = (entries || []).reduce((a, b) => a + (b.type === 'credit' ? b.amount : -b.amount), 0);
  const pendingReceivables = (entries || []).filter(e => !e.is_paid).reduce((a, b) => a + b.amount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <KPICard 
          title="Cash Liquidity" 
          value={`₹${(cashOnHand / 1000).toFixed(1)}K`} 
          change={12.5} 
          changeLabel="net flow" 
          icon={<Wallet />} 
          color="#6366F1" 
        />
        <KPICard 
          title="Pending Receivables" 
          value={`₹${(pendingReceivables / 1000).toFixed(1)}K`} 
          change={-3.2} 
          changeLabel="settled" 
          icon={<History />} 
          color="#F59E0B" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card !p-10"
      >
        <div className="flex flex-col lg:flex-row gap-8 mb-12 items-start lg:items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors" size={20} />
            <input 
              placeholder="Search by entity, invoice ID or reason..." 
              className="brutal-input !pl-14 !p-5 !text-base"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <ActionBtn onClick={() => setIsModalOpen(true)} className="!px-10 !h-[62px]">
            <Plus size={20} /> NEW ENTRY
          </ActionBtn>
        </div>

        <div className="overflow-x-auto -mx-10">
          <table className="w-full min-w-[900px] border-separate border-spacing-y-4 px-10">
            <thead>
              <tr>
                {["Date", "Party / Person", "Details", "Type", "Amount"].map(h=>(
                  <th key={h} className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-8"><SkeletonCard /></td></tr>
              ) : paginatedEntries.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center font-black text-slate-300 text-xs uppercase tracking-[0.3em]">No transaction entries recorded yet</td></tr>
              ) : paginatedEntries.map((entry, idx) => (
                <motion.tr 
                  key={entry.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-slate-50 transition-all duration-300"
                >
                  <td className="px-8 py-6 bg-white/40 group-hover:bg-white rounded-l-[2rem] transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-slate-300" />
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{new Date(entry.timestamp || entry.created_at || entry.date).toLocaleDateString('en-GB')}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 bg-white/40 group-hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900">{entry.entity_name}</span>
                      {entry.contact_id && rfmLabels[entry.contact_id] && (
                        <span style={{
                          background: {
                            'Champion':    '#22c55e',
                            'Loyal':       '#3b82f6',
                            'Promising':   '#8b5cf6',
                            'At Risk':     '#f59e0b',
                            'Cannot Lose': '#ef4444',
                            'Lost':        '#6b7280',
                            'New':         '#FF5500',
                          }[rfmLabels[entry.contact_id]] || '#FF5500',
                          color: '#fff',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {rfmLabels[entry.contact_id]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 bg-white/40 group-hover:bg-white transition-colors">
                    <div className="text-xs font-bold text-slate-400 max-w-xs truncate">{entry.description}</div>
                  </td>
                  <td className="px-8 py-6 bg-white/40 group-hover:bg-white transition-colors">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full w-fit font-black text-[9px] uppercase tracking-widest ${entry.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {entry.type === 'credit' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                      {entry.type === 'credit' ? 'Money In' : 'Money Out'}
                    </div>
                  </td>
                  <td className={`px-8 py-6 bg-white/40 group-hover:bg-white rounded-r-[2rem] text-right transition-colors`}>
                    <div className={`text-base font-black tracking-tighter ${entry.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {entry.type === 'credit' ? '+' : '-'} ₹{entry.amount.toLocaleString("en-IN")}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {Math.ceil(totalCount / pageSize) > 1 && (
          <div className="flex justify-between items-center px-10 py-5 mt-4 bg-white/40 border border-slate-200/40 rounded-[2rem] backdrop-blur-3xl">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} Transactions
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 transition-all flex items-center gap-1 active:scale-95"
              >
                ◀ Previous
              </button>
              <div className="flex items-center px-3 text-[10px] font-black text-slate-700 font-mono">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 transition-all flex items-center gap-1 active:scale-95"
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <LedgerEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={() => refresh('ledger_entries')} 
        businessId={profile?.business_id ?? ''} 
      />
    </motion.div>
  );
}

