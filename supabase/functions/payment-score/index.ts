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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contactId, invoiceAmount, businessId } = await req.json();

    if (!contactId || !businessId) {
      throw new Error("Missing contactId or businessId");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch historical ledger entries and recency
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("contact_id", contactId)
      .eq("business_id", businessId)
      .order("timestamp", { ascending: false })
      .limit(20);

    if (ledgerError) throw ledgerError;

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (contactError) throw contactError;

    const prompt = `
      You are a Predictive Collection Analyst for Vyapari ERP.
      Assign a "Propensity to Pay" score (0-100) to this customer based on their historical ledger entries.
      Return ONLY valid JSON. No markdown.
      {
        "probability": number (0-100),
        "risk_level": "low" | "medium" | "high",
        "reason": string (max 12 words),
        "suggestion": string (max 12 words),
        "escalation_required": boolean,
        "credit_block": boolean
      }

      Rules:
      - Score > 80: Consistent on-time payments.
      - Score 40-80: Occasional delays or increasing outstanding.
      - Score < 40: Frequent delays, large outstanding, or no recent payments.
      - If outstanding_balance > credit_limit, flag as high risk and set credit_block to true.
      - If risk_level is high, set credit_block to true.

      Customer: ${JSON.stringify(contact)}
      Historical Ledger: ${JSON.stringify(ledgerEntries)}
      Current Invoice Amount: ₹${invoiceAmount}
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      })
    });

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    return new Response(text, {
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

