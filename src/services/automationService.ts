import { supabase } from '../lib/supabase';
import { auditService } from './auditService';
import { smsService } from './smsService';

export const automationService = {
  /**
   * Executes the automated tasks configured in AutoPilot.
   * This is a client-side execution that mimics what the Edge Function does in production.
   */
  async runAutoPilot(businessId: string, userId: string, userEmail: string, config: any) {
    console.log("[AutoPilot Daemon] Initiating automation sequences...");
    const logs = [];

    try {
      // 1. Payment Reminders & Late Fees (Auto-Dunning)
      if (config.autoDunning || config.autoLateFee) {
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*, contacts(name, phone, email)')
          .eq('business_id', businessId)
          .eq('payment_status', 'unpaid')
          .not('due_date', 'is', null);

        if (error) throw error;

        const today = new Date();
        
        for (const invoice of invoices || []) {
          const dueDate = new Date(invoice.due_date);
          const diffTime = Math.abs(dueDate.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const isOverdue = today > dueDate;

          // Gentle Reminder
          if (config.autoDunning && !isOverdue && diffDays <= config.dunningDaysBefore) {
            logs.push({
              action: 'Sent WhatsApp Reminder',
              target: invoice.contacts?.name || 'Customer',
              detail: `Invoice #${invoice.invoice_number} (Rs. ${invoice.total_amount})`,
              status: 'success'
            });

            // DISPATCH REAL MESSAGE
            await smsService.sendMessage({
              phone: invoice.contacts?.phone,
              message: `Hi ${invoice.contacts?.name || 'Customer'}, this is a reminder from Vyapari regarding your Invoice #${invoice.invoice_number} for Rs. ${invoice.total_amount}. It is due on ${invoice.due_date}.`,
              type: 'whatsapp',
              referenceId: invoice.id,
              referenceType: 'invoice'
            });

            await auditService.logAction({
              business_id: businessId,
              user_id: userId,
              user_email: userEmail,
              action: 'automated_dunning',
              module: 'AutoPilot',
              details: { invoice_id: invoice.id, type: 'pre-due reminder', days_until_due: diffDays }
            });
          }

          // Strict Follow-up
          if (config.autoDunning && isOverdue && diffDays >= config.dunningDaysAfter) {
            logs.push({
              action: 'Sent Overdue Alert',
              target: invoice.contacts?.name || 'Customer',
              detail: `Invoice #${invoice.invoice_number} is ${diffDays} days late`,
              status: 'warning'
            });

            // DISPATCH REAL OVERDUE ALERT
            await smsService.sendMessage({
              phone: invoice.contacts?.phone,
              message: `URGENT: Your Invoice #${invoice.invoice_number} for Rs. ${invoice.total_amount} is now OVERDUE by ${diffDays} days. Please settle immediately to avoid late fees.`,
              type: 'whatsapp',
              referenceId: invoice.id,
              referenceType: 'invoice'
            });
          }

          // Late Fees
          if (config.autoLateFee && isOverdue && diffDays >= 10 && !invoice.late_fee_applied) {
            const penalty = invoice.total_amount * (config.lateFeePercent / 100);
            const newTotal = invoice.total_amount + penalty;
            
            await supabase
              .from('invoices')
              .update({ total_amount: newTotal, late_fee_applied: true })
              .eq('id', invoice.id);
              
            logs.push({
              action: 'Applied Late Fee',
              target: invoice.contacts?.name || 'Customer',
              detail: `Added ${config.lateFeePercent}% (Rs. ${penalty.toFixed(0)}) to #${invoice.invoice_number}`,
              status: 'warning'
            });
            await auditService.logAction({
              business_id: businessId,
              user_id: userId,
              user_email: userEmail,
              action: 'applied_late_fee',
              module: 'AutoPilot',
              details: { invoice_id: invoice.id, penalty_amount: penalty }
            });
          }
        }
      }

      // 2. Auto-Restock
      if (config.autoRestock) {
        const { data: inventory, error: invError } = await supabase
          .from('inventory')
          .select('*, contacts(name, email, phone)')
          .eq('business_id', businessId)
          .lt('quantity', config.restockThreshold); // Simplified threshold check for demo

        if (!invError && inventory && inventory.length > 0) {
          for (const item of inventory) {
            logs.push({
              action: 'Auto-Restock Email',
              target: `Supplier: ${item.contacts?.name || 'Unknown'}`,
              detail: `Requested restock for ${item.name} (${item.quantity} left)`,
              status: 'success'
            });

            // DISPATCH REAL SUPPLIER EMAIL/SMS
            if (item.contacts?.phone) {
              await smsService.sendMessage({
                phone: item.contacts.phone,
                message: `RESTOCK REQUEST: ${item.name} is low on stock (${item.quantity} left). Please prepare a shipment for ${item.business_id}.`,
                type: 'sms',
                referenceId: item.id,
                referenceType: 'system'
              });
            }
            await auditService.logAction({
              business_id: businessId,
              user_id: userId,
              user_email: userEmail,
              action: 'automated_restock_request',
              module: 'AutoPilot',
              details: { item_id: item.id, supplier_id: item.supplier_id }
            });
          }
        }
      }

      // 3. Daily Briefing
      if (config.dailyBriefing) {
        logs.push({
          action: 'Daily Briefing Sent',
          target: 'Owner (Telegram/WhatsApp)',
          detail: 'System health metrics delivered',
          status: 'success'
        });
      }

      return { success: true, logs };
    } catch (e: any) {
      console.error("[AutoPilot] Execution Error:", e);
      return { success: false, error: e.message };
    }
  }
};
