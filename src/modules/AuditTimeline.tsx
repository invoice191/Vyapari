import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { Card, SectionHeader, Badge } from "../components/common/UI";
import { Clock, User, Box, Receipt, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function AuditTimeline() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchLogs();
  }, [profile]);

  const fetchLogs = async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Audit Logs Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (action: string) => {
    if (action.includes("INVOICE")) return <Receipt className="text-blue-500" />;
    if (action.includes("STOCK")) return <Box className="text-orange-500" />;
    if (action.includes("AUTH") || action.includes("USER")) return <User className="text-purple-500" />;
    return <Clock className="text-ink/40" />;
  };

  const filteredLogs = logs.filter(l => 
    filter === "All" || 
    (filter === "Critical" && (l.severity === "Critical" || l.severity === "Error")) ||
    l.module === filter
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-paper p-6 border-4 border-ink shadow-[8px_8px_0px_var(--color-ink)]">
        <div className="flex gap-4">
          {["All", "Invoices", "Inventory", "Auth", "Critical"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                filter === f ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink/10 hover:border-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={fetchLogs} className="text-[10px] font-black uppercase tracking-widest text-neon underline underline-offset-4">
          REFRESH_LOGS
        </button>
      </div>

      <div className="relative pl-12 border-l-4 border-ink/10 space-y-12">
        <AnimatePresence mode="popLayout">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {/* Timeline Node */}
              <div className="absolute -left-[62px] top-0 w-10 h-10 bg-white border-4 border-ink flex items-center justify-center z-10 shadow-[4px_4px_0px_var(--color-ink)]">
                {getIcon(log.action)}
              </div>

              <div className={`brutal-card p-6 ${log.severity === 'Critical' ? 'bg-red-50 border-red-500' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-black text-ink/30 uppercase tracking-widest mb-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <h3 className="text-lg font-black tracking-tight uppercase italic">{log.action.replace(/_/g, ' ')}</h3>
                  </div>
                  <Badge status={log.module === 'Invoices' ? 'Paid' : log.module === 'Auth' ? 'Processing' : 'Pending'} />
                </div>

                <div className="p-4 bg-ink/5 border-l-4 border-ink font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(log.metadata || log.details, null, 2)}</pre>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-center p-12">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-4xl">⚙️</motion.div>
          </div>
        )}

        {!loading && filteredLogs.length === 0 && (
          <div className="p-20 text-center brutal-card border-dashed">
            <AlertCircle className="mx-auto mb-4 text-ink/20" size={48} />
            <div className="text-xl font-black italic text-ink/40">NO_AUDIT_TRAILS_FOUND</div>
          </div>
        )}
      </div>
    </div>
  );
}
