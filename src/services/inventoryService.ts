import { supabase } from "../supabase";

export const inventoryService = {
  getProducts: async (page = 1, pageSize = 10, search = "", category = "") => {
    let query = supabase
      .from('products')
      .select('*, stock(quantity)', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (category && category !== "All") {
      query = query.eq('category', category);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('name')
      .range(from, to);

    if (error) throw error;
    return { data, count };
  },

  createProduct: async (product: any) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        category: product.category,
        price: product.price,
        min_stock: product.minStock ?? product.min_stock ?? 10,
        description: product.description
      }])
      .select()
      .single();

    if (error) throw error;

    // Initialize stock row
    if (data?.id) {
      await supabase.from('stock').insert([{ product_id: data.id, quantity: product.stock || 0 }]);
    }
    return data;
  },

  deleteProduct: async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
  },

  getStockLogs: async (productId: string) => {
    const { data, error } = await supabase
      .from('stock_logs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  updateStock: async (productId: string, quantity: number, type: 'in' | 'out', note: string) => {
    const { data, error } = await supabase.rpc('update_stock_with_log', {
      p_id: productId,
      p_qty: quantity,
      p_type: type,
      p_note: note
    });

    if (error) throw error;
    return data;
  }
};
