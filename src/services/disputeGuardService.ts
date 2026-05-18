import { supabase } from "../lib/supabase";

export interface ConflictRisk {
  probability: number;
  reason: string;
  recommendation: string;
}

export const disputeGuardService = {
  /**
   * Predicts the likelihood of a dispute for a draft invoice
   */
  predictConflict: async (invoiceId: string): Promise<ConflictRisk | null> => {
    // 1. Fetch Invoice, Customer, and Items
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, contacts(*), invoice_items(*)')
      .eq('id', invoiceId)
      .single();

    if (!invoice) return null;

    let riskScore = 0;
    let reason = "Healthy transaction predicted.";
    let recommendation = "Proceed with normal dispatch.";

    // Factor A: Customer Payment Behavior
    const { data: overdueCount } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('contact_id', invoice.contact_id)
      .eq('status', 'overdue');

    if ((overdueCount?.length || 0) > 3) {
      riskScore += 40;
      reason = "Customer has chronic payment delays.";
      recommendation = "Request partial advance or use Visual Proof of Delivery.";
    }

    // Factor B: Product-Level Risks (e.g. Fragile or High Value)
    const highValueItems = invoice.invoice_items?.filter((item: any) => item.unit_price > 50000);
    if (highValueItems && highValueItems.length > 0) {
      riskScore += 25;
      reason = "Contains high-value inventory prone to transit disputes.";
      recommendation = "Attach photos of the items being packed to the invoice.";
    }

    // Factor C: First Time Customer
    const { data: totalInvoices } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('contact_id', invoice.contact_id);

    if ((totalInvoices?.length || 0) <= 1) {
      riskScore += 15;
      reason = "New relationship; verification required.";
      recommendation = "Call to confirm receipt of invoice after sending.";
    }

    const probability = Math.min(riskScore, 95);

    // Update Invoice with prediction
    await supabase
      .from('invoices')
      .update({ 
        dispute_probability: probability,
        predicted_dispute_reason: reason 
      })
      .eq('id', invoiceId);

    return {
      probability,
      reason,
      recommendation
    };
  }
};
