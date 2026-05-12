import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { business_id } = await req.json();
    if (!business_id) throw new Error("business_id is required");

    // 1. Fetch Products
    const { data: products, error: prodError } = await supabaseClient
      .from('products')
      .select('*, stock(quantity)')
      .eq('business_id', business_id);

    if (prodError) throw prodError;

    // 2. Fetch Movements for Velocity (14 days) and Dead Stock (60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: movements, error: movError } = await supabaseClient
      .from('stock_movements')
      .select('*')
      .eq('business_id', business_id)
      .gte('created_at', sixtyDaysAgo.toISOString());

    if (movError) throw movError;

    const insights = [];
    const velocityUpdates = [];

    for (const product of products) {
      const currentStock = product.stock?.[0]?.quantity || 0;
      
      // Calculate 14-day velocity
      const recentOut = movements.filter(m => 
        m.product_id === product.id && 
        (m.movement_type === 'out' || m.movement_type === 'sale') &&
        new Date(m.created_at) >= fourteenDaysAgo
      );
      const totalOut14 = recentOut.reduce((sum, m) => sum + Math.abs(m.quantity_change), 0);
      const dailyVelocity = totalOut14 / 14;

      // Days of stock remaining
      const daysRemaining = dailyVelocity > 0 ? currentStock / dailyVelocity : 9999;

      // EOQ Calculation
      // D = Annual Demand, S = Order Cost, H = Holding Cost
      const annualDemand = dailyVelocity * 365;
      const orderCost = 500; // Default estimate
      const holdingCost = (product.cost_price || 100) * 0.15; // 15% annual holding cost
      const eoq = holdingCost > 0 ? Math.sqrt((2 * annualDemand * orderCost) / holdingCost) : 0;

      // Dead Stock Detection (60 days)
      const hasMovement60 = movements.some(m => m.product_id === product.id && m.movement_type === 'out');
      const isDeadStock = !hasMovement60 && currentStock > 0;

      // Substitution Logic
      let substitution = null;
      if (currentStock <= (product.min_stock || 5)) {
        const margin = (product.selling_price || 0) - (product.cost_price || 0);
        const candidates = products.filter(p => 
          p.id !== product.id && 
          p.category_id === product.category_id && 
          (p.stock?.[0]?.quantity || 0) > (p.min_stock || 5)
        );
        
        substitution = candidates.find(p => {
          const pMargin = (p.selling_price || 0) - (p.cost_price || 0);
          return Math.abs(pMargin - margin) / (margin || 1) < 0.2; // 20% margin variance
        });
      }

      // Prepare Update
      velocityUpdates.push({
        product_id: product.id,
        business_id: business_id,
        avg_daily_sales: dailyVelocity,
        days_until_stockout: daysRemaining,
        velocity_trend: dailyVelocity > 0.5 ? 'increasing' : 'stable',
        urgency: daysRemaining < 3 ? 'critical' : daysRemaining < 7 ? 'watch' : 'healthy',
        eoq_quantity: Math.ceil(eoq),
        is_dead_stock: isDeadStock,
        substitution_product_id: substitution?.id || null,
        updated_at: new Date().toISOString()
      });

      // Generate Insights
      if (daysRemaining < 3) {
        insights.push({
          business_id,
          product_id: product.id,
          type: 'reorder',
          severity: 'critical',
          message: `${product.name} is CRITICAL. Stockout in ${Math.ceil(daysRemaining)} days. Suggested EOQ: ${Math.ceil(eoq)}.`,
          metadata: { dailyVelocity, daysRemaining, eoq }
        });
      } else if (daysRemaining < 7) {
        insights.push({
          business_id,
          product_id: product.id,
          type: 'reorder',
          severity: 'watch',
          message: `${product.name} is on WATCH. Stockout in ${Math.ceil(daysRemaining)} days.`,
          metadata: { dailyVelocity, daysRemaining }
        });
      }

      if (isDeadStock) {
        insights.push({
          business_id,
          product_id: product.id,
          type: 'dead_stock',
          severity: 'info',
          message: `${product.name} has zero movement in 60 days. Flagged as dead stock.`,
          metadata: { liquidation_suggestion: 'Bundle with top seller or offer 20% discount.' }
        });
      }
    }

    // 3. Batch Update stock_velocity
    // Using upsert
    const { error: upsertError } = await supabaseClient
      .from('stock_velocity')
      .upsert(velocityUpdates, { onConflict: 'product_id' });

    if (upsertError) throw upsertError;

    // 4. Insert Insights
    if (insights.length > 0) {
      await supabaseClient.from('inventory_insights').insert(insights);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: products.length,
      insights_generated: insights.length,
      source: "14-day rolling sales velocity"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
