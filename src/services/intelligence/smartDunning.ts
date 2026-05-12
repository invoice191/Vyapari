import { supabase } from "../../lib/supabase";

export type DunningTone = 'gentle' | 'professional' | 'firm' | 'urgent';

export interface SmartReminderParams {
  invoiceId: string;
  customerId: string;
  tone: DunningTone;
  includeLink: boolean;
}

export const smartDunningService = {
  /**
   * Generates a context-aware payment reminder message using AI tone logic
   */
  generateMessage: async (params: SmartReminderParams): Promise<string> => {
    // Fetch invoice and customer details for context
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, contacts(*)')
      .eq('id', params.invoiceId)
      .single();

    if (!invoice) throw new Error("Invoice not found");

    const amount = invoice.total_amount;
    const dueDate = new Date(invoice.due_date);
    const customerName = invoice.contacts?.name || 'Customer';

    const templates: Record<DunningTone, string> = {
      gentle: `Hi ${customerName}, hope you're doing well! Just a friendly nudge regarding invoice #${invoice.invoice_number} for ₹${amount}. If you've already paid, please ignore this. Thanks!`,
      professional: `Dear ${customerName}, this is a reminder that payment for Invoice #${invoice.invoice_number} (₹${amount}) was due on ${dueDate.toLocaleDateString()}. We would appreciate a prompt settlement. Regards, Team Vyapari.`,
      firm: `Hello ${customerName}, Invoice #${invoice.invoice_number} is now significantly overdue. Please ensure the payment of ₹${amount} is cleared by end of day to avoid any service interruptions.`,
      urgent: `URGENT: ${customerName}, your payment of ₹${amount} for Invoice #${invoice.invoice_number} is critically overdue. This is our final reminder before we proceed with further collection actions. Please pay immediately.`
    };

    let message = templates[params.tone];
    
    if (params.includeLink) {
      message += `\nPay securely here: https://vyapari.io/pay/${params.invoiceId}`;
    }

    return message;
  },

  /**
   * Suggests the best tone based on relationship and days overdue
   */
  suggestTone: (daysOverdue: number, customerRating: number = 5): DunningTone => {
    if (daysOverdue <= 3) return 'gentle';
    if (daysOverdue <= 10) return 'professional';
    if (customerRating < 3) return 'firm'; // Firm earlier for risky customers
    if (daysOverdue > 20) return 'urgent';
    return 'professional';
  }
};
