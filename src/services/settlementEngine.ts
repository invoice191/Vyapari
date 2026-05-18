import { supabase } from "../lib/supabase";

export interface SettlementOffer {
  discountPercent: number;
  discountAmount: number;
  newTotal: number;
  expiresAt: string;
}

export const settlementEngine = {
  /**
   * Generates a dynamic early payment offer
   */
  generateOffer: async (invoiceId: string): Promise<SettlementOffer | null> => {
    // 1. Fetch Invoice & Customer Details
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, contacts(credit_score)')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) return null;

    // 2. Calculate Variables
    const dueDate = new Date(invoice.due_date || invoice.created_at);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    // Base discount: 1% + (0.1% per day early)
    // Adjust based on credit score (higher score = lower risk = better discount for them)
    const trustBonus = ((invoice.contacts?.credit_score || 750) - 600) / 300; // 0 to 1
    let discountPercent = 1.0 + (daysUntilDue * 0.05) - (trustBonus * 0.2);
    
    // Ensure logical bounds (0.5% to 5%)
    discountPercent = Math.max(0.5, Math.min(5.0, discountPercent));

    const discountAmount = (invoice.total_amount * discountPercent) / 100;
    const newTotal = invoice.total_amount - discountAmount;
    
    // Offer expires in 48 hours or when invoice is due, whichever is sooner
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 48);
    const finalExpiry = expiryDate < dueDate ? expiryDate : dueDate;

    const offer: SettlementOffer = {
      discountPercent: parseFloat(discountPercent.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      newTotal: parseFloat(newTotal.toFixed(2)),
      expiresAt: finalExpiry.toISOString()
    };

    // 3. Update Invoice with Active Offer
    await supabase
      .from('invoices')
      .update({ active_offer: offer })
      .eq('id', invoiceId);

    // 4. Log the transaction draft
    await supabase.from('settlement_transactions').insert([{
      business_id: invoice.business_id,
      invoice_id: invoice.id,
      original_amount: invoice.total_amount,
      discount_offered: discountAmount,
      settlement_amount: newTotal,
      expires_at: finalExpiry.toISOString(),
      status: 'pending'
    }]);

    return offer;
  },

  /**
   * Accepts a settlement offer
   */
  acceptOffer: async (invoiceId: string) => {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('active_offer, total_amount, notes')
      .eq('id', invoiceId)
      .single();

    if (!invoice?.active_offer) return false;

    // Update invoice total and status
    const { error } = await supabase
      .from('invoices')
      .update({
        total_amount: invoice.active_offer.newTotal,
        notes: (invoice.notes || '') + `\n[Liquidated: ${invoice.active_offer.discountPercent}% early payment discount applied]`,
        active_offer: null // Clear offer after acceptance
      })
      .eq('id', invoiceId);

    if (error) return false;

    // Update transaction status
    await supabase
      .from('settlement_transactions')
      .update({ status: 'accepted' })
      .eq('invoice_id', invoiceId)
      .eq('status', 'pending');

    return true;
  }
};
