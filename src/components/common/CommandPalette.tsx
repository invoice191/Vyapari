import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function CommandPalette({ active, onSelect }: { active: string, onSelect: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const commands = [
    { key: "dashboard", label: "Open Dashboard", icon: "--" },
    { key: "command", label: "Execute Monsoon Arrival Strategy", icon: "--" },
    { key: "invoices", label: "Create New Invoice", icon: "--" },
    { key: "inventory", label: "Check Stock Levels", icon: "--" },
    { key: "reports", label: "Generate Tax Report", icon: "--" },
    { key: "ocr", label: "Scan Bill / Receipt", icon: "--" },
    { key: "settings", label: "System Settings", icon: "--" },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const handleOpen = () => setOpen(true);
    
    document.addEventListener("keydown", down);
    window.addEventListener("palette:open", handleOpen);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("palette:open", handleOpen);
    };
  }, []);

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div 
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[1000] flex items-start justify-center p-4 bg-ink/60 backdrop-blur-md overflow-y-auto"
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl bg-white border-4 border-ink shadow-[12px_12px_0px_var(--color-neon)] overflow-hidden my-auto"
      >
        <div className="p-6 border-b-4 border-ink">
          <input 
            autoFocus
            placeholder="Type a command or search module..."
            className="w-full text-2xl font-black italic uppercase tracking-tighter outline-none placeholder:text-ink/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.map(c => (
            <div 
              key={c.key}
              onClick={() => { onSelect(c.key); setOpen(false); }}
              className="flex items-center justify-between p-4 hover:bg-neon cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{c.icon}</span>
                <span className="font-black uppercase tracking-tight">{c.label}</span>
              </div>
              <span className="text-[10px] font-black text-ink/20 group-hover:text-ink/60 italic">RETURN -</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-ink/40 font-black uppercase tracking-widest text-xs italic">
              No_Commands_Found_In_Neural_Core
            </div>
          )}
        </div>
        <div className="p-4 bg-ink/5 flex justify-between items-center">
          <div className="text-[8px] font-black uppercase tracking-widest text-ink/30">VYAPARI_CMD_V1.0</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-[8px] font-black uppercase"><span className="px-1 border border-ink">ESC</span> Close</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
