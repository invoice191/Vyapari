import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock, Box, Receipt, User, ShieldAlert, ArrowRight } from "lucide-react";
import { supabase } from '../../lib/supabase';

export default function TimeMachine() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const getIcon = (action: string) => {
    if (action.includes('INV')) return <Box size={16} />;
    if (action.includes('AUTH')) return <User size={16} />;
    if (action.includes('INVOICE')) return <Receipt size={16} />;
    return <Clock size={16} />;
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-black uppercase text-ink/20 tracking-widest">Rewinding_Time...</div>;

  return (
    <div className="p-6">
      <div className="relative">
        {/* The Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-ink/10" />

        <div className="space-y-12 relative z-10">
          {logs.map((log, i) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-10 items-start"
            >
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-ink text-white flex items-center justify-center border-4 border-paper shadow-lg">
                {getIcon(log.action)}
              </div>

              <div className="flex-1 brutal-card bg-white hover:border-neon transition-colors group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase text-ink/40 tracking-widest">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-ink text-white rounded">
                    {log.action}
                  </span>
                </div>
                <h4 className="font-black uppercase tracking-tight mb-2 group-hover:text-neon">
                  {log.module} Event
                </h4>
                <p className="text-xs font-bold text-ink/60 leading-relaxed mb-4">
                  {typeof (log.metadata || log.details) === 'object' ? JSON.stringify(log.metadata || log.details) : log.metadata || log.details || "System automated event logged successfully."}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-ink/40 italic">
                  <User size={12} /> Root_Admin <ArrowRight size={12} /> {log.id.slice(0, 8)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
