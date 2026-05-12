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
    const { reportType, keyMetrics, tableData, period } = await req.json();

    const prompt = `
      You are Vyapari's Report Advisory Engine. Analyze the following data from a "${reportType}" report for the period "${period}".
      
      Report Data:
      - Key Metrics: ${JSON.stringify(keyMetrics)}
      - Sample Data Rows: ${JSON.stringify(tableData?.slice(0, 10))}

      Produce an 'Executive Advisory' that follows these rules:
      1. Exactly 4 bullet points.
      2. Point 1: State the single most important trend in plain language. (e.g., 'Your top 3 customers account for 68% of revenue — this is concentration risk.')
      3. Point 2: Identify one missed revenue opportunity visible in this report's data.
      4. Point 3: Flag any GST discrepancy or filing risk detected in the period.
      5. Point 4: Suggest exactly one operational change with a predicted financial impact in ₹.
      
      Keep the advisory specific to the data shown — never give generic advice. 
      Reference actual numbers, party names, and product categories from the data.
      Return the 4 points as a JSON array of strings. No markdown, no extra text.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.1,
          response_mime_type: "application/json"
        }
      })
    });

    const result = await response.json();
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
    const advisory = JSON.parse(textOutput);
    
    return new Response(JSON.stringify({ advisory }), {
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

