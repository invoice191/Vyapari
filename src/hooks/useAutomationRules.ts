import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useAutomationRules() {
  const { business } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("business_id", business.id)
      .order("rule_category", { ascending: true })
      .order("rule_name", { ascending: true });

    if (!error && data) {
      setRules(data);
    }
  }, [business?.id]);

  const fetchLogs = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("automation_log")
      .select("*")
      .eq("business_id", business.id)
      .order("executed_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data);
    }
  }, [business?.id]);

  const fetchQueue = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("whatsapp_queue")
      .select("*")
      .eq("business_id", business.id)
      .order("scheduled_for", { ascending: false })
      .limit(50);

    if (!error && data) {
      setQueue(data);
    }
  }, [business?.id]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRules(), fetchLogs(), fetchQueue()]);
    setLoading(false);
  }, [fetchRules(), fetchLogs(), fetchQueue()]);

  useEffect(() => {
    if (business?.id) {
      refreshAll();
    }
  }, [business?.id, refreshAll]);

  // Handle data refresh events
  useEffect(() => {
    const handleRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (
        detail?.table === "automation_rules" ||
        detail?.table === "automation_log" ||
        detail?.table === "whatsapp_queue"
      ) {
        fetchRules();
        fetchLogs();
        fetchQueue();
      }
    };

    window.addEventListener("app:data-refresh", handleRefresh);
    return () => {
      window.removeEventListener("app:data-refresh", handleRefresh);
    };
  }, [fetchRules, fetchLogs, fetchQueue]);

  const toggleRule = async (ruleId: string, currentActive: boolean) => {
    if (!business?.id) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("automation_rules")
      .update({ is_active: !currentActive })
      .eq("id", ruleId)
      .eq("business_id", business.id);

    if (!error) {
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, is_active: !currentActive } : r))
      );
    }
    setActionLoading(false);
  };

  const executeDunning = async () => {
    if (!business?.id) return;
    setActionLoading(true);
    const { data, error } = await supabase.rpc("run_dunning_automation", {
      p_business_id: business.id,
    });

    if (!error) {
      await refreshAll();
    } else {
      console.error("Manual Dunning execution failed:", error);
    }
    setActionLoading(false);
    return { data, error };
  };

  const executeStockReorder = async () => {
    if (!business?.id) return;
    setActionLoading(true);
    const { data, error } = await supabase.rpc("run_stock_reorder_automation", {
      p_business_id: business.id,
    });

    if (!error) {
      await refreshAll();
    } else {
      console.error("Manual Stock Reorder execution failed:", error);
    }
    setActionLoading(false);
    return { data, error };
  };

  const rollbackAction = async (logId: string) => {
    if (!business?.id) return;
    setActionLoading(true);
    const { data, error } = await supabase.rpc("rollback_automation", {
      p_log_id: logId,
      p_business_id: business.id,
    });

    if (!error) {
      await refreshAll();
    } else {
      console.error("Rollback execution failed:", error);
    }
    setActionLoading(false);
    return { data, error };
  };

  return {
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
  };
}
