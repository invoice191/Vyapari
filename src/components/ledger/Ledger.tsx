import { useState, useEffect } from "react";
import { ledgerService } from "../../services/ledgerService";
import { rfmService } from "../../services/rfmService";
import { Card, SectionHeader, Badge, KPICard, ActionBtn, SkeletonCard } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { 
  Plus, Search, Download, Calendar, Filter, Wallet, ArrowUpRight, 
  History, TrendingUp, Info, Zap, AlertCircle, CheckCircle, 
  Loader2, ArrowRight, UploadCloud, FileText, ArrowDownLeft
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import LedgerEntryModal from "./LedgerEntryModal";
import { useToast } from "../common/Toast";

import { useGlobalData } from "../../context/DataContext";
import { reportExporter } from "../../services/reportExporter";

export default function Ledger() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { ledger: entries, loading, refresh } = useGlobalData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rfmLabels, setRfmLabels] = useState<Record<string, string>>({});
  const [reconcileMode, setReconcileMode] = useState(false);
  const [reconciliationAttempts, setReconciliationAttempts] = useState<any[]>([]);
  const pageSize = 15;

  useEffect(() => {
    if (profile?.business_id) {
      const loadRFM = async () => {
        try {
          const data = await rfmService.getRFMSegments(profile.business_id);
          const mapping: Record<string, string> = {};
          Object.entries(data).forEach(([label, rows]: [string, any[]]) => {
            rows.forEach(r => {
              mapping[r.contact_id] = label;
            });
          });
          setRfmLabels(mapping);
        } catch (err) {
          console.error("RFM loading failed:", err);
        }
      };
      loadRFM();
    }
  }, [profile?.business_id]);

  useEffect(() => {
    // Check if we should open in reconcile mode via URL or state
    // For demo, we'll just check if there are attempts
    if (profile?.business_id) {
      const fetchAttempts = async () => {
        try {
          const { data, error } = await supabase.from('reconciliation_attempts')
            .select('*, ledger_entries(*), invoices(*)')
            .eq('business_id', profile.business_id)
            .eq('status', 'pending');
          if (error) throw error;
          setReconciliationAttempts(data || []);
        } catch (err) {
          console.error("Error fetching reconciliation attempts in Ledger:", err);
        }
      };
      fetchAttempts();
    }
  }, [profile?.business_id, entries]);

  useEffect(() => {
    // We can still trigger a manual refresh on mount if we want,
    // but useGlobalData handles it.
  }, [profile?.business_id]);

  useEffect(() => {
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  const handleImportCSV = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = await import("../../services/reconciliationService").then(m => m.reconciliationService.parseBankCSV(text));
      
      if (!parsed || parsed.length === 0) {
        alert("No valid transactions found in CSV.");
        return;
      }

      const toInsert = parsed.map((t: any) => ({
        business_id: profile?.business_id,
        entity_name: "CSV Import",
        description: t.description,
        type: t.type,
        amount: t.amount,
        date: new Date(t.date).toISOString() || new Date().toISOString()
      }));

      const { error } = await supabase.from('ledger_entries').insert(toInsert);
      if (error) throw error;
      
      alert(`Successfully imported ${toInsert.length} transactions.`);
      refresh('ledger_entries');
    } catch (err: any) {
      console.error(err);
      alert("Failed to parse CSV: " + err.message);
    } finally {
      setIsImporting(false);
      e.target.value = null;
    }
  };

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

  const handleConfirmReconciliation = async (attempt: any) => {
    try {
      // 1. Mark attempt as confirmed
      await supabase.from('reconciliation_attempts').update({ status: 'confirmed' }).eq('id', attempt.id);
      
      // 2. Mark invoice as paid (or update amount_paid)
      const { data: inv } = await supabase.from('invoices').select('amount_paid, total_amount').eq('id', attempt.matched_invoice_id).single();
      if (inv) {
        const newPaid = Number(inv.amount_paid || 0) + Number(attempt.ledger_entries.amount);
        await supabase.from('invoices').update({ 
          amount_paid: newPaid, 
          amount_remaining: Number(inv.total_amount) - newPaid,
          status: (Number(inv.total_amount) - newPaid) <= 0 ? 'paid' : 'partial'
        }).eq('id', attempt.matched_invoice_id);
      }
      
      // 3. Refresh
      refresh('invoices');
      refresh('ledger_entries');
      setReconciliationAttempts(prev => prev.filter(a => a.id !== attempt.id));
    } catch (err) {
      console.error("Reconciliation confirmation failed:", err);
    }
  };

  const handleExportPDF = () => {
    reportExporter.downloadPDF({
      type: 'ledger',
      title: 'Business Ledger Audit',
      businessName: profile?.business_name || 'Vyapari Retail',
      gstin: profile?.gstin || "",
      dateRange: { from: new Date().toISOString(), to: new Date().toISOString() },
      rows: filtered.map((e, i) => ({
        ...e,
        sr: i + 1,
        date: new Date(e.timestamp || e.created_at || e.date).toLocaleDateString('en-GB'),
        entity_name: e.contacts?.name || e.entity_name || 'General',
        amount_display: `${e.type === 'credit' ? '+' : '-'}Rs.${Number(e.amount).toLocaleString()}`
      })),
      columns: [
        { key: 'sr', label: '#', type: 'text' },
        { key: 'date', label: 'Date', type: 'text' },
        { key: 'entity_name', label: 'Party', type: 'text' },
        { key: 'description', label: 'Details', type: 'text' },
        { key: 'amount_display', label: 'Amount', type: 'text' }
      ],
      generatedBy: profile?.full_name || 'System',
      kpis: [
        { label: 'Available Cash', value: `Rs.${(cashOnHand / 1000).toFixed(1)}K` },
        { label: 'Pending Rec.', value: `Rs.${(pendingReceivables / 1000).toFixed(1)}K` }
      ]
    });
  };

  const handleExportCSV = () => {
    reportExporter.downloadCSV({
      type: 'ledger',
      title: 'Business Ledger Export',
      businessName: profile?.business_name || 'Vyapari Retail',
      gstin: profile?.gstin || "",
      dateRange: { from: new Date().toISOString(), to: new Date().toISOString() },
      rows: filtered.map(e => ({
        ...e,
        date: new Date(e.timestamp || e.created_at || e.date).toLocaleDateString('en-GB'),
        entity: e.contacts?.name || e.entity_name || 'General',
        type_label: e.type.toUpperCase()
      })),
      columns: [
        { key: 'date', label: 'Date', type: 'text' },
        { key: 'entity', label: 'Entity', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'type_label', label: 'Type', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'currency' }
      ],
      generatedBy: profile?.full_name || 'System'
    });
    toast("CSV exported successfully", "success");
  };

  if (reconcileMode) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Smart Helper</div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-950">Auto Payment Match</h2>
          </div>
          <button onClick={() => setReconcileMode(false)} className="px-6 py-2 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50">Back to History</button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {reconciliationAttempts.length === 0 ? (
            <div className="brutal-card p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                <CheckCircle size={32} />
              </div>
              <div className="text-sm font-black uppercase text-slate-900">All Done!</div>
              <p className="text-xs font-bold text-slate-400 uppercase">All recent bank deposits have been matched.</p>
            </div>
          ) : (
            reconciliationAttempts.map(attempt => (
              <motion.div 
                key={attempt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="brutal-card !p-8 flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="flex-1 space-y-2">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank Deposit Found</div>
                  <div className="text-lg font-black text-slate-950">{attempt.ledger_entries.description}</div>
                  <div className="text-2xl font-black text-emerald-600 tracking-tighter">₹{attempt.ledger_entries.amount.toLocaleString()}</div>
                </div>

                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ArrowUpRight size={20} />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Match Found ({attempt.confidence_score}% Accuracy)</div>
                  <div className="text-lg font-black text-slate-950">Bill #{attempt.invoices.invoice_number}</div>
                  <p className="text-[10px] font-bold text-slate-500 italic">"Why it matches: {attempt.matching_reason}"</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleConfirmReconciliation(attempt)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">Confirm Match</button>
                  <button className="px-6 py-3 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">Reject</button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <KPICard 
          title="Available Cash" 
          value={`Rs.${(cashOnHand / 1000).toFixed(1)}K`} 
          change={12.5} 
          changeLabel="net flow" 
          icon={<Wallet />} 
          color="#6366F1" 
        />
        <KPICard 
          title="Money to Collect" 
          value={`Rs.${(pendingReceivables / 1000).toFixed(1)}K`} 
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
        <div className="flex items-center justify-between mb-8">
           <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-950">Money History</div>
           {reconciliationAttempts.length > 0 && (
             <button 
               onClick={() => setReconcileMode(true)}
               className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 text-indigo-600 hover:bg-indigo-100 transition-all"
             >
               <Zap size={14} className="animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-wider">{reconciliationAttempts.length} Payment Matches Pending</span>
             </button>
           )}
        </div>

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
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              id="csv-upload" 
              accept=".csv" 
              className="hidden" 
              onChange={handleImportCSV} 
              disabled={isImporting}
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex items-center justify-center gap-2 px-6 h-[62px] rounded-2xl border-2 border-indigo-600/20 text-indigo-600 font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm">
              {isImporting ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
              IMPORT CSV
            </label>
            <div className="flex bg-slate-100 rounded-2xl p-1 gap-1 border border-slate-200">
              <button 
                onClick={handleExportPDF} 
                className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
              >
                <Download size={16} /> PDF
              </button>
              <button 
                onClick={handleExportCSV} 
                className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
              >
                <FileText size={16} /> CSV
              </button>
            </div>
            <ActionBtn onClick={() => setIsModalOpen(true)} className="!px-10 !h-[62px]">
              <Plus size={20} /> NEW ENTRY
            </ActionBtn>
          </div>
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
                       {entry.type === 'credit' ? '+' : '-'} Rs.{entry.amount.toLocaleString("en-IN")}
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
                - Previous
              </button>
              <div className="flex items-center px-3 text-[10px] font-black text-slate-700 font-mono">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 transition-all flex items-center gap-1 active:scale-95"
              >
                Next -
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

