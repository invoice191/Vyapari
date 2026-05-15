import { supabase } from "../lib/supabase";
import { auditService } from "./auditService";

export const invoiceService = {
  // ... existing methods ...
  getInvoices: async (businessId: string, page = 1, pageSize = 20, search = "") => {
    let query = supabase
      .from('invoices')
      .select('*, contacts(name, phone)', { count: 'exact' })
      .eq('business_id', businessId);

    if (search) {
      query = query.ilike('invoice_number', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return await query
      .order('invoice_date', { ascending: false })
      .range(from, to);
  },

  createInvoice: async (businessId: string, invoice: any, userId: string, bypassCreditCheck = false) => {
    if (!bypassCreditCheck && invoice.contact_id) {
      const { data: creditData, error: creditError } = await supabase.rpc('check_credit_automation', {
        p_business_id: businessId,
        p_contact_id: invoice.contact_id,
        p_new_invoice_amount: invoice.total_amount || 0
      });

      if (!creditError && creditData && creditData.length > 0) {
        const check = creditData[0];
        if (check.is_blocked) {
          const err = new Error(check.block_reason || "Credit block active");
          (err as any).creditCheck = {
            is_blocked: check.is_blocked,
            block_reason: check.block_reason,
            outstanding_amount: check.outstanding_amount,
            credit_limit: check.credit_limit,
            overdue_count: check.overdue_count
          };
          throw err;
        }
      }
    }

    // 1. Insert Invoice
    const { data: inv, error: invError } = await supabase
      .from('invoices')
      .insert({
        business_id: businessId,
        contact_id: invoice.contact_id,
        customer_name: invoice.customer_name || null,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date || new Date().toISOString().slice(0, 10),
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        status: invoice.payment_status || invoice.status || 'pending',
        payment_status: invoice.payment_status || 'unpaid',
        created_by: userId,
        notes: invoice.notes || null,
        internal_notes: invoice.internal_notes || null,
        created_via: invoice.created_via || 'manual'
      })
      .select()
      .single();

    if (invError) throw invError;

    // 2. Insert Items with strict business_id scoping
    if (invoice.items && invoice.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoice.items.map((item: any) => ({
          business_id: businessId,
          invoice_id: inv.id,
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown',
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || 0,
          cost_price: item.cost_price || 0
        })));

      if (itemsError) throw itemsError;
    }

    // 3. Log Action
    await auditService.logAction({
      business_id: businessId,
      user_id: userId,
      action: 'invoice_create',
      module: 'Invoices',
      metadata: { invoice_id: inv.id, total: invoice.total_amount, number: inv.invoice_number }
    });

    // 4. Trigger Telegram Alerts (Instant Notifications)
    try {
      // a. Check for Low Stock (if stock < 10)
      if (invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          const { data: product } = await supabase
            .from('products')
            .select('name, quantity')
            .eq('id', item.product_id)
            .single();
            
          if (product && product.quantity < 10) {
            await supabase.functions.invoke("telegram-alert", {
              body: {
                business_id: businessId,
                alert_type: "LOW_STOCK",
                data: {
                  product_name: product.name,
                  stock_quantity: product.quantity
                }
              }
            });
          }
        }
      }

        });
      }

      // c. Real-Time Transaction Stream (User Requested: "Every Entry")
      const { data: creator } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
      const staffName = creator?.full_name || 'Staff';
      
      const itemsSummary = invoice.items.map((it: any) => ` • ${it.product_name} (x${it.quantity})`).join('\n');
      const totalProfit = invoice.items.reduce((s: number, it: any) => s + ((it.unit_price - (it.cost_price || 0)) * it.quantity), 0);

      let custName = invoice.customer_name || 'Guest';
      if (invoice.contact_id) {
        const { data: c } = await supabase.from('contacts').select('name').eq('id', invoice.contact_id).single();
        if (c) custName = c.name;
      }

      await supabase.functions.invoke("telegram-alert", {
        body: {
          business_id: businessId,
          alert_type: "NEW_SALE",
          data: {
            invoice_number: inv.invoice_number,
            customer_name: custName,
            total_amount: Number(invoice.total_amount),
            profit: totalProfit,
            staff_name: staffName,
            items_summary: itemsSummary
          }
        }
      });
    } catch (alertError) {
      console.error("Telegram alert trigger failed:", alertError);
      // Non-blocking error, don't throw
    }

    return inv;
  },

  voidInvoice: async (businessId: string, invoiceId: string, userId: string, reason: string) => {
    const { data: before } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();

    const { data: inv, error } = await supabase
      .from('invoices')
      .update({ status: 'voided', internal_notes: `Voided: ${reason}` })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    await auditService.logAction({
      business_id: businessId,
      user_id: userId,
      action: 'invoice_void',
      module: 'Invoices',
      metadata: { 
        invoice_id: invoiceId, 
        reason,
        before,
        after: inv
      }
    });

    return inv;
  },

  getCustomers: async (businessId: string) => {
    return await supabase
      .from('contacts')
      .select('*')
      .eq('business_id', businessId)
      .eq('type', 'customer')
      .order('name');
  },
  
  // ... other AI methods ...
  parseNaturalLanguageInvoice: async (businessId: string, command: string, products: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('invoice-ai', {
        body: { 
          action: 'natural-language-billing', 
          payload: { command, products, businessId } 
        }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("NL Billing Failure:", err);
      throw err;
    }
  },

  getPaymentRiskScore: async (businessId: string, invoice: any, history: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('invoice-ai', {
        body: { 
          action: 'risk-scoring', 
          payload: { invoice, history, businessId } 
        }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Risk Scoring Failure:", err);
      throw err;
    }
  },

  recordPayment: async (businessId: string, invoiceId: string, amount: number, method: string, reference?: string) => {
    const { data: inv } = await supabase.from('invoices').select('amount_paid, total_amount').eq('id', invoiceId).single();
    if (!inv) throw new Error("Invoice not found");

    const newPaid = Number(inv.amount_paid || 0) + Number(amount);
    const newRemaining = Number(inv.total_amount) - newPaid;
    const newStatus = newRemaining <= 0 ? 'paid' : 'partial';

    const { error: payError } = await supabase.from('invoice_payments').insert({
      business_id: businessId,
      invoice_id: invoiceId,
      amount: amount,
      payment_mode: method,
      payment_reference: reference,
      paid_at: new Date().toISOString()
    });

    if (payError) throw payError;

    const { error: invError } = await supabase.from('invoices').update({
      amount_paid: newPaid,
      amount_remaining: newRemaining,
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : null
    }).eq('id', invoiceId);

    if (invError) throw invError;
    
    return { success: true, newStatus };
  }
};
