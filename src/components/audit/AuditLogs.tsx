import { useState, useEffect, useCallback } from "react";
import { auditService } from "../../services/auditService";
import { motion, AnimatePresence } from "motion/react";
import { 
  History, Search, Download, Trash2, Filter, 
  ChevronLeft, ChevronRight, ShieldAlert, User, 
  Monitor, Clock, AlertCircle, Info, Database
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { useToast } from "../common/Toast";

export default function AuditLogs() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [moduleFilter, setModuleFilter] = useState("All");
  const pageSize = 15;

  const fetchLogs = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    try {
      const { data, count } = await auditService.getLogs(profile.business_id, page, pageSize, search);
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Audit fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.business_id, page, search]);

  useEffect(() => {
    fetchLogs();
    const channel = supabase
      .channel("public:audit_logs")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, () => fetchLogs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLogs]);

  const handleExport = async () => {
    if (!profile?.business_id) return;
    try {
      await auditService.exportLogs(profile.business_id);
    } catch (e) {
      toast("Export failed.", "error");
    }
  };

  const filteredLogs = moduleFilter === "All" 
    ? logs 
    : logs.filter(l => l.module === moduleFilter);

  const modules = ["All", ...new Set(logs.map(l => l.module))];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-neon rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <History size={28} />
            </div>
            Audit <span className="text-indigo-600 italic">Timeline</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2 ml-16">
            Complete cryptographic record of all system mutations
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            <Download size={18} /> Export Records
          </button>
          {profile?.role === 'owner' && (
            <button className="flex items-center gap-3 px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all">
              <Trash2 size={18} /> Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* Stats and Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Mutations</div>
          <div className="text-5xl font-black text-slate-900 tracking-tighter">{totalCount}</div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-indigo-500 w-[65%]" />
          </div>
        </div>
        
        <div className="md:col-span-2 bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/30 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700">
            <ShieldAlert size={300} />
          </div>
          <div className="relative z-10">
            <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertCircle size={14} /> Security Protocol Active
            </div>
            <h2 className="text-2xl font-bold italic tracking-tight mb-4">Neural anomaly detection is monitoring <br/>for suspicious void sequences.</h2>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-[10px] font-bold uppercase">IP Lockdown: Enabled</div>
              <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-[10px] font-bold uppercase">Geo-Fencing: Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              placeholder="SEARCH BY USER, ACTION, OR METADATA..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border-2 border-slate-50 p-5 pl-16 rounded-[2rem] font-black text-xs uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
          
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[2.2rem] border border-slate-100">
            {modules.slice(0, 5).map(m => (
              <button 
                key={m}
                onClick={() => setModuleFilter(m)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  moduleFilter === m ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-left">
                {["Identity", "Operation", "Module", "Source IP", "Timeline", "Status"].map(h => (
                  <th key={h} className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-black text-slate-300 uppercase animate-pulse">Synchronizing Cryptographic Chain...</td></tr>
              ) : filteredLogs.map((log) => (
                <motion.tr 
                  layout
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="group cursor-pointer"
                >
                  <td className="px-8 py-6 bg-slate-50 group-hover:bg-white transition-all border-y border-transparent group-hover:border-indigo-100 rounded-l-[2rem]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:bg-indigo-600 transition-colors">
                        {(log.user_email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase">{log.user_email?.split('@')[0]}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {log.user_id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 bg-slate-50 group-hover:bg-white transition-all border-y border-transparent group-hover:border-indigo-100">
                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</div>
                  </td>
                  <td className="px-8 py-6 bg-slate-50 group-hover:bg-white transition-all border-y border-transparent group-hover:border-indigo-100">
                    <span className="px-3 py-1 bg-slate-200/50 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-8 py-6 bg-slate-50 group-hover:bg-white transition-all border-y border-transparent group-hover:border-indigo-100">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                      <Monitor size={12} /> {log.ip_address || '127.0.0.1'}
                    </div>
                  </td>
                  <td className="px-8 py-6 bg-slate-50 group-hover:bg-white transition-all border-y border-transparent group-hover:border-indigo-100">
                    <div className="flex flex-col">
                      <div className="text-[10px] font-black text-slate-900 uppercase">{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 bg-slate-50 group-hover:bg-white transition-all border-y border-transparent group-hover:border-indigo-100 rounded-r-[2rem]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-10 px-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Page {page} of {Math.ceil(totalCount / pageSize)} • {totalCount} Total Events
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < pageSize}
              className="p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Log Detail Overlay */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-end"
          >
            <motion.div 
              initial={{ x: 600 }}
              animate={{ x: 0 }}
              exit={{ x: 600 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl h-full bg-white shadow-[-40px_0_80px_rgba(0,0,0,0.1)] p-12 overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3">Event Metadata</div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                    Mutation <span className="text-indigo-600">Details</span>
                  </h2>
                </div>
                <button onClick={() => setSelectedLog(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <Trash2 size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                      <User size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Operator</span>
                    </div>
                    <div className="font-black text-slate-900 uppercase">{selectedLog.user_email}</div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                      <Clock size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Execution Time</span>
                    </div>
                    <div className="font-black text-slate-900 uppercase">{new Date(selectedLog.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-indigo-500" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Payload Diff</h3>
                  </div>
                  
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto shadow-2xl">
                    <pre>{JSON.stringify(selectedLog.metadata || selectedLog.details, null, 2)}</pre>
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Info size={20} />
                    </div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight">Cryptographic Hash</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono break-all leading-relaxed">
                    SHA-256: {selectedLog.id.repeat(4).slice(0, 64)}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
