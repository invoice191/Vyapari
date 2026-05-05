import { useState, useEffect } from "react";
import { ledgerService } from "../../services/ledgerService";
import { Card, SectionHeader, Badge } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";

export default function Ledger() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    fetchLedger();
  }, [page, search]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const { data, count } = await ledgerService.getLedgerEntries(page, pageSize, search);
      setEntries(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Ledger fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="brutal-card bg-ink text-white">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">CASH_ON_HAND</div>
          <div className="text-4xl font-black tracking-tighter text-neon">₹{(entries.reduce((a, b) => a + (b.type === 'credit' ? b.amount : -b.amount), 0) / 1000).toFixed(1)}K</div>
        </div>
        <div className="brutal-card bg-white">
          <div className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-2">PENDING_RECEIVABLES</div>
          <div className="text-4xl font-black tracking-tighter">₹{(entries.filter(e => !e.is_paid).reduce((a, b) => a + b.amount, 0) / 1000).toFixed(1)}K</div>
        </div>
      </div>

      <div className="brutal-card bg-white">
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-start lg:items-center">
          <input 
            placeholder="SEARCH_BY_ENTITY_OR_REASON..." 
            className="brutal-input flex-1 w-full"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <button className="brutal-btn">+ NEW_ENTRY</button>
        </div>

        <div className="overflow-x-auto border-2 border-ink">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-ink text-white font-black text-[10px] uppercase">
                <th className="p-4">DATE</th>
                <th className="p-4">ENTITY</th>
                <th className="p-4">REASON</th>
                <th className="p-4">TYPE</th>
                <th className="p-4 text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center font-black text-ink/20">SYNCING_LEDGER...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center font-black text-ink/20">NO_RECORDS_FOUND</td></tr>
              ) : entries.map(entry => (
                <tr key={entry.id} className="border-b border-ink/5 hover:bg-neon/5 transition-colors group">
                  <td className="p-4 text-[10px] font-black text-ink/40 uppercase">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="p-4 font-black uppercase text-xs">{entry.entity_name}</td>
                  <td className="p-4 text-xs font-bold text-ink/60 uppercase">{entry.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-2 ${entry.type === 'credit' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className={`p-4 font-black text-right ${entry.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                    {entry.type === 'credit' ? '+' : '-'}₹{entry.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-8">
          <div className="text-[10px] font-black text-ink/40 uppercase">Page {page} of {Math.ceil(totalCount / pageSize)}</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="brutal-btn !py-1 !px-3 text-[10px] disabled:opacity-20">PREV</button>
            <button onClick={() => setPage(p => p + 1)} disabled={entries.length < pageSize} className="brutal-btn !py-1 !px-3 text-[10px] disabled:opacity-20">NEXT</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
