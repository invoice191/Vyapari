import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, targetProduct } = await req.json();

    const prompt = `
      You are the 'Vyapari Visual Math' Agent. 
      Analyze the provided warehouse/shelf image.
      Identify and COUNT the number of '${targetProduct}' units visible.
      Perform 'Visual Math' to confirm stock levels.
      
      Return ONLY a JSON object:
      {
        "product": "${targetProduct}",
        "detected_count": number,
        "confidence": number,
        "anomalies": string[],
        "status": "match" | "shortage" | "excess"
      }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } }
            ]
          }
        ],
        generationConfig: { responseMimeType: "application/json" }
      })
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

