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

  exportLogs: async (businessId: string, businessName = "Vyapari Business") => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();

    // Branded Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("VYAPARI SECURITY AUDIT", 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(159, 239, 0); // Neon
    doc.text(`CONFIDENTIAL SECURITY LOGS FOR: ${businessName.toUpperCase()}`, 15, 30);
    
    doc.setTextColor(255, 255, 255);
    doc.text(`DATE: ${new Date().toLocaleString()}`, 150, 30);

    const headers = [['Timestamp', 'User', 'Action', 'Module', 'IP Address', 'Severity']];
    const rows = data.map(log => [
      new Date(log.timestamp).toLocaleString('en-IN'),
      log.user_email || log.user_id.slice(0, 8),
      log.action.replace(/_/g, ' ').toUpperCase(),
      log.module.toUpperCase(),
      log.ip_address || '0.0.0.0',
      log.severity || 'INFO'
    ]);

    autoTable(doc, {
      startY: 50,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 35 }, 5: { fontStyle: 'bold' } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = data.cell.raw;
          if (val === 'Critical') data.cell.styles.textColor = [220, 38, 38];
          if (val === 'Warning') data.cell.styles.textColor = [217, 119, 6];
        }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Vyapari Intelligence Platform - Audit Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`Vyapari_Audit_Logs_${businessId}_${new Date().toISOString().slice(0,10)}.pdf`);
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
