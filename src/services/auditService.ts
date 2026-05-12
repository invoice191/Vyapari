import { supabase } from "../lib/supabase";

export interface AuditLogEntry {
  id?: string;
  business_id: string;
  user_id: string;
  user_email?: string;
  action: string;
  module: string;
  target?: string;
  severity?: 'Info' | 'Warning' | 'Critical';
  details?: {
    before?: any;
    after?: any;
    ip_address?: string;
    [key: string]: any;
  };
  metadata?: any;
  ip_address?: string;
  created_at?: string;
}

export const auditService = {
  getLogs: async (businessId: string, page = 1, pageSize = 15, search = "") => {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId);

    if (search) {
      query = query.or(`action.ilike.%${search}%,module.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  },

  logAction: async (entry: AuditLogEntry) => {
    // 1. Capture IP address (simple client-side approximation or via Edge Function)
    let ip = 'unknown';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ip = data.ip;
    } catch (e) {
      console.warn("Could not fetch IP address:", e);
    }

    const { error } = await supabase.from('audit_logs').insert([{
      business_id: entry.business_id,
      user_id: entry.user_id,
      user_email: entry.user_email,
      action: entry.action,
      module: entry.module,
      target: entry.target,
      severity: entry.severity || 'Info',
      metadata: entry.details,
      timestamp: new Date().toISOString()
    }]);

    if (error) throw error;

    // 2. Sensitive Action Alerts
    if (entry.action === 'invoice_void' || (entry.action === 'stock_adjust' && !entry.details.po_linked)) {
      await auditService.createSystemAlert(entry.business_id, {
        type: entry.action === 'invoice_void' ? 'security' : 'inventory',
        severity: 'critical',
        message: `Sensitive action detected: ${entry.action} by ${entry.user_id}`,
        details: entry.details
      });
    }

    // 3. Anomaly Detection (3+ voids in a day)
    if (entry.action === 'invoice_void') {
      await auditService.checkVoidAnomaly(entry.business_id, entry.user_id);
    }
  },

  createSystemAlert: async (businessId: string, alert: any) => {
    const { error } = await supabase.from('anomaly_log').insert([{
      business_id: businessId,
      title: alert.message,
      type: alert.type,
      severity: alert.severity,
      details: alert.details,
      detected_at: new Date().toISOString()
    }]);
    if (error) throw error;
  },

  checkVoidAnomaly: async (businessId: string, userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .eq('action', 'invoice_void')
      .gte('timestamp', `${today}T00:00:00Z`);

    if (error) return;

    if (count && count >= 3) {
      await auditService.createSystemAlert(businessId, {
        type: 'security',
        severity: 'critical',
        message: `Anomaly Detected: User ${userId} has voided ${count} invoices today.`,
        details: { user_id: userId, count, date: today }
      });
    }
  },

  exportLogs: async (businessId: string) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const headers = ['Timestamp', 'User ID', 'Action', 'Module', 'IP Address', 'Details'];
    const rows = data.map(log => [
      log.timestamp,
      log.user_id,
      log.action,
      log.module,
      log.ip_address,
      JSON.stringify(log.metadata || log.details)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_log_${businessId}_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  clearLogs: async (businessId?: string) => {
    let query = supabase.from('audit_logs').delete();
    if (businessId) {
      query = query.eq('business_id', businessId);
    } else {
      query = query.neq('id', '');
    }
    const { error } = await query;
    if (error) throw error;
  }
};
