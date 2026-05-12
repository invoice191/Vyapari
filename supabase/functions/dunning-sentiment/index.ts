import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { message, customerId } = await req.json();

    const prompt = `
      You are the 'Vyapari Sentiment Agent'. 
      Analyze the emotional temperature of this customer response to a payment reminder.
      Response: "${message}"
      
      Task:
      1. Detect sentiment (Aggressive, Frustrated, Hardship, Cooperative, Neutral).
      2. Suggest the next best action for the Dunning Daemon.
      3. If 'Hardship' is detected, suggest a flexible payment plan.
      
      Return ONLY a JSON object:
      {
        "sentiment": string,
        "temperature": number, // 0 to 1 (1 is hot/aggressive)
        "suggested_action": "CONTINUE_DUNNING" | "PAUSE_DUNNING" | "OFFER_PAYMENT_PLAN" | "OWNER_INTERVENTION",
        "reasoning": string,
        "reply_template": string
      }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
    });

    const result = await response.json();
    const analysis = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    return new Response(JSON.stringify(analysis), {
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

