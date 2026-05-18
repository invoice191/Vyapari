import { supabase } from "../lib/supabase";
import crypto from 'crypto';

export const meshService = {
  /**
   * Discovers if a contact (customer/supplier) is also using Vyapari
   */
  discoverPeer: async (gstin: string): Promise<string | null> => {
    if (!gstin) return null;
    
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('gstin', gstin)
      .single();

    if (error || !data) return null;
    return data.id;
  },

  /**
   * Generates a digital fingerprint for an invoice
   */
  generateFingerprint: (invoiceData: any): string => {
    const payload = `${invoiceData.invoice_number}-${invoiceData.total_amount}-${invoiceData.business_id}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  },

  /**
   * Broadcasts an invoice to a peer's incoming drafts
   */
  broadcastToPeer: async (invoiceId: string, peerBusinessId: string) => {
    // 1. Get source invoice and sender info
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, businesses(name)')
      .eq('id', invoiceId)
      .single();

    if (!invoice) return false;

    // 2. Generate security fingerprint
    const fingerprint = meshService.generateFingerprint(invoice);

    // 3. Create entry in target business's peer_drafts
    const { error } = await supabase
      .from('peer_drafts')
      .insert([{
        target_business_id: peerBusinessId,
        sender_business_name: (invoice as any).businesses?.name || 'Vyapari Peer',
        sender_business_id: invoice.business_id,
        invoice_data: invoice,
        digital_fingerprint: fingerprint,
        status: 'pending'
      }]);

    if (error) {
      console.error('Mesh broadcast failed:', error);
      return false;
    }

    // 4. Mark original invoice as "Meshed"
    await supabase
      .from('invoices')
      .update({ digital_fingerprint: fingerprint })
      .eq('id', invoiceId);

    return true;
  },

  /**
   * Accepts an incoming peer draft and converts it to a real Purchase Invoice
   */
  acceptPeerDraft: async (
    draftId: string, 
    targetBusinessId: string,
    hybridOptions?: {
      isHybrid: boolean;
      creditNoteValue: number;
      taxEscrowAmount: number;
      disputeReason: string;
    }
  ) => {
    const { data: draft } = await supabase
      .from('peer_drafts')
      .select('*')
      .eq('id', draftId)
      .single();

    if (!draft) return false;

    // 1. Create a local purchase invoice from the draft data
    const purchaseAmount = hybridOptions?.isHybrid 
      ? draft.invoice_data.total_amount - (hybridOptions.creditNoteValue || 0)
      : draft.invoice_data.total_amount;

    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert([{
        business_id: targetBusinessId,
        invoice_number: `MESH-${draft.invoice_data.invoice_number}`,
        total_amount: purchaseAmount,
        is_purchase: true,
        mesh_source_id: draft.invoice_data.id,
        digital_fingerprint: draft.digital_fingerprint,
        status: 'draft',
        notes: hybridOptions?.isHybrid
          ? `Auto-generated via Vyapari Mesh (Hybrid Dispute Resolution: Credit Note ₹${hybridOptions.creditNoteValue}, Escrow ₹${hybridOptions.taxEscrowAmount})`
          : `Auto-generated via Vyapari Mesh from ${draft.sender_business_name}`
      }])
      .select()
      .single();

    if (error) return false;

    // 2. Update draft status with hybrid params so trigger can pick them up
    const updatePayload: any = { status: 'accepted' };
    if (hybridOptions?.isHybrid) {
      updatePayload.is_hybrid_acceptance = true;
      updatePayload.credit_note_auto_value = hybridOptions.creditNoteValue;
      updatePayload.tax_escrow_amount = hybridOptions.taxEscrowAmount;
      updatePayload.dispute_reason = hybridOptions.disputeReason;
    }

    await supabase
      .from('peer_drafts')
      .update(updatePayload)
      .eq('id', draftId);

    return true;
  }
};
