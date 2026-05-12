import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { productId, businessId } = await req.json();
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Fetch Product & Supplier Details
    const { data: product } = await supabase
      .from("products")
      .select("*, contacts(*)")
      .eq("id", productId)
      .single();

    if (!product) throw new Error("Product not found");

    // 2. Simulate "Market Browsing" using Gemini + Search Context
    // In a real app, we'd use search_web tool here if called via an agent, 
    // but in an edge function we simulate the negotiation logic.
    
    const prompt = `
      You are the VANI Procurement Agent for Vyapari ERP. 
      Product: ${product.name}
      Current Supplier: ${product.contacts?.name || 'Unknown'}
      Last Purchase Price: ₹${product.cost_price}
      Target Quantity: ${product.reorder_qty || 50}
      
      Task:
      1. Simulate 'browsing' 3 virtual vendor catalogs for this product.
      2. Compare their real-time pricing (simulated based on market trends).
      3. Negotiate a deal if the price is higher than historical cost.
      4. Return a structured JSON with the best 'Zero-Touch' replenishment recommendation.
      
      Output Format:
      {
        "best_vendor": string,
        "negotiated_price": number,
        "savings_vs_historical": number,
        "justification": string,
        "action_taken": "PO_DRAFTED" | "NEGOTIATION_PENDING"
      }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
    });

    const result = await response.json();
    const decision = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    // 3. Create Draft PO if successful
    if (decision.action_taken === "PO_DRAFTED") {
      await supabase.from("purchase_orders").insert({
        business_id: businessId,
        supplier_id: product.supplier_id,
        status: "draft",
        total_amount: decision.negotiated_price * (product.reorder_qty || 50),
        notes: `AUTONOMOUS AGENT PROCUREMENT: ${decision.justification}`
      });
    }

    return new Response(JSON.stringify(decision), {
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

