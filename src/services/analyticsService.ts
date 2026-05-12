import { supabase } from "../lib/supabase";

export const analyticsService = {
  getSalesSummary: async (businessId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*, products(*, categories(*)))')
      .eq('business_id', businessId)
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

  getInventorySummary: async (businessId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, stock(quantity)')
      .eq('business_id', businessId);

    if (error) throw error;
    return data.map(p => ({
      ...p,
      stock: p.stock?.[0]?.quantity !== undefined ? p.stock[0].quantity : (Number(p.quantity) || 0),
      minStock: Number(p.reorder_point) || 10
    }));
  },

  getDashboardMetrics: async (businessId: string) => {
    // Calling RPC for performance
    const { data, error } = await supabase.rpc('get_consolidated_analytics', {
      p_business_id: businessId
    });
    if (error) throw error;
    return data;
  },

  getCategoryDistribution: async (businessId: string, filters?: { startDate?: string, endDate?: string }) => {
    let query = supabase
      .from('invoice_items')
      .select('quantity, total, product_id, products(categories(name)), invoices!inner(status)')
      .eq('invoices.business_id', businessId)
      .neq('invoices.status', 'cancelled');

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    const stats: Record<string, number> = {};
    (data || []).forEach(item => {
      const cat = (item.products as any)?.categories?.name || 'Other';
      stats[cat] = (stats[cat] || 0) + Number(item.total || 0);
    });
    
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    return Object.entries(stats).map(([name, value]) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Fallback random color
    })).sort((a, b) => b.value - a.value);
  },

  getHistoricalRevenue: async (businessId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('created_at, total_amount')
      .eq('business_id', businessId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    const monthlyData: Record<string, number> = {};
    data.forEach(inv => {
      const month = new Date(inv.created_at).toLocaleString('default', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + inv.total_amount;
    });
    
    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    }));
  },

  getProducts: async (businessId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data;
  },

  getCategories: async (businessId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('business_id', businessId)
      .order('name');
    if (error) throw error;
    return data;
  },

  getFilteredRevenueTrend: async (businessId: string, filters: { productIds?: string[], startDate?: string, endDate?: string }) => {
    let query = supabase
      .from('invoice_items')
      .select('created_at, total, product_id, invoices!inner(status)')
      .eq('invoices.business_id', businessId)
      .neq('invoices.status', 'cancelled');

    if (filters.productIds && filters.productIds.length > 0) {
      query = query.in('product_id', filters.productIds);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    const trend: Record<string, number> = {};
    data.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString();
      trend[date] = (trend[date] || 0) + Number(item.total);
    });

    return Object.entries(trend).map(([date, value]) => ({ date, revenue: value }));
  },

  getItemDrilldown: async (businessId: string, itemId: string) => {
    // Get product details
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*, categories(name), stock(quantity)')
      .eq('id', itemId)
      .single();
    
    if (pError) throw pError;

    // Get today's sales for this product
    const today = new Date().toISOString().split('T')[0];
    const { data: sales, error: sError } = await supabase
      .from('invoice_items')
      .select('quantity, total, created_at, invoices!inner(contact_id, invoice_number, contacts(name))')
      .eq('product_id', itemId)
      .gte('created_at', today);

    if (sError) throw sError;

    return {
      product: {
        ...product,
        stock: product.stock?.[0]?.quantity || 0,
        category: product.categories?.name
      },
      todaySales: (sales || []).map((s: any) => ({
        quantity: s.quantity,
        amount: s.total,
        customer: s.invoices?.contacts?.name || 'Walk-in',
        invoice: s.invoices?.invoice_number,
        time: new Date(s.created_at).toLocaleTimeString()
      }))
    };
  }
};
