import { supabase } from "../supabase";

export const analyticsService = {
  getSalesSummary: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('invoice_date', { ascending: false })
      .limit(100);

    if (error) throw error;
    // Adapt to component needs
    return data.map(inv => ({
      ...inv,
      amount: inv.total_amount,
      timestamp: { toDate: () => new Date(inv.created_at) }
    }));
  },

  getInventorySummary: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, stock(quantity)');

    if (error) throw error;
    return data.map(p => ({
      ...p,
      stock: p.stock?.[0]?.quantity || 0
    }));
  },

  getDashboardMetrics: async () => {
    // Calling RPC for performance
    const { data, error } = await supabase.rpc('get_consolidated_analytics');
    if (error) throw error;
    return data;
  }
};
