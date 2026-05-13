import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    let prompt = "";
    if (action === "natural-language-billing") {
      prompt = `
        Convert the following natural language billing command into a structured JSON object.
        The user might use Hindi, English, or Hinglish.
        
        Command: "${payload.command}"
        
        Available Products (Context): ${JSON.stringify(payload.products)}
        
        Expected JSON:
        {
          "contact_name": "string | null",
          "items": [
            { "name": "string", "quantity": number, "unit": "string" }
          ]
        }
      `;
    } else if (action === "risk-scoring") {
      prompt = `
        Analyze the following invoice and customer history to provide a payment risk score.
        
        Invoice Data: ${JSON.stringify(payload.invoice)}
        Customer History: ${JSON.stringify(payload.history)}
        
        Expected JSON:
        {
          "score": number (0-100, where 100 is highest risk),
          "reason": "string",
          "recommendation": "string"
        }
      `;
    } else if (action === "fraud-detection") {
      prompt = `
        Analyze this invoice for potential fraud or unusual patterns.
        Check for:
        1. Duplicate amounts/customers in short time.
        2. Unusual product combinations.
        3. Round number amounts (e.g. ₹10,000).
        4. Unusually large amount vs history.
        
        Invoice: ${JSON.stringify(payload.invoice)}
        Recent Context: ${JSON.stringify(payload.recent)}
        
        Expected JSON:
        {
          "is_suspicious": boolean,
          "fraud_score": number (0-1),
          "flags": ["string"],
          "recommendation": "string"
        }
      `;
    } else if (action === "payment-prediction") {
      prompt = `
        Predict the probability of this invoice being paid on time.
        
        Invoice: ${JSON.stringify(payload.invoice)}
        Customer Behavior: ${JSON.stringify(payload.behavior)}
        
        Expected JSON:
        {
          "probability": number (0-1),
          "expected_days": number,
          "insight": "string"
        }
      `;
    } else if (action === "anomaly-detection") {
      prompt = `
        Flag price or quantity anomalies in this invoice.
        
        Items: ${JSON.stringify(payload.items)}
        Usual Prices: ${JSON.stringify(payload.usual_prices)}
        
        Expected JSON:
        {
          "anomalies": [
            { "item": "string", "type": "price|quantity", "message": "string" }
          ]
        }
      `;
    } else {
      throw new Error("Invalid action");
    }

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
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

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

