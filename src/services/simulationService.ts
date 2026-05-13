import { supabase } from "../lib/supabase";

export interface SimulationParams {
  productId: string;
  newPrice: number;
  horizon: string;
}

export const simulationService = {
  runSimulation: async (params: SimulationParams, businessId: string) => {
    // 1. Fetch Product Details
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.productId)
      .single();

    if (pError) throw pError;

    // 2. Fetch Historical Sales (Last 6 Months)
    const { data: sales, error: sError } = await supabase
      .from('invoice_items')
      .select('quantity, total_amount, invoices(created_at)')
      .eq('product_id', params.productId)
      .gte('invoices.created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('invoices(created_at)', { ascending: true });

    if (sError) throw sError;

    // 3. Fetch Upcoming Festivals
    const { data: festivals, error: fError } = await supabase
      .from('festival_calendar')
      .select('*')
      .gte('festival_date', new Date().toISOString())
      .limit(5);

    if (fError) throw fError;

    // 4. Call Edge Function
    const { data, error } = await supabase.functions.invoke('simulation-lab', {
      body: {
        action: 'run-simulation',
        payload: {
          product,
          historicalSales: sales,
          festivals,
          parameters: {
            newPrice: params.newPrice,
            horizon: params.horizon
          }
        }
      }
    });

    if (error) throw error;
    return data;
  }
};
