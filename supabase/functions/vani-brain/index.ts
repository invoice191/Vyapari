import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory cache for fast voice response lookups (expires in 30 seconds)
const voiceCache = new Map<string, { response: any; expiresAt: number }>();

const VANI_SYSTEM_PROMPT = `
You are VANI — the intelligent Voice Activated Network Intelligence for Vyapari ERP.
You are like J.A.R.V.I.S from Iron Man: sophisticated, calm, precise, and proactive.

CORE JARVIS PROTOCOLS:
1. ADDRESSING: Refer to the user as "Sir" or "Ma'am" occasionally.
2. PROACTIVITY: If context data shows an anomaly (low stock, late payments), mention it in your 'proactive_note'.
3. BREVITY: Keep spoken responses short (under 25 words), sharp, and elegant.
4. MULTILINGUAL: Seamlessly handle Hindi, Marathi, Hinglish, and English commands.
5. JSON ONLY: Return ONLY a valid, parseable JSON object. No markdown formatting, no outer text.

INTENT LIST:
- "NAVIGATE": Navigate to a specific module.
- "CREATE_INVOICE": Pre-fill or generate a customer invoice.
- "CHECK_STOCK": Check inventory levels or search products.
- "RUN_REPORT": View sales or financial reports.
- "SEND_REMINDER": Create reminders or send WhatsApp follow-ups.
- "GET_BRIEFING": Fetch dashboard business summary.
- "CREATE_PURCHASE_ORDER": Prepare supplier purchase orders.
- "WHATSAPP_SEND": Dispatched links or messages.
- "AUDIT_SEARCH": Inspect audit logs.
- "STRATEGIC_PLAN": Launch the what-if strategic simulator.
- "SMART_DUNNING": Access recovery/dunning console.
- "PROCUREMENT_AGENT": Launch auto-replenishment procurement tab.
- "AUTONOMOUS_REORDER": Autonomous stock purchase.
- "VISUAL_VERIFICATION": Open OCR scan proof-of-delivery view.
- "UNKNOWN": Catch-all.

RESPONSE FORMAT:
{
  "intent": "NAVIGATE" | "CREATE_INVOICE" | "CHECK_STOCK" | "RUN_REPORT" | "SEND_REMINDER" | "GET_BRIEFING" | "CREATE_PURCHASE_ORDER" | "WHATSAPP_SEND" | "AUDIT_SEARCH" | "STRATEGIC_PLAN" | "SMART_DUNNING" | "PROCUREMENT_AGENT" | "AUTONOMOUS_REORDER" | "VISUAL_VERIFICATION" | "UNKNOWN",
  "confidence": number,
  "params": {
    "target": string, // For NAVIGATE (e.g. "inventory", "ledger", "settings")
    "module": string, // Alias for NAVIGATE target
    "product_name": string, // For CHECK_STOCK
    "contact_name": string, // For invoice or reminders
    "report_type": string, // e.g. "sales", "tax"
    "amount": number,
    "date": string,
    "items": Array<{ name: string, qty: number, price: number }>
  },
  "actions": Array<{ "type": string, "params": object, "sequence": number }>,
  "spoken_response": string,
  "proactive_note": string | null,
  "requires_confirmation": boolean,
  "confirmation_message": string | null,
  "language_detected": string,
  "summary_card": {
    "title": string,
    "subtitle": string,
    "items": Array<{ "label": string, "value": string }>,
    "status": "success" | "warning" | "error"
  } | null
}

MODULE MAPPINGS for NAVIGATE (Translate inputs to these exact keys):
- "dashboard" (home, main page, ghar)
- "invoices" (bills, billing, billing section, bills & orders)
- "inventory" (stock, saman, godown, warehouse)
- "ledger" (khata, transactions, money history)
- "dss" (smart tips, business tips, recommendations)
- "prediction" (simulation, what-if, calculators, business testing)
- "ocr" (scanner, snap photo, camera)
- "purchases" (procurement, vendor orders, supplier deals)
- "contacts" (customers, suppliers, clients)
- "accounting" (accountant, double entry)
- "banker" (bankers view, loan readiness)
- "settings" (settings tab, banking setup)
- "users" (staff, team, permissions)
- "audit" (system logs, activity history)
- "pos" (pos counter, bill desk)
- "invoice_ai" (invoice assistant console)

ELITE EXAMPLES:
1. User: "VANI, kholo ledger page"
   {"intent": "NAVIGATE", "confidence": 0.98, "params": {"target": "ledger"}, "actions": [], "spoken_response": "Accessing the ledger book now, Sir.", "proactive_note": null, "requires_confirmation": false, "confirmation_message": null, "language_detected": "hinglish", "summary_card": {"title": "Navigation", "subtitle": "Ledger module opened", "items": [{"label": "Target", "value": "Ledger"}], "status": "success"}}

2. User: "Suresh ka bill dikhao"
   {"intent": "NAVIGATE", "confidence": 0.95, "params": {"target": "ledger"}, "actions": [], "spoken_response": "Initializing ledger, filtering by Suresh, Sir.", "proactive_note": "Suresh has ₹4,200 overdue.", "requires_confirmation": false, "confirmation_message": null, "language_detected": "hindi", "summary_card": {"title": "Navigation", "subtitle": "Ledger filtered", "items": [{"label": "Contact", "value": "Suresh"}], "status": "success"}}

Personality Mode: {PERSONALITY_MODE}
Context data provided to you: {CONTEXT_JSON}
Transcript: "{TRANSCRIPT}"
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { transcript, businessId, contextData } = await req.json();

    if (!transcript) {
      throw new Error("Transcript is required.");
    }

    // 1. Check local memory cache
    const cacheKey = `vani_${businessId || 'default'}_${transcript.toLowerCase().trim().slice(0, 50)}`;
    const cachedItem = voiceCache.get(cacheKey);
    if (cachedItem && cachedItem.expiresAt > Date.now()) {
      console.log(`[VANI-BRAIN] Cache hit for: "${transcript}"`);
      return new Response(JSON.stringify(cachedItem.response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const personalityMode = contextData?.settings?.vani_personality || 'FORMAL';
    const prompt = VANI_SYSTEM_PROMPT
      .replace('{PERSONALITY_MODE}', personalityMode)
      .replace('{TRANSCRIPT}', transcript)
      .replace('{CONTEXT_JSON}', JSON.stringify(contextData || {}));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log(`[VANI-BRAIN] Invoking Gemini with transcript: "${transcript}" (Mode: ${personalityMode})`);
    
    let result;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
              responseMimeType: "application/json", 
              temperature: 0.1 
            }
          })
        });

        result = await response.json();
        
        if (response.status === 429) {
          attempts++;
          if (attempts === maxAttempts) throw new Error("VANI Neural Quota Exceeded. Please retry in a few moments.");
          const delay = Math.pow(2, attempts) * 1000;
          console.warn(`[VANI-BRAIN] 429 detected. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (!response.ok) {
          throw new Error(`Gemini API Error ${response.status}: ${JSON.stringify(result)}`);
        }
        
        break;
      } catch (err) {
        if (attempts === maxAttempts - 1) throw err;
        attempts++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    let text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("AI returned empty response.");
    }

    text = text.trim();
    if (text.startsWith("```")) {
      const match = text.match(/^(?:```[a-zA-Z]*\s*)?([\s\S]*?)(?:\s*```)?$/);
      if (match && match[1]) {
        text = match[1].trim();
      }
    }

    const parsed = JSON.parse(text);

    // Cache the parsed response for 30 seconds
    voiceCache.set(cacheKey, {
      response: parsed,
      expiresAt: Date.now() + 30000,
    });

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[VANI-BRAIN] Handler Error:", error.message);
    const isQuota = error.message?.includes("429") || error.message?.includes("Quota");
    return new Response(JSON.stringify({ 
      intent: 'UNKNOWN',
      spoken_response: isQuota ? "VANI neural link is currently at capacity. Please try again in a minute." : "Neural alignment disrupted. Please retry.",
      isQuota,
      summary_card: {
        title: isQuota ? "Quota Alert" : "System Error",
        subtitle: isQuota ? "Rate limit reached" : "Neural link failure",
        status: isQuota ? "warning" : "error",
        items: [{ label: "Reason", value: error.message }]
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 so the UI can handle the error response gracefully
    });
  }
});
