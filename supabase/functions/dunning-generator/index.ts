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
    const { invoiceData, customerHistory, daysOverdue, followUpCount, language } = await req.json();

    const prompt = `
      Generate a payment follow-up message for an Indian retailer.
      Write in ${language || 'Hinglish'} (Hindi/English/Hinglish).
      Tone: Polite but firm. Professional. Like a respected shopkeeper.
      Length: 3-4 sentences maximum.
      Include: customer name, invoice number, amount, days overdue.
      Do NOT be threatening. Do NOT use legal language.
      End with a specific call to action.
      Output plain text only. No markdown.

      Invoice data: ${JSON.stringify(invoiceData)}
      Customer history: ${JSON.stringify(customerHistory)}
      Days overdue: ${daysOverdue}
      Previous follow-ups sent: ${followUpCount}
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const result = await response.json();
    const message = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Gentle reminder regarding your payment.";
    
    return new Response(JSON.stringify({ message }), {
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

