import { useState } from "react";
import { useAutomationRules } from "../../hooks/useAutomationRules";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Sliders,
  Sparkles,
  Zap,
  Check,
  Search,
  Filter,
  FileText
} from "lucide-react";
import { Card, SectionHeader, Badge, ActionBtn } from "../common/UI";
import { useToast } from "../common/Toast";

export default function AutomationRules() {
  const {
    rules,
    logs,
    queue,
    loading,
    actionLoading,
    toggleRule,
    executeDunning,
    executeStockReorder,
    rollbackAction,
    refreshAll,
  } = useAutomationRules();
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<"rules" | "logs" | "queue">("rules");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = ["all", "invoice", "stock", "customer", "gst", "report"];

  const filteredRules = rules.filter((r) => {
    const matchesSearch = r.rule_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || r.rule_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "invoice":
        return "from-blue-500/20 to-indigo-500/20 border-indigo-500/30 text-indigo-700";
      case "stock":
        return "from-amber-500/20 to-orange-500/20 border-orange-500/30 text-orange-700";
      case "customer":
        return "from-emerald-500/20 to-teal-500/20 border-teal-500/30 text-teal-700";
      case "gst":
        return "from-purple-500/20 to-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-700";
      case "report":
        return "from-pink-500/20 to-rose-500/20 border-rose-500/30 text-rose-700";
      default:
        return "from-slate-500/20 to-slate-500/20 border-slate-500/30 text-slate-700";
    }
  };

  const formatJSON = (val: any) => {
    if (!val) return "";
    try {
      return typeof val === "object" ? JSON.stringify(val) : val;
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-10">
      {/* Telemetry Header Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="brutal-card !p-8 bg-slate-900 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-neon/10 rounded-xl text-neon">
              <Cpu size={20} />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rules Implemented</div>
          </div>
          <div className="text-4xl font-black">{loading ? "..." : rules.length}</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Active: {rules.filter((r) => r.is_active).length} | Total Templates
          </div>
        </div>

        <div className="brutal-card !p-8 bg-slate-900 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Zap size={20} />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Automations Run</div>
          </div>
          <div className="text-4xl font-black">{loading ? "..." : logs.length}</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Success Rate: 100% | Past 30 Days
          </div>
        </div>

        <div className="brutal-card !p-8 bg-slate-900 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
              <Clock size={20} />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Queue Backlog</div>
          </div>
          <div className="text-4xl font-black">{loading ? "..." : queue.filter((q) => q.status === "pending").length}</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Pending WhatsApp Dispatches
          </div>
        </div>
      </div>

      {/* Manual Override Commands Section */}
      <div className="glass-card !p-8 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">Manual Execution Triggers</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Run cron scripts instantly for system validation</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <button
            disabled={actionLoading}
            onClick={() => executeDunning().then(() => toast("Dunning scan executed successfully.", "success"))}
            className="flex-1 md:flex-none bg-slate-900 hover:bg-neon text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <Play size={12} className="fill-current" />
            Scan Dunning
          </button>
          <button
            disabled={actionLoading}
            onClick={() => executeStockReorder().then(() => toast("Stock reorder scan executed successfully.", "success"))}
            className="flex-1 md:flex-none bg-slate-900 hover:bg-neon text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <Play size={12} className="fill-current" />
            Scan Stock Reorder
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-100 pb-2 gap-8">
        <button
          onClick={() => setActiveSubTab("rules")}
          className={`pb-4 font-black text-xs uppercase tracking-[0.2em] transition-all relative ${
            activeSubTab === "rules" ? "text-neon" : "text-slate-400 hover:text-slate-900"
          }`}
        >
          Active Rules Matrix
          {activeSubTab === "rules" && (
            <motion.div layoutId="subtab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-neon rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("logs")}
          className={`pb-4 font-black text-xs uppercase tracking-[0.2em] transition-all relative ${
            activeSubTab === "logs" ? "text-neon" : "text-slate-400 hover:text-slate-900"
          }`}
        >
          Operation Telemetry Logs
          {activeSubTab === "logs" && (
            <motion.div layoutId="subtab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-neon rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("queue")}
          className={`pb-4 font-black text-xs uppercase tracking-[0.2em] transition-all relative ${
            activeSubTab === "queue" ? "text-neon" : "text-slate-400 hover:text-slate-900"
          }`}
        >
          WhatsApp Pipeline Queue
          {activeSubTab === "queue" && (
            <motion.div layoutId="subtab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-neon rounded-full" />
          )}
        </button>
      </div>

      {/* Main Panel Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {activeSubTab === "rules" && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80 group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors" />
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 font-bold text-sm outline-none focus:border-neon focus:ring-4 focus:ring-neon/10 transition-all"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all ${
                      categoryFilter === cat
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-24 text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Syncing rules matrix...
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-slate-200 rounded-3xl">
                <AlertTriangle size={32} className="text-slate-300 mx-auto mb-4" />
                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">No rules matched</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Try adjusting search query or filters</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="brutal-card !p-8 hover:border-neon/30 transition-all duration-500 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className={`px-3 py-1.5 rounded-full border bg-gradient-to-r font-black text-[8px] uppercase tracking-widest ${getCategoryColor(rule.rule_category)}`}>
                          {rule.rule_category}
                        </div>
                        <motion.div
                          onClick={() => toggleRule(rule.id, rule.is_active)}
                          whileTap={{ scale: 0.95 }}
                          className={`w-12 h-6 rounded-full cursor-pointer flex items-center p-0.5 transition-all duration-500 ${
                            rule.is_active ? "bg-neon shadow-lg shadow-neon/30" : "bg-slate-200"
                          }`}
                        >
                          <motion.div
                            animate={{ x: rule.is_active ? 24 : 0 }}
                            className="w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </motion.div>
                      </div>

                      <h4 className="font-black text-base text-slate-900 group-hover:text-neon transition-colors mb-2 uppercase tracking-tight">
                        {rule.rule_name}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed mb-6">
                        Trigger: {rule.trigger_event} | Counts: {rule.trigger_count || 0}
                      </p>

                      <div className="space-y-4 pt-4 border-t border-slate-50">
                        <div className="flex gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          <span className="text-slate-400">Conditions:</span>
                          <span className="font-mono text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {formatJSON(rule.trigger_conditions)}
                          </span>
                        </div>
                        <div className="flex gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          <span className="text-slate-400">Actions:</span>
                          <span className="font-mono text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {formatJSON(rule.actions)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {rule.ai_assisted && (
                      <div className="mt-6 flex items-center gap-2 text-[8px] font-black uppercase text-purple-600 tracking-widest bg-purple-50 self-start px-2.5 py-1.5 rounded-lg border border-purple-100">
                        <Sparkles size={10} className="fill-current animate-pulse" />
                        AI-Assisted (Gemini Integration)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === "logs" && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="text-center py-24 text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Fetching execution telemetry...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-slate-200 rounded-3xl">
                <Clock size={32} className="text-slate-300 mx-auto mb-4" />
                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">No automation logs recorded</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Logs will appear as automations fire</div>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-neon/30 transition-all duration-500 gap-6"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        log.rolled_back_at 
                          ? "bg-amber-50 border-amber-200 text-amber-500" 
                          : "bg-emerald-50 border-emerald-200 text-emerald-500"
                      }`}>
                        {log.rolled_back_at ? <RotateCcw size={18} /> : <Check size={18} />}
                      </div>
                      <div>
                        <div className="font-black text-xs uppercase tracking-tight text-slate-900">
                          {log.rule_name || "Trigger Executed"}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                          Event: {log.trigger_event} • {new Date(log.executed_at).toLocaleString()}
                        </div>
                        {log.ai_decision && (
                          <div className="text-[9px] text-purple-600 mt-2 font-black uppercase tracking-widest bg-purple-50 border border-purple-100 px-2 py-1 rounded-md inline-block">
                            AI Decision: {formatJSON(log.ai_decision)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <span className="font-mono text-[9px] font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-100 uppercase">
                        {log.status}
                      </span>
                      {log.rolled_back_at ? (
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          ROLLED_BACK
                        </span>
                      ) : (
                        <button
                          disabled={actionLoading}
                          onClick={() => {
                            if (confirm("Are you sure you want to rollback this automation?")) {
                              rollbackAction(log.id).then(() => toast("Automation rolled back successfully.", "success"));
                            }
                          }}
                          className="px-6 py-2.5 rounded-xl border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 hover:bg-red-50 font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                        >
                          <RotateCcw size={10} />
                          Rollback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === "queue" && (
          <motion.div
            key="queue"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="text-center py-24 text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Loading WhatsApp telemetry...
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-slate-200 rounded-3xl">
                <Send size={32} className="text-slate-300 mx-auto mb-4" />
                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">WhatsApp queue is clear</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending messages will queue here</div>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-neon/30 transition-all duration-500 flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-black text-xs uppercase tracking-tight text-slate-900">{msg.phone}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                          msg.status === "sent" 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                            : msg.status === "failed" 
                            ? "bg-red-50 border-red-200 text-red-600" 
                            : msg.status === "rolled_back" 
                            ? "bg-amber-50 border-amber-200 text-amber-600" 
                            : "bg-blue-50 border-blue-200 text-blue-600"
                        }`}>
                          {msg.status}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          Type: {msg.message_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 bg-white p-4 rounded-2xl border border-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                    </div>

                    <div className="text-right md:self-center flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Scheduled For</span>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                        {new Date(msg.scheduled_for).toLocaleDateString()} at {new Date(msg.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
