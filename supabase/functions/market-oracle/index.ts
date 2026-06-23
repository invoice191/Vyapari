import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const gemini = new GoogleGenerativeAI(GEMINI_API_KEY!).getGenerativeModel({
  model: "gemini-2.5-flash",
  // Enabling Google Search Grounding to get live internet data
  tools: [{ googleSearch: {} }],
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { productName } = await req.json();

    if (!productName) {
      throw new Error("Product name is required.");
    }

    const prompt = `Find the current real-time market price for "${productName}" in India. 
Respond ONLY with a JSON object containing the exact numbers and trend, in this exact format:
{
  "averagePrice": <number>,
  "lowestPrice": <number>,
  "highestPrice": <number>,
  "currency": "INR",
  "marketTrend": "stable" | "increasing" | "decreasing",
  "recentEvents": "A brief 1-sentence summary of why prices are acting this way based on recent news."
}`;

    const result = await gemini.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    let text = result.response.text();
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[MARKET-ORACLE] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
