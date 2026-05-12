import { supabase } from "../lib/supabase";
import { Product } from "./types";

export const inventoryService = {
  getInventory: async (businessId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, stock(quantity), stock_movements(*), contacts(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return {
      data: (data || []).map(p => ({
        ...p,
        price: p.selling_price || p.price || 0
      })),
      error: null
    };
  },

  getProducts: async (businessId: string, page = 1, pageSize = 10, search = "", category = "All") => {
    let query = supabase
      .from('products')
      .select('*, stock(quantity), stock_movements(*), contacts(*)', { count: 'exact' })
      .eq('business_id', businessId);
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (category && category !== "All") {
      query = query.eq('category', category);
    }
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    if (error) throw error;
    
    return {
      data: (data || []).map(p => ({
        ...p,
        price: p.selling_price || p.price || 0
      })),
      count
    };
  },

  createProduct: async (businessId: string, product: Partial<Product>, userId?: string) => {
    const trimmedName = product.name?.trim() || "";
    if (!trimmedName) {
      throw new Error("Product name is required");
    }
    
    // Case-insensitive duplicate check
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id, name')
      .eq('business_id', businessId)
      .ilike('name', trimmedName);

    if (checkError) throw checkError;

    const duplicate = existingProducts?.find(
      (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      throw new Error("Product already stored in inventory");
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        business_id: businessId,
        name: trimmedName,
        sku: product.sku || null,
        category_id: product.category_id || null,
        selling_price: product.selling_price || 0,
        cost_price: product.cost_price || 0,
        reorder_point: (product as any).min_stock_level || 10,
        quantity: (product as any).stock || 0,
        unit: (product as any).unit || 'pcs',
        gst_rate: (product as any).tax_rate || 18
      }])
      .select()
      .single();

    if (error) throw error;

    // Log the event with correct columns and user_id fallback
    let finalUserId = userId || null;
    if (!finalUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        finalUserId = authData.user?.id || null;
      } catch (e) {
        console.warn("Failed to get auth user for audit log:", e);
      }
    }

    await supabase.from('audit_logs').insert([{
      business_id: businessId,
      user_id: finalUserId,
      action: 'PRODUCT_CREATED',
      module: 'Inventory',
      metadata: { product_id: data.id, product_name: data.name }
    }]);

    if (data?.id) {
      // Ensure we create a matching row in stock
      const { error: stockErr } = await supabase.from('stock').insert([{ 
        product_id: data.id, 
        business_id: businessId,
        quantity: (product as any).stock || 0 
      }]);
      if (stockErr) console.error("Failed to insert stock row:", stockErr);
    }

    return data;
  },

  updateProduct: async (businessId: string, productId: string, updates: Partial<Product>, userId?: string) => {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    // Log the event
    let finalUserId = userId || null;
    if (!finalUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        finalUserId = authData.user?.id || null;
      } catch (e) {}
    }

    await supabase.from('audit_logs').insert([{
      business_id: businessId,
      user_id: finalUserId,
      action: 'PRODUCT_UPDATED',
      module: 'Inventory',
      metadata: { product_id: productId, updates }
    }]);

    return data;
  },

  updateStock: async (businessId: string, productId: string, quantity: number, type: 'in' | 'out', note: string) => {
    const { data, error } = await supabase.rpc('update_stock_with_log', {
      p_id: productId,
      p_qty: quantity,
      p_type: type,
      p_note: note,
      p_biz_id: businessId
    });
    if (error) throw error;
    return data;
  },

  deleteProduct: async (businessId: string, id: string, userId?: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) throw error;

    // Log the event with correct columns and user_id fallback
    let finalUserId = userId || null;
    if (!finalUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        finalUserId = authData.user?.id || null;
      } catch (e) {
        console.warn("Failed to get auth user for audit log:", e);
      }
    }

    await supabase.from('audit_logs').insert([{
      business_id: businessId,
      user_id: finalUserId,
      action: 'PRODUCT_DELETED',
      module: 'Inventory',
      metadata: { product_id: id }
    }]);
  },

  getStockLogs: async (businessId: string, productId?: string) => {
    let query = supabase
      .from('stock_logs')
      .select('*, products(name)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (productId) query = query.eq('item_id', productId);
    return await query;
  }
};
