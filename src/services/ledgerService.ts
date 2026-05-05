import { supabase } from "../supabase";

export const ledgerService = {
  getLedgerEntries: async (page = 1, pageSize = 10, search = "") => {
    let query = supabase
      .from('ledger_entries')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('entity_name', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('date', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  }
};
