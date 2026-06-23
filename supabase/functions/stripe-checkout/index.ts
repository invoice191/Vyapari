import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Stripe Checkout Function Booted");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { invoiceId, businessId, amount, customerName, customerEmail } = body;

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
    const stripeKey = business?.settings?.stripe_secret_key || Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeKey) {
      throw new Error("Stripe is not configured for this vendor or platform.");
    }

    const stripe = new Stripe(stripeKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Determine return URLs
    // Using the Origin header ensures it redirects back to the correct environment (local vs production)
    const reqOrigin = req.headers.get("origin") || "http://localhost:5173";
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Invoice #${invoiceId}`,
              description: `Payment for Vyapari Invoice`,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects amounts in subunits (e.g. paise)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${reqOrigin}/pay?inv=${invoiceId}&status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${reqOrigin}/pay?inv=${invoiceId}&status=cancelled`,
      customer_email: customerEmail || undefined,
      client_reference_id: invoiceId,
      metadata: {
        invoiceId: invoiceId,
      }
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Stripe Session Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
