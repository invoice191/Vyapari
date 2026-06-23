import { supabase } from '../lib/supabase';
import { smsService } from './smsService';

export interface DailySummary {
  totalSales: number;
  invoiceCount: number;
  totalOverdue: number;
  lowStockList: string;
}

export const communicationService = {
  /**
   * Generates a daily strategic briefing summary of the business's current state.
   */
  generateDailySummary: async (businessId: string): Promise<DailySummary> => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Query today's invoices
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('total_amount, payment_status')
        .eq('business_id', businessId)
        .gte('created_at', todayStr);

      if (invError) throw invError;

      // Query products low on stock (less than 15 units)
      const { data: lowStock, error: stockError } = await supabase
        .from('products')
        .select('name, quantity')
        .eq('business_id', businessId)
        .lt('quantity', 15)
        .limit(3);

      if (stockError) throw stockError;

      // Query total unpaid overdue invoices
      const { data: overdueInvoices, error: overdueError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('business_id', businessId)
        .eq('payment_status', 'unpaid')
        .lt('due_date', todayStr);

      if (overdueError) throw overdueError;

      const totalSales = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
      const invoiceCount = invoices?.length || 0;
      const totalOverdue = overdueInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
      
      const lowStockList = lowStock && lowStock.length > 0
        ? lowStock.map(p => `${p.name} (${Number(p.quantity || 0).toFixed(0)} units left)`).join(', ')
        : 'All inventory is healthy!';

      return {
        totalSales,
        invoiceCount,
        totalOverdue,
        lowStockList
      };
    } catch (error) {
      console.error("[CommunicationService] Error compiling summary:", error);
      throw error;
    }
  },

  /**
   * Dispatches the daily briefing via WhatsApp / SMS.
   */
  sendDailySummary: async (businessId: string, phone: string, businessName: string): Promise<boolean> => {
    if (!phone) {
      console.warn("[CommunicationService] Aborting dispatch: Phone number not provided.");
      return false;
    }

    try {
      const summary = await communicationService.generateDailySummary(businessId);
      
      const message = `📈 *DAILY BUSINESS REPORT: ${businessName.toUpperCase()}*\n\n` +
        `💰 *Today's Total Sales:* ₹${summary.totalSales.toLocaleString('en-IN')}\n` +
        `🧾 *New Bills Created:* ${summary.invoiceCount}\n` +
        `🚨 *Unpaid Overdue Bills:* ₹${summary.totalOverdue.toLocaleString('en-IN')}\n` +
        `📦 *Low Stock Alerts:* ${summary.lowStockList}\n\n` +
        `Powered by Vyapari Auto-Pilot.`;

      await smsService.sendMessage({
        phone,
        message,
        type: 'whatsapp',
        referenceType: 'system',
        businessId
      });

      console.log("[CommunicationService] Automated daily briefing dispatched successfully to:", phone);
      return true;
    } catch (error) {
      console.error("[CommunicationService] Dispatch failed:", error);
      return false;
    }
  }
};
