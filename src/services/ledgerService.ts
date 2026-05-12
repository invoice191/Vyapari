import { supabase } from "../lib/supabase";

export const ledgerService = {
  getLedgerEntries: async (businessId: string, page = 1, pageSize = 10, search = "") => {
    let query = supabase
      .from('ledger_entries')
      .select('*, contacts(*), invoices(*, invoice_items(*))', { count: 'exact' })
      .eq('business_id', businessId);

    if (search) {
      query = query.ilike('entity_name', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  },

  createEntry: async (businessId: string, entry: any) => {
    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({ ...entry, business_id: businessId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
