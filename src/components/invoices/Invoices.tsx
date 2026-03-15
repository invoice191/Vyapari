import { useState, useEffect } from "react";
import { C, invoices as mockInvoices } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, Badge, OrangeBtn, SectionHeader } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";
import { getInvoicesSummary } from "../../services/dataService";

export default function Invoices() {
  const bp = useBreakpoint();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getInvoicesSummary((data) => {
      setInvoices(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const currentInvoices = invoices.length > 0 ? invoices : mockInvoices;

  const filtered = currentInvoices.filter(inv =>
    (filterStatus === "All" || inv.status === filterStatus) &&
    (inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.includes(search))
  );

  const totals = {
    total: currentInvoices.reduce((a, i) => a + i.amount, 0),
    paid: currentInvoices.filter(i => i.status === "Paid").reduce((a, i) => a + i.amount, 0),
    pending: currentInvoices.filter(i => i.status === "Pending").reduce((a, i) => a + i.amount, 0),
    overdue: currentInvoices.filter(i => i.status === "Overdue").reduce((a, i) => a + i.amount, 0)
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.mid }}>Loading invoices...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Invoiced", value: `₹${(totals.total / 1000).toFixed(0)}K`, color: '#FF6B35', icon: "🧾" },
          { label: "Paid", value: `₹${(totals.paid / 1000).toFixed(0)}K`, color: '#10B981', icon: "✅" },
          { label: "Pending", value: `₹${(totals.pending / 1000).toFixed(0)}K`, color: '#F59E0B', icon: "⏳" },
          { label: "Overdue", value: `₹${(totals.overdue / 1000).toFixed(0)}K`, color: '#EF4444', icon: "⚠️" },
        ].map(s => (
          <div key={s.label} className="brutal-card bg-white flex justify-between items-center group hover:bg-ink hover:text-white transition-colors">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-ink/40 group-hover:text-white/40 mb-2">{s.label}</div>
              <div className="text-3xl font-black tracking-tighter" style={{ color: s.color }}>{s.value}</div>
            </div>
            <span className="text-3xl opacity-40 group-hover:opacity-100 transition-opacity">{s.icon}</span>
          </div>
        ))}
      </div>

      <div className="brutal-card bg-white">
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">🔍</span>
            <input
              placeholder="SEARCH_INVOICES_BY_ID_OR_CUSTOMER..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-ink/5 border-2 border-ink p-3 pl-12 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10 transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar w-full lg:w-auto">
            {["All", "Paid", "Pending", "Overdue"].map(s => (
              <motion.button 
                key={s} 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(s)} 
                className={`
                  px-6 py-3 border-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                  ${filterStatus === s ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink/10 hover:border-ink'}
                `}
              >
                {s}
              </motion.button>
            ))}
          </div>
          <button className="brutal-btn w-full lg:w-auto whitespace-nowrap">+ CREATE_NEW_INVOICE</button>
        </div>

        <div className="overflow-x-auto border-2 border-ink">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="bg-ink text-white">
                {["Invoice ID", "Customer", "Date", "Amount", "Status", "Method"].map(h => (
                  <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((inv, i) => (
                  <motion.tr 
                    key={inv.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedInvoice(inv)}
                    className="border-b border-ink/5 last:border-0 hover:bg-neon/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 text-xs font-black text-ink group-hover:text-ink transition-colors uppercase tracking-widest">{inv.id}</td>
                    <td className="p-4 text-xs font-bold uppercase tracking-tight">{inv.customer}</td>
                    <td className="p-4 text-[10px] font-black text-ink/40 uppercase tracking-widest">{inv.date}</td>
                    <td className="p-4 text-xs font-black data-value">₹{inv.amount.toLocaleString("en-IN")}</td>
                    <td className="p-4"><Badge status={inv.status} /></td>
                    <td className="p-4 text-[10px] font-black text-ink/40 uppercase tracking-widest">{inv.method}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()} 
              className="brutal-card bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="flex justify-between items-start mb-12 border-b-4 border-ink pb-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">{selectedInvoice.id}</h2>
                  <p className="text-[10px] font-black text-ink/40 uppercase tracking-widest">{selectedInvoice.date}</p>
                </div>
                <Badge status={selectedInvoice.status} />
              </div>

              <div className="bg-ink text-white p-8 text-center mb-12 border-l-8 border-neon">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">TOTAL_PAYABLE_AMOUNT</div>
                <div className="text-5xl font-black tracking-tighter data-value">₹{selectedInvoice.amount.toLocaleString("en-IN")}</div>
              </div>
              
              <div className="space-y-4 mb-12">
                {[
                  { label: "Customer", val: selectedInvoice.customer },
                  { label: "Payment Method", val: selectedInvoice.method },
                  { label: "Due Date", val: "2024-02-15" },
                  { label: "Tax (18% GST)", val: `₹${(selectedInvoice.amount * 0.18).toLocaleString("en-IN")}` },
                ].map(f => (
                  <div key={f.label} className="flex justify-between items-center border-b-2 border-ink/5 pb-4">
                    <span className="text-[10px] font-black text-ink/40 uppercase tracking-widest">{f.label}</span>
                    <span className="text-xs font-black uppercase tracking-tight">{f.val}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="brutal-btn">DOWNLOAD_PDF</button>
                <button className="brutal-btn !bg-white !text-ink border-2 border-ink">SEND_EMAIL</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
