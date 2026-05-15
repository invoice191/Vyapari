import { supabase } from '../lib/supabase';
import { Invoice } from "./types";

export const dunningService = {
  /**
   * Evaluates payment risk for unpaid invoices and schedules reminders.
   */
  evaluateRisk: (invoices: Invoice[]) => {
    const now = new Date();
    return invoices
      .filter(inv => inv.status === 'pending')
      .map(inv => {
        const dueDate = new Date(inv.due_date || inv.invoice_date);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        
        let riskLevel = 'Low';
        if (daysOverdue > 30) riskLevel = 'High';
        else if (daysOverdue > 7) riskLevel = 'Medium';

        return {
          ...inv,
          daysOverdue,
          riskLevel,
          requiresDunning: daysOverdue > 3 // Start reminding after 3 days
        };
      });
  },

  /**
   * Sends a reminder via the SMS/WhatsApp service.
   */
  sendReminder: async (invoiceId: string, customerPhone: string, message: string, type: 'sms' | 'whatsapp' = 'sms', businessId?: string, contactId?: string) => {
    try {
      const { smsService } = await import('./smsService');
      
      // Ensure phone is formatted
      const formatPhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length === 10) return `+91${cleaned}`;
        return phone.startsWith("+") ? phone : `+${phone}`;
      };
 
      const result = await smsService.sendMessage({
        phone: formatPhone(customerPhone),
        message: message,
        type: type,
        referenceId: invoiceId,
        referenceType: 'invoice',
        businessId,
        contactId
      });
 
      return result;
    } catch (error) {
      console.error("Failed to send dunning reminder:", error);
      throw error;
    }
  }
};
