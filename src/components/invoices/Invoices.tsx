import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus,  Lock, Key, Globe, Eye, Zap, Layers, FileText, Download,
  CloudLightning, ExternalLink, Trash2, CheckSquare, Square, RefreshCw, AlertTriangle, MessageSquare, Repeat, X, Search, Settings2
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { invoiceService } from "../../services/invoiceService";
import { dunningService } from "../../services/dunningService";
import InvoiceCreateModal from "./InvoiceCreateModal";
import InvoiceTimeline from "./InvoiceTimeline";
import InvoiceDetailModal from "./InvoiceDetailModal";
import { Badge, ActionBtn } from "../common/UI";
import { useRBAC } from "../../hooks/useRBAC";
import { auditService } from "../../services/auditService";
import { useToast } from "../common/Toast";
import InvoiceAIConsole from "./InvoiceAIConsole";
import InvoiceAnalytics from "./InvoiceAnalytics";
import RecurringInvoices from "./RecurringInvoices";
import AutoReconciliation from "./AutoReconciliation";
import { Sparkles, Activity } from "lucide-react";

import { useGlobalData } from "../../context/DataContext";
import { reportExporter } from "../../services/reportExporter";

export default function Invoices() {
  const { profile, business } = useAuth();
  const { can, isOwner } = useRBAC();
  const { invoices, contacts, loading, refresh } = useGlobalData();
  const { toast } = useToast();
  const [remindInvoice, setRemindInvoice] = useState<any>(null);
  const [reminderTone, setReminderTone] = useState<'friendly' | 'professional' | 'urgent' | 'incentive'>('friendly');
  const [customDiscount, setCustomDiscount] = useState<number>(2);
  const [editableMsg, setEditableMsg] = useState("");

  useEffect(() => {
    if (!remindInvoice) return;
    const bName = business?.name || "Our Store";
    const cName = remindInvoice.contacts?.name || "Valued Customer";
    const iNum = remindInvoice.invoice_number || "INV-000";
    const amt = (remindInvoice.total_amount || 0).toLocaleString("en-IN");
    const dDate = remindInvoice.due_date ? new Date(remindInvoice.due_date).toLocaleDateString("en-IN") : "Due Date";

    if (reminderTone === 'friendly') {
      setEditableMsg(`-- Hello ${cName}, this is a polite reminder from ${bName}. Just keeping you in the loop that Invoice #${iNum} (INR ${amt}) is scheduled for payment by ${dDate}. Thank you for your support!`);
    } else if (reminderTone === 'professional') {
      setEditableMsg(`Dear ${cName}, we hope this message finds you well. This is a formal notification regarding outstanding Invoice #${iNum} for INR ${amt}, due on ${dDate}. Please settle at your earliest convenience. Kind regards, the Accounts Team at ${bName}.`);
    } else if (reminderTone === 'urgent') {
      setEditableMsg(`-- URGENT: Invoice #${iNum} for INR ${amt} is overdue. Immediate settlement is required to prevent any impact on your credit evaluation. Settle now to maintain your healthy business relationship with ${bName}.`);
    } else if (reminderTone === 'incentive') {
      const discountAmount = Math.round((remindInvoice.total_amount || 0) * (customDiscount / 100));
      const payableAmount = (remindInvoice.total_amount || 0) - discountAmount;
      setEditableMsg(`--- Early Settle Offer! Settle Invoice #${iNum} (INR ${amt}) within 24 hours to secure a ${customDiscount}% early payment discount (Save INR ${discountAmount.toLocaleString("en-IN")}). Pay only INR ${payableAmount.toLocaleString("en-IN")}! - ${bName}`);
    }
  }, [remindInvoice, reminderTone, customDiscount, business]);
  const businessId = profile?.business_id ?? "";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [prefill, setPrefill] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPayMode, setBulkPayMode] = useState("upi");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [dunningMsg, setDunningMsg] = useState("");
  const [showDunning, setShowDunning] = useState(false);
  const [isNlThinking, setIsNlThinking] = useState(false);
  const [showInvoiceAI, setShowInvoiceAI] = useState(false);
  const [showAutoReconcile, setShowAutoReconcile] = useState(false);
  const [hoveredInvoice, setHoveredInvoice] = useState<any>(null);
  const [peekPos, setPeekPos] = useState({ x: 0, y: 0 });
  const handleExportPDF = () => {
    reportExporter.downloadPDF({
      type: 'sales',
      title: 'Sales & Invoice Summary',
      businessName: business?.name || 'My Business',
      gstin: business?.gstin || "",
      dateRange: { from: invoices[invoices.length-1]?.invoice_date || new Date().toISOString(), to: new Date().toISOString() },
      rows: invoices.map(inv => ({
        ...inv,
        customer: inv.contacts?.name || 'Walk-in',
        outstanding: inv.total_amount - (inv.amount_paid || 0),
        status_display: (inv.status || 'Sent').toUpperCase()
      })),
      columns: [
        { key: 'invoice_number', label: 'Invoice #', type: 'text' },
        { key: 'customer', label: 'Customer', type: 'text' },
        { key: 'invoice_date', label: 'Date', type: 'date' },
        { key: 'total_amount', label: 'Total', type: 'currency' },
        { key: 'outstanding', label: 'Pending', type: 'currency' },
        { key: 'status_display', label: 'Status', type: 'text' }
      ],
      generatedBy: profile?.full_name || 'System',
      kpis: [
        { label: 'Total Sales', value: `Rs.${(invoices.reduce((a,b)=>a+b.total_amount,0)/1000).toFixed(1)}K` },
        { label: 'Total Pending', value: `Rs.${(invoices.reduce((a,b)=>a+(b.total_amount - (b.amount_paid||0)),0)/1000).toFixed(1)}K` }
      ]
    });
  };

  useEffect(() => {
    // refresh() is handled by DataProvider on mount
  }, [businessId]);

  useEffect(() => {
    const handleGlobalNav = (e: any) => {
      if (e.detail?.module === 'invoices' && e.detail?.props) {
        const { mode, prefill } = e.detail.props;
        if (mode === 'create') {
          setPrefill(prefill);
          setShowCreate(true);
        }
      }
    };
    const handleSearch = (e: any) => {
      if (typeof e.detail === 'string') {
        setSearch(e.detail === 'latest' ? '' : e.detail);
        setActiveTab('list');
      }
    };
    window.addEventListener('app:navigate', handleGlobalNav);
    window.addEventListener('app:invoice-search', handleSearch);
    return () => {
      window.removeEventListener('app:navigate', handleGlobalNav);
      window.removeEventListener('app:invoice-search', handleSearch);
      supabase.removeAllChannels();
    };
  }, []);

  const filtered = invoices.filter(inv => {
    const name = (inv.contacts?.name ?? inv.customer_name ?? "General Customer").toLowerCase();
    const num = (inv.invoice_number ?? "").toLowerCase();
    const phone = inv.contacts?.phone || "";
    const gstin = inv.contacts?.gstin?.toLowerCase() || "";
    const s = search.toLowerCase();
    const matchSearch = !search || name.includes(s) || num.includes(s) || phone.includes(s) || gstin.includes(s);
    
    let matchStatus = true;
    if (filterStatus !== "All") {
      if (filterStatus === "Pending") {
        matchStatus = ["draft", "sent", "viewed", "partial"].includes(inv.status?.toLowerCase());
      } else {
        matchStatus = inv.status?.toLowerCase() === filterStatus.toLowerCase();
      }
    }

    // Advanced Competitor Filters
    const amount = inv.total_amount || 0;
    const matchMinAmount = !minAmount || amount >= parseFloat(minAmount);
    const matchMaxAmount = !maxAmount || amount <= parseFloat(maxAmount);

    let matchDate = true;
    if (datePreset && datePreset !== 'all') {
      const invDate = new Date(inv.invoice_date || inv.created_at);
      const now = new Date();
      const diffTime = now.getTime() - invDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

      if (datePreset === 'today') {
        matchDate = diffDays <= 0;
      } else if (datePreset === 'week') {
        matchDate = diffDays <= 7;
      } else if (datePreset === 'month') {
        matchDate = diffDays <= 30;
      } else if (datePreset === 'overdue7') {
        matchDate = inv.status?.toLowerCase() === 'overdue' && diffDays > 7;
      } else if (datePreset === 'overdue30') {
        matchDate = inv.status?.toLowerCase() === 'overdue' && diffDays > 30;
      }
    }

    return matchSearch && matchStatus && matchMinAmount && matchMaxAmount && matchDate;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, minAmount, maxAmount, datePreset]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedInvoices = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totals = {
    total: invoices.reduce((a, i) => a + (Number(i.total_amount) || 0), 0),
    paid: invoices.reduce((a, i) => a + (Number(i.amount_paid) || 0), 0),
    pending: invoices.reduce((a, i) => a + (Number(i.amount_remaining) || 0), 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((a, i) => a + (Number(i.amount_remaining) || 0), 0),
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkMarkPaid = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    await supabase
      .from("invoices")
      .update({ status: "paid", payment_method: bulkPayMode })
      .in("id", Array.from(selected));
    setSelected(new Set());
    setBulkMode(false);
    setBulkLoading(false);
    refresh('invoices');
  };

  const billLikeLastTime = async (inv: any) => {
    const { data } = await supabase.rpc("get_last_invoice_template", {
      p_business_id: businessId,
      p_contact_id: inv.contact_id,
    });
    if (!data?.length) return toast("No previous invoice found for this customer.", "info");
    setPrefill({ contact_id: inv.contact_id, items: data });
    setSelectedInvoice(null);
    setShowCreate(true);
  };



  const selectInvoiceWithItems = async (inv: any) => {
    setSelectedInvoice(inv);
    const { data } = await supabase.from('invoice_items')
      .select('*, products(name)')
      .eq('invoice_id', inv.id);
    setSelectedInvoiceItems(data ?? []);
  };

  const handleVoidInvoice = async (inv: any) => {
    const reason = prompt("Mandatory: Please provide a reason for voiding this invoice.");
    if (!reason) return;

    try {
      await invoiceService.voidInvoice(businessId, inv.id, profile?.id, reason);
      refresh('invoices');
    } catch (e) {
      console.error(e);
      toast("Failed to void invoice.", "error");
    }
  };

  const handleExportLogs = async () => {
    if (!isOwner) return;
    try {
      await auditService.exportLogs(businessId, business?.name || "Vyapari Business");
    } catch (e) {
      toast("Export failed.", "error");
    }
  };

  const [activeTab, setActiveTab] = useState<'list' | 'analytics' | 'recurring' | 'ai'>('list');

  if (loading) return <div className="p-10 text-center text-xs font-black uppercase text-ink/40 animate-pulse">Loading Invoice Intelligence...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      {/* -- TAB SWITCHER -- */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200">
          {[
            { id: 'list', label: 'All Bills', icon: <FileText size={14} /> },
            { id: 'analytics', label: 'Sales Insight', icon: <Sparkles size={14} /> },
            { id: 'recurring', label: 'Automatic Bills', icon: <Repeat size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-xl' 
                  : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' ? (
          <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
             <InvoiceAnalytics />
          </motion.div>
        ) : activeTab === 'recurring' ? (
          <motion.div key="recurring" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
             <RecurringInvoices />
          </motion.div>
        ) : activeTab === 'ai' ? (
          <motion.div key="ai" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
             <InvoiceAIConsole 
               invoices={invoices} 
               contacts={contacts} 
               fetchInvoices={() => refresh('invoices')} 
             />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
      {/* Premium Finance Banner */}
      <div className="bg-slate-950 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -ml-32 -mb-32" />
        
        {/* Dot Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="dot-grid-dark-inv" width="6" height="6" patternUnits="userSpaceOnUse">
                <circle cx="0.5" cy="0.5" r="0.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#dot-grid-dark-inv)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                <FileText size={24} />
              </div>
              <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
                 Money Live
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Bills & <span className="text-indigo-500">Orders</span></h1>
            <p className="text-slate-400 mt-6 text-sm font-medium max-w-lg leading-relaxed uppercase tracking-[0.2em] text-[9px]">
              Complete control over your sales, revenue tracking, and customer payments.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center min-w-[150px] backdrop-blur-xl">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Revenue</div>
               <div className="text-2xl font-black text-white">Rs.{(totals.total / 1000).toFixed(1)}K</div>
            </div>
            <div className="p-6 bg-rose-600/10 border border-rose-500/20 rounded-3xl text-center min-w-[150px] backdrop-blur-xl">
               <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">At Risk</div>
               <div className="text-2xl font-black text-white">Rs.{(totals.overdue / 1000).toFixed(1)}K</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Ledger Flow (Repositioned) */}
      <div className="glass-card !p-8 relative overflow-hidden border border-slate-100/50">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Settlement Progress</div>
            <div className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
              Rs.{(totals.paid/1000).toFixed(1)}K Collected <span className="text-slate-300 mx-2">/</span> <span className="text-indigo-600">Rs.{(totals.total/1000).toFixed(1)}K Total</span>
            </div>
          </div>
        </div>
        
        <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(totals.paid / totals.total) * 100}%` }}
            className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(totals.pending / totals.total) * 100}%` }}
            className="h-full bg-indigo-400 opacity-40"
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(totals.overdue / totals.total) * 100}%` }}
            className="h-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
          />
        </div>

        <div className="flex justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Settled Assets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Delayed Collections</span>
          </div>
        </div>
      </div>


      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="brutal-card !p-10"
      >
        <div className="space-y-6">
          {/* Row 1: Search & Filter Hub */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-100">
            <div className="relative flex-1 max-w-2xl group">
              <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Search size={18} strokeWidth={3} />
              </span>
              <input
                placeholder="Search by customer or invoice #..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl font-black text-xs uppercase tracking-widest outline-none text-slate-800 transition-all placeholder-slate-400 shadow-sm"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
              {["All","Paid","Pending","Overdue"].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus.toLowerCase()===s.toLowerCase() ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Utilities & Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-2 rounded-2xl border transition-all flex items-center gap-2.5 font-black text-[10px] uppercase tracking-widest ${showAdvancedFilters ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300"}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${showAdvancedFilters ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                  <Settings2 size={14} />
                </div>
                Filters
              </button>
              
               <button 
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-2xl border transition-all flex items-center gap-2.5 font-black text-[10px] uppercase tracking-widest ${(activeTab as string) === 'ai' ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-white text-indigo-600 border-indigo-100 hover:border-indigo-200 shadow-sm"}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${(activeTab as string) === 'ai' ? 'bg-white/20' : 'bg-indigo-50'}`}>
                  <Sparkles size={14} className={(activeTab as string) === 'ai' ? "animate-pulse" : ""} />
                </div>
                Smart Assistant
              </button>

              <button 
                onClick={() => setShowAutoReconcile(true)}
                className="px-4 py-2 rounded-2xl border transition-all flex items-center gap-2.5 font-black text-[10px] uppercase tracking-widest bg-white text-emerald-600 border-emerald-100 hover:border-emerald-200 shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50">
                  <Activity size={14} />
                </div>
                Payment Match
              </button>

              <button 
                onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()); }}
                className={`px-4 py-2 rounded-2xl border transition-all flex items-center gap-2.5 font-black text-[10px] uppercase tracking-widest ${bulkMode ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 shadow-sm"}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bulkMode ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
                  <CheckSquare size={14} />
                </div>
                Pay Many
              </button>

              <button 
                onClick={async () => {
                  const overdue = invoices.filter(i => i.status === 'overdue');
                  if (overdue.length === 0) return toast("No overdue invoices found.", "info");
                  if (confirm(`Send reminders to ${overdue.length} customers?`)) {
                    setBulkLoading(true);
                    for (const inv of overdue) {
                      await dunningService.sendReminder(inv.id, inv.contacts?.phone || "", `Friendly reminder for Invoice ${inv.invoice_number}`, 'sms');
                    }
                    setBulkLoading(false);
                    toast("Reminders queued successfully.", "success");
                  }
                }}
                className="px-4 py-2 rounded-2xl bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 shadow-sm font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                  <MessageSquare size={14} />
                </div>
                Send Reminders
              </button>

              {isOwner && (
                <button 
                  onClick={handleExportLogs}
                  className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2.5 shadow-xl"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <Download size={14} />
                  </div>
                  Export Audit
                </button>
              )}
              
              <button 
                onClick={handleExportPDF}
                className="px-4 py-2 rounded-2xl bg-white text-indigo-600 border border-indigo-100 hover:border-indigo-300 shadow-sm font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Download size={14} />
                </div>
                Download Sales
              </button>
            </div>

            <ActionBtn onClick={() => { setPrefill(null); setShowCreate(true); }} className="!py-3 !px-10 !text-[12px] !rounded-2xl !bg-[#0A84FF] !text-white shadow-xl flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Plus size={16} strokeWidth={3} />
              </div>
              Create Bill
            </ActionBtn>
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Min Amount (Rs.)</label>
                  <input 
                    type="number" 
                    placeholder="Min value..." 
                    value={minAmount} 
                    onChange={e => setMinAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Max Amount (Rs.)</label>
                  <input 
                    type="number" 
                    placeholder="Max value..." 
                    value={maxAmount} 
                    onChange={e => setMaxAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Billing Age Range</label>
                  <select 
                    value={datePreset} 
                    onChange={e => setDatePreset(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="all">Any Billing Date</option>
                    <option value="today">Today Only</option>
                    <option value="week">Past 7 Days</option>
                    <option value="month">Past 30 Days</option>
                    <option value="overdue7">Overdue &gt; 7 Days</option>
                    <option value="overdue30">Overdue &gt; 30 Days</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setMinAmount(""); setMaxAmount(""); setDatePreset("all"); }}
                    className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest border border-slate-200 rounded-xl transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <AnimatePresence>
          {bulkMode && selected.size > 0 && (
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[900] bg-slate-900 text-white rounded-3xl shadow-2xl shadow-indigo-500/30 p-6 flex flex-wrap items-center gap-6 border border-white/10 backdrop-blur-xl"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">{selected.size} selected</span>
              <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                {["cash","upi","card"].map(m => (
                  <button key={m} onClick={() => setBulkPayMode(m)}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${bulkPayMode===m ? "bg-white text-slate-900 shadow-lg":"text-slate-400 hover:text-white"}`}
                  >{m}</button>
                ))}
              </div>
              <button onClick={bulkMarkPaid} disabled={bulkLoading}
                className="bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-indigo-400 transition-all">
                {bulkLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                Mark Paid
              </button>
              <button onClick={() => { setSelected(new Set()); setBulkMode(false); }}
                className="text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors">Cancel</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto -mx-8">
          <table className="w-full min-w-[800px] border-separate border-spacing-y-4">
            <thead>
              <tr>
                {bulkMode && <th className="px-8 w-12"></th>}
                {["Invoice","Customer","Date","Outstanding","Amount","Status","Actions"].map(h=>(
                  <th key={h} className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {paginatedInvoices.map((inv, idx) => (
                  <motion.tr key={inv.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group cursor-pointer"
                  >
                    {bulkMode && (
                      <td className="px-8 py-6 bg-white/40 group-hover:bg-white rounded-l-[2rem] transition-colors" onClick={e => { e.stopPropagation(); toggleSelect(inv.id); }}>
                        {selected.has(inv.id)
                          ? <CheckSquare size={22} className="text-neon" />
                          : <Square size={22} className="text-slate-200 group-hover:border-neon" />}
                      </td>
                    )}
                    <td 
                      className={`px-8 py-6 bg-white/40 group-hover:bg-white transition-colors ${!bulkMode ? 'rounded-l-[2rem]' : ''}`} 
                      onClick={() => selectInvoiceWithItems(inv)}
                      onMouseEnter={(e) => {
                        setHoveredInvoice(inv);
                        setPeekPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredInvoice(null)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white group-hover:bg-neon group-hover:text-slate-900 transition-colors">
                           #{inv.invoice_number?.slice(-2)}
                        </div>
                        <div className="flex flex-col">
                          <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                            {inv.invoice_number}
                            {inv.created_via === 'ocr' && (
                              <span className="px-1.5 py-0.5 bg-neon text-ink text-[7px] font-black uppercase rounded tracking-widest animate-pulse">
                                 AI_SCANNED
                              </span>
                            )}
                          </div>
                          {inv.is_purchase && <span className="text-[8px] font-bold text-indigo-500 uppercase">Purchase Bill</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 bg-white/40 group-hover:bg-white transition-colors" onClick={() => selectInvoiceWithItems(inv)}>
                      <div className="text-sm font-bold text-slate-600">{inv.contacts?.name ?? inv.customer_name ?? "General Customer"}</div>
                    </td>
                    <td className="px-8 py-6 bg-white/40 group-hover:bg-white transition-colors" onClick={() => selectInvoiceWithItems(inv)}>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {inv.invoice_date ?? new Date(inv.created_at).toLocaleDateString("en-IN")}
                      </div>
                    </td>
                    <td className="px-8 py-6 bg-white/40 group-hover:bg-white transition-colors" onClick={() => selectInvoiceWithItems(inv)}>
                      {inv.status !== 'paid' && inv.status !== 'cancelled' ? (
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-black uppercase ${
                            Math.floor((Date.now() - new Date(inv.due_date || inv.invoice_date).getTime()) / 86400000) > 30 ? 'text-red-500' : 
                            Math.floor((Date.now() - new Date(inv.due_date || inv.invoice_date).getTime()) / 86400000) > 0 ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            {Math.max(0, Math.floor((Date.now() - new Date(inv.due_date || inv.invoice_date).getTime()) / 86400000))} Days
                          </span>
                          <span className="text-[8px] font-bold text-slate-300 uppercase">Outstanding</span>
                        </div>
                      ) : (
                        <span className="text-slate-200">-</span>
                      )}
                    </td>
                    <td className="px-8 py-6 bg-white/40 group-hover:bg-white transition-colors" onClick={() => selectInvoiceWithItems(inv)}>
                      <div className="text-base font-black text-slate-900 tracking-tighter">Rs.{(inv.total_amount||0).toLocaleString("en-IN")}</div>
                      {inv.status === 'partial' && (
                        <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-0.5">
                          Rs.{(inv.amount_remaining||0).toLocaleString("en-IN")} Left
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 bg-white/40 group-hover:bg-white transition-colors" onClick={() => selectInvoiceWithItems(inv)}><Badge status={inv.status} /></td>
                    <td className="px-8 py-6 bg-white/40 group-hover:bg-white rounded-r-[2rem] transition-colors">
                      <div className="flex gap-3 items-center transition-opacity">
                        {inv.status !== "paid" && (
                          <button 
                            onClick={e => { e.stopPropagation(); setRemindInvoice(inv); setReminderTone('friendly'); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100/50"
                          >
                            <div className="w-6 h-6 rounded-lg bg-white/50 flex items-center justify-center">
                              <MessageSquare size={12} />
                            </div>
                             <span className="text-[9px] font-black uppercase tracking-widest">Remind Him</span>
                          </button>
                        )}
                        <button 
                          onClick={e => { e.stopPropagation(); billLikeLastTime(inv); }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100/50"
                        >
                          <div className="w-6 h-6 rounded-lg bg-white/50 flex items-center justify-center">
                            <Repeat size={12} />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest">Repeat</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-8 py-5 mt-4 bg-white/40 border border-slate-200/40 rounded-[2rem] backdrop-blur-3xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} Bills
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 transition-all flex items-center gap-1 active:scale-95"
                >
                  - Previous
                </button>
                <div className="flex items-center px-3 text-[10px] font-black text-slate-700 font-mono">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 transition-all flex items-center gap-1 active:scale-95"
                >
                  Next -
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>


      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        items={selectedInvoiceItems}
        businessId={businessId}
        onStatusChange={async (newStatus) => {
          if (!selectedInvoice) return;
          try {
            await supabase
              .from("invoices")
              .update({ status: newStatus, updated_at: new Date().toISOString() })
              .eq("id", selectedInvoice.id);
            
            setSelectedInvoice({ ...selectedInvoice, status: newStatus, updated_at: new Date().toISOString() });
            refresh('invoices');
          } catch (e) {
            console.error(e);
          }
        }}
        onRecordPayment={async (amount, mode, reference) => {
          if (!selectedInvoice) return;
          try {
            await supabase.from("invoice_payments").insert({
              invoice_id: selectedInvoice.id,
              business_id: businessId,
              amount: amount,
              payment_mode: mode,
              payment_reference: reference || null,
            });
            
            const newPartialPaid = (Number(selectedInvoice.partial_paid_amount || 0) + Number(amount));
            const newStatus = newPartialPaid >= Number(selectedInvoice.total_amount) ? "paid" : selectedInvoice.status;
            
            await supabase
              .from("invoices")
              .update({
                partial_paid_amount: newPartialPaid,
                partial_paid_at: new Date().toISOString(),
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq("id", selectedInvoice.id);

            setSelectedInvoice({
              ...selectedInvoice,
              partial_paid_amount: newPartialPaid,
              partial_paid_at: new Date().toISOString(),
              status: newStatus,
              updated_at: new Date().toISOString()
            });
            refresh('invoices');
          } catch (e) {
            console.error(e);
          }
        }}
        onVoid={() => handleVoidInvoice(selectedInvoice)}
      />

      {/* Create Invoice Modal */}
      <InvoiceCreateModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setPrefill(null); }}
        onCreated={() => refresh('invoices')}
        prefill={prefill}
      />

      <AutoReconciliation
        isOpen={showAutoReconcile}
        onClose={() => setShowAutoReconcile(false)}
      />

      {/* Smart Reminders Customizer (Market-Beating Feature) */}
      <AnimatePresence>
        {remindInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setRemindInvoice(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/90 border border-slate-200/50 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl shadow-slate-900/10 space-y-6 relative my-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setRemindInvoice(null)}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="space-y-2">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Smart Reminders Engine</div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Configure Billing Nudge</h3>
                <p className="text-xs font-semibold text-slate-400">Select collection tone to maximize pay-in velocity.</p>
              </div>

              {/* Tone Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'friendly', label: '-- Friendly', desc: 'Soft & supportive' },
                  { key: 'professional', label: '-- Professional', desc: 'Formal Accounts Team' },
                  { key: 'urgent', label: '-- Urgent', desc: 'Buyer solvency alert' },
                  { key: 'incentive', label: '--- Incentive', desc: 'Early settle discount' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setReminderTone(t.key as any)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      reminderTone === t.key 
                        ? 'bg-slate-950 text-white border-slate-950 shadow-lg' 
                        : 'bg-white text-slate-800 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-black uppercase tracking-wider">{t.label}</div>
                    <div className={`text-[9px] mt-1 ${reminderTone === t.key ? 'text-indigo-200' : 'text-slate-400'}`}>{t.desc}</div>
                  </button>
                ))}
              </div>

              {/* Incentive Inputs */}
              {reminderTone === 'incentive' && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="text-xs font-bold text-indigo-950">Discount Percentage (%)</div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customDiscount}
                    onChange={e => setCustomDiscount(Math.max(1, parseInt(e.target.value) || 2))}
                    className="w-20 px-3 py-1.5 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 font-bold text-center text-sm"
                  />
                </div>
              )}

              {/* Interactive Preview & Editing Box */}
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nudge Copy Preview</div>
                <textarea
                  value={editableMsg}
                  onChange={e => setEditableMsg(e.target.value)}
                  className="w-full h-32 p-4 text-xs font-semibold leading-relaxed text-slate-800 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl resize-none focus:outline-none"
                />
              </div>

              {/* Dispatch Action CTA Row */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={async () => {
                    try {
                      const phone = remindInvoice.contacts?.phone || "";
                      await dunningService.sendReminder(
                        remindInvoice.id, 
                        phone, 
                        editableMsg, 
                        'sms',
                        businessId,
                        remindInvoice.contact_id
                      );
                      toast("SMS reminder sent successfully.", "success");
                      setRemindInvoice(null);
                    } catch (err: any) {
                      console.error("SMS Reminder failed:", err);
                      toast(err.message || "Failed to send SMS reminder", "error");
                    }
                  }}
                  className="py-3.5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 font-black text-[10px] uppercase tracking-widest text-slate-700 hover:text-slate-900 transition-all text-center"
                >
                  Send via SMS
                </button>
                <button
                  onClick={async () => {
                    try {
                      const phone = remindInvoice.contacts?.phone || "";
                      const cleanPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
                      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(editableMsg)}`;
                      window.open(waUrl, '_blank');
                      
                      await dunningService.sendReminder(
                        remindInvoice.id, 
                        phone, 
                        editableMsg, 
                        'whatsapp',
                        businessId,
                        remindInvoice.contact_id
                      );
                      setRemindInvoice(null);
                    } catch (err: any) {
                      console.error("WhatsApp Reminder failed:", err);
                      toast(err.message || "Failed to log WhatsApp reminder", "error");
                    }
                  }}
                  className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all text-center"
                >
                  Share on WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Item Peek Bubble */}
      <AnimatePresence>
        {hoveredInvoice && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-[2000] min-w-[240px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 pointer-events-none"
            style={{ 
              left: peekPos.x + 20,
              top: peekPos.y - 40
            }}
          >
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 border-b border-white/5 pb-2">
              Invoice Summary: {hoveredInvoice.invoice_number}
            </div>
            <div className="space-y-2">
              {hoveredInvoice.invoice_items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center gap-4">
                  <div className="text-[10px] font-bold text-white truncate max-w-[140px]">{item.products?.name}</div>
                  <div className="text-[10px] font-black text-indigo-300">x{item.quantity}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-2 border-t border-white/5 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase">Total Items</span>
              <span className="text-[11px] font-black text-white">{hoveredInvoice.invoice_items?.length || 0}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
