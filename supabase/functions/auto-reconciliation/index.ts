import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { business_id } = await req.json();

    if (!business_id) throw new Error("business_id is required");

    // 1. Fetch un-reconciled ledger entries (credits)
    // We assume ledger entries with type 'credit' and no reconciliation_attempt are candidates
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("business_id", business_id)
      .eq("type", "credit")
      .order("created_at", { ascending: false })
      .limit(20);

    if (ledgerError) throw ledgerError;

    // 2. Fetch open invoices
    const { data: openInvoices, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, contacts(name)")
      .eq("business_id", business_id)
      .not("status", "eq", "paid")
      .not("status", "eq", "cancelled")
      .limit(50);

    if (invoiceError) throw invoiceError;

    if (ledgerEntries.length === 0 || openInvoices.length === 0) {
      return new Response(JSON.stringify({ message: "Nothing to reconcile", matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Construct Gemini Prompt
    const systemPrompt = `
      You are Vyapari's Auto-Reconciliation Engine.
      Your task is to match bank ledger entries (payments received) to open invoices.
      
      RULES:
      1. Match by Amount: Exact matches are high confidence.
      2. Match by Name: Look for customer names or fragments in the ledger description.
      3. Match by Reference: Look for invoice numbers (e.g., INV-001) in descriptions.
      4. Date Proximity: Payments usually happen within 30 days of an invoice.
      
      Output JSON format:
      {
        "matches": [
          {
            "ledger_entry_id": "uuid",
            "invoice_id": "uuid",
            "confidence": 0-100,
            "reason": "Matching explanation"
          }
        ]
      }
    `;

    const userPrompt = `
      Ledger Entries: ${JSON.stringify(ledgerEntries)}
      Open Invoices: ${JSON.stringify(openInvoices.map(i => ({ id: i.id, number: i.invoice_number, amount: i.total_amount, customer: i.contacts?.name, date: i.invoice_date })))}
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const aiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        generationConfig: { 
          temperature: 0.1,
          response_mime_type: "application/json"
        } 
      })
    });

    const aiResult = await aiResponse.json();
    const text = aiResult.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error("AI failed to generate matches");
    
    const { matches } = JSON.parse(text);

    // 4. Save results
    if (matches && matches.length > 0) {
      const attempts = matches.map((m: any) => ({
        business_id,
        ledger_entry_id: m.ledger_entry_id,
        matched_invoice_id: m.invoice_id,
        confidence_score: m.confidence,
        matching_reason: m.reason,
        status: m.confidence > 90 ? 'pending' : 'pending', // We could auto-confirm > 95, but safer to stay pending
        ai_metadata: m
      }));

      await supabase.from("reconciliation_attempts").insert(attempts);
    }

    return new Response(JSON.stringify({ success: true, matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[Auto-Reconciliation Error]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
