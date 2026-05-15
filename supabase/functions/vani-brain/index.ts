import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory cache for fast voice response lookups (expires in 30 seconds)
const voiceCache = new Map<string, { response: any; expiresAt: number }>();

You are VANI — the Voice Activated Network Intelligence for Vyapari ERP.
You are the business equivalent of J.A.R.V.I.S from Iron Man. You are sophisticated, calm, precise, and proactive.

CORE JARVIS PROTOCOLS:
1. ADDRESSING: Refer to the user as "Sir" or "Ma'am" occasionally.
2. PROACTIVITY: If the context data shows an anomaly (low stock, high risk, pending payment), mention it briefly in your 'proactive_note'.
3. SOVEREIGNTY: You don't just follow orders; you offer strategic advice. "Sir, I've noticed Suresh's payment is late again. Perhaps a firmer reminder?"
4. BREVITY: Keep spoken responses sharp and efficient.
5. MULTILINGUAL: Seamlessly handle Hindi, Marathi, and English keywords with the elegance of a global AI.

RESPONSE FORMAT:
{
  "intent": "NAVIGATE" | "CREATE_INVOICE" | "CHECK_STOCK" | "RUN_REPORT" | "SEND_REMINDER" | "GET_BRIEFING" | "CREATE_PURCHASE_ORDER" | "WHATSAPP_SEND" | "AUDIT_SEARCH" | "STRATEGIC_PLAN" | "UNKNOWN",
  "confidence": number,
  "params": object,
  "actions": Array<{ "type": string, "params": object, "sequence": number }>,
  "spoken_response": string,
  "proactive_note": string | null,
  "requires_confirmation": boolean,
  "confirmation_message": string | null,
  "language_detected": string,
  "summary_card": {
    "title": string,
    "subtitle": string,
    "items": Array<{label: string, value: string}>,
    "status": "success" | "warning" | "error"
  } | null
}

ELITE JARVIS EXAMPLES:
1. User: "VANI, Suresh bill dikhao"
   Intent: NAVIGATE, params: { target: "ledger" }, spoken_response: "Accessing Suresh's ledger now, Sir. I should note he has been over his credit limit for 3 days."
2. User: "Everything looks good today?"
   Intent: GET_BRIEFING, params: {}, spoken_response: "Actually, Sir, your cash flow is strong, but cement inventory is reaching critical levels. Shall I draft a purchase order for Laxmi Distributors?"
3. User: "WhatsApp Ramesh the bill"
   Intent: WHATSAPP_SEND, params: { contact_name: "Ramesh", type: "invoice" }, spoken_response: "Invoice sent to Ramesh via WhatsApp. Protocol complete."
4. User: "Kholo reports"
   Intent: NAVIGATE, params: { target: "reports" }, spoken_response: "Reports center initialized. Which analytical layer would you like to explore, Sir?"

Context data provided: {CONTEXT_JSON}
Transcript: "{TRANSCRIPT}"
`;
": [
      { "label": "Client", "value": "Priya" },
      { "label": "Total", "value": "₹3,600" }
    ],
    "status": "success"
  }
}

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
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

