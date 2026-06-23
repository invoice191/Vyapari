import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Razorpay Checkout Function Booted");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { invoiceId, businessId, amount } = body;

    if (!invoiceId || !amount || !businessId) {
      throw new Error("Missing required parameters: invoiceId, businessId, and amount");
    }

    // Connect to Supabase to fetch specific business settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: business } = await supabase
      .from("businesses")
      .select("settings")
      .eq("id", businessId)
      .single();

    // Prioritize the vendor's own key. Fallback to platform's master key for demo purposes.
    const rzpKey = business?.settings?.razorpay_key_id || Deno.env.get("RAZORPAY_KEY_ID");
    const rzpSecret = business?.settings?.razorpay_secret || Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!rzpKey || !rzpSecret) {
      throw new Error("Razorpay is not configured for this vendor or platform.");
    }

    // Call Razorpay API to create an order
    const authHeader = `Basic ${btoa(`${rzpKey}:${rzpSecret}`)}`;
    
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // in paise
        currency: "INR",
        receipt: invoiceId.slice(0, 40) // Razorpay receipt max length is 40
      })
    });

    const orderData = await response.json();

    if (!response.ok || orderData.error) {
       console.error("Razorpay API Error:", orderData);
       throw new Error(orderData.error?.description || "Failed to create Razorpay Order.");
    }

    // Send back the order details AND the specific Key ID so the frontend can initialize the SDK correctly
    return new Response(JSON.stringify({
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: rzpKey
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
