import { supabase } from "../supabase";

export const invoiceService = {
  getInvoices: async (page = 1, pageSize = 10, search = "") => {
    let query = supabase
      .from('invoices')
      .select('*, customers(name)', { count: 'exact' });

    if (search) {
      query = query.ilike('invoice_number', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('invoice_date', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  },

  createInvoice: async (invoiceData: any, items: any[]) => {
    // This uses your custom RPC for atomic invoice creation
    const { data, error } = await supabase.rpc('create_invoice_v6', {
      p_invoice: invoiceData,
      p_items: items
    });

    if (error) throw error;
    return data;
  }
};
