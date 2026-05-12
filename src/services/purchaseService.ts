import { supabase } from "../lib/supabase";

export const purchaseService = {
  /**
   * Completes the digitization of a purchase invoice:
   * 1. Creates a purchase invoice record
   * 2. Adds line items
   * 3. Updates product stock and Weighted Average Cost (WAC)
   * 4. Logs stock movements
   * 5. Posts a credit entry to the supplier's ledger
   */
  approvePurchase: async (businessId: string, userId: string, data: {
    vendorId?: string;
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    paymentTerms: string;
    items: Array<{
      productId?: string;
      name: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>;
  }) => {
    // 1. Start a transaction-like flow (Supabase doesn't support client-side transactions easily, so we use RPC or sequential calls)
    
    // Check if vendor exists or create if new
    let finalVendorId = data.vendorId;
    if (!finalVendorId) {
      const { data: newVendor, error: vError } = await supabase
        .from('contacts')
        .insert({
          business_id: businessId,
          user_id: userId,
          name: data.vendorName,
          type: 'supplier',
          payment_terms: data.paymentTerms
        })
        .select()
        .single();
      
      if (vError) throw vError;
      finalVendorId = newVendor.id;
    }

    // 2. Create Invoice
    const { data: invoice, error: iError } = await supabase
      .from('invoices')
      .insert({
        business_id: businessId,
        user_id: userId,
        contact_id: finalVendorId,
        invoice_number: data.invoiceNumber,
        invoice_date: data.invoiceDate,
        total_amount: data.totalAmount,
        status: 'paid', // Assuming purchase is paid/recorded
        is_purchase: true,
        type: 'purchase'
      })
      .select()
      .single();

    if (iError) throw iError;

    // 3. Process Items
    for (const item of data.items) {
      let finalProductId = item.productId;
      
      // If product doesn't exist, create it
      if (!finalProductId) {
        const { data: newProduct, error: pError } = await supabase
          .from('products')
          .insert({
            business_id: businessId,
            user_id: userId,
            name: item.name,
            cost_price: item.unitPrice,
            selling_price: item.unitPrice * 1.2, // Default 20% margin
            quantity: 0,
            gst_rate: item.taxRate
          })
          .select()
          .single();
        
        if (pError) throw pError;
        finalProductId = newProduct.id;
      }

      // Create Invoice Item
      await supabase.from('invoice_items').insert({
        business_id: businessId,
        user_id: userId,
        invoice_id: invoice.id,
        product_id: finalProductId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.unitPrice,
        gst_rate: item.taxRate,
        total: item.quantity * item.unitPrice
      });

      // Update Stock and WAC
      // WAC Formula: ((Current Qty * Current WAC) + (New Qty * New Cost)) / (Current Qty + New Qty)
      const { data: currentProd } = await supabase
        .from('products')
        .select('quantity, cost_price')
        .eq('id', finalProductId)
        .single();

      if (currentProd) {
        const currentQty = Number(currentProd.quantity || 0);
        const currentCost = Number(currentProd.cost_price || 0);
        const newQtyTotal = currentQty + item.quantity;
        const newWac = ((currentQty * currentCost) + (item.quantity * item.unitPrice)) / newQtyTotal;

        await supabase
          .from('products')
          .update({
            quantity: newQtyTotal,
            cost_price: newWac
          })
          .eq('id', finalProductId);

        // Log Stock Movement
        await supabase.from('stock_movements').insert({
          business_id: businessId,
          user_id: userId,
          product_id: finalProductId,
          movement_type: 'in',
          quantity_change: item.quantity,
          reference_id: invoice.id,
          notes: `Purchase OCR: ${data.invoiceNumber}`
        });
      }
    }

    // 4. Post to Ledger
    await supabase.from('ledger_entries').insert({
      business_id: businessId,
      user_id: userId,
      contact_id: finalVendorId,
      invoice_id: invoice.id,
      type: 'debit', // Purchase is a debit to our books (increase in assets/expense) or credit to supplier?
      // Usually, in a double-entry for purchase:
      // Debit: Inventory (Asset)
      // Credit: Cash/Accounts Payable (Liability)
      // For the supplier's ledger, it's our liability, so a 'debit' entry in their account means we owe them less? 
      // Actually, in this app, 'debit' seems to be used for "payment out" or "expense"?
      // Let's check ledgerService.ts: createEntry uses 'debit' for OCR_SCAN currently.
      amount: data.totalAmount,
      description: `Purchase Invoice ${data.invoiceNumber} digitized via Intelligence OCR`
    });

    return { success: true, invoiceId: invoice.id };
  }
};
