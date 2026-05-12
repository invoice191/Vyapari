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

    if (action === "run-simulation" || action === "run-bundle-simulation") {
      let prompt = "";
      
      if (action === "run-simulation") {
        const { product, historicalSales, festivals, parameters } = payload;
        const { newPrice, horizon } = parameters;
        prompt = `
          You are Vyapari's Neural Prediction Engine. Run a high-fidelity 'What-if' simulation for a specific product.
          Product: ${product.name}, Current Price: ₹${product.selling_price}, Proposed Price: ₹${newPrice}.
          Historical Data: ${JSON.stringify(historicalSales)}
          Upcoming Festivals: ${JSON.stringify(festivals)}
          Prediction Horizon: ${horizon}
          
          TASKS:
          1. Predict Price Elasticity: How will this price change affect demand?
          2. Forecast Revenue & Profit: Compare current vs proposed metrics.
          3. Identify Risks: (e.g., Competition, Overstock, Seasonality).
          4. Suggest Optimization: Is there a better price point?
          
          Expected JSON Format:
          {
            "predictedDemand": number (percentage change),
            "projectedRevenue": number,
            "projectedProfit": number,
            "confidenceScore": number (0-100),
            "elasticityLabel": "Elastic" | "Inelastic" | "Unitary",
            "insights": string[],
            "recommendation": string,
            "chartData": Array<{ "period": string, "baseline": number, "projected": number }>
          }
        `;
      } else {
        const { bundles, historicalData, festivals } = payload;
        prompt = `
          You are Vyapari's Strategic Bundle Advisor. Predict the impact of creating a 'Product Bundle'.
          Bundle Composition: ${JSON.stringify(bundles)}
          Historical Context: ${JSON.stringify(historicalData)}
          Upcoming Festivals: ${JSON.stringify(festivals)}
          
          TASKS:
          1. Predict 'Halo Effect' and Volume Lift.
          2. Output predicted Revenue and Profit for the bundle.
          
          Expected JSON Format:
          {
            "bundleScore": number (0-100),
            "haloEffectLift": number (percentage),
            "projectedRevenue": number,
            "projectedProfit": number,
            "marginErosionPct": number,
            "recommendation": string,
            "chartData": Array<{ "week": string, "revenue": number, "profit": number }>
          }
        `;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      let result;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          console.log(`[Simulation-Lab] Invoking Gemini (Attempt ${attempts + 1})`);
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
            })
          });

          result = await response.json();
          
          if (response.status === 429) {
            attempts++;
            if (attempts === maxAttempts) throw new Error("Gemini API Quota Exceeded after 3 attempts.");
            const delay = Math.pow(2, attempts) * 1000;
            console.warn(`[Simulation-Lab] 429 detected. Retrying in ${delay}ms...`);
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

      const finalData = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

      return new Response(JSON.stringify(finalData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("[Simulation-Lab Error]:", error);
    const isQuota = error.message?.includes("429") || error.message?.includes("Quota");
    return new Response(JSON.stringify({ 
      error: error.message,
      isQuota,
      details: error.stack 
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: isQuota ? 429 : 400 
    });
  }
});
