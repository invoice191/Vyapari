import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { SIMULATION_PROMPT } from "./simulation-prompt.ts";

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
    const input = await req.json();
    const { action, run_config, business } = input;

    // Use the master prompt as the system context
    let systemContext = SYSTEM_PROMPT;
    let userPrompt = "";

    if (action === "run" || action === "run-dss") {
      const engines = run_config?.engines || ["pricing", "rfm", "cashflow", "forecast", "deadstock"];
      userPrompt = `
        Run the following intelligence engines: ${engines.join(", ")}.
        Business Context: ${business.name} (ID: ${business.id}), Location: ${business.city}, Plan: ${business.plan}.
        Market Condition: ${run_config?.market_condition || 'normal'}.
        
        Full Data Payload: ${JSON.stringify(input)}
        
        Analyze the data strictly according to the calculations and logic defined in the system prompt for each requested engine.
        Return the result as a single JSON object where each key corresponds to the engine name.
      `;
    } else if (action === "run-simulation" || action === "simulation") {
      systemContext = SIMULATION_PROMPT;
      userPrompt = `
        Run detailed product simulation analysis.
        Input Data: ${JSON.stringify(input)}
        
        Strictly follow the calculation rules and output the exact JSON structure defined in the simulation system prompt.
      `;
    } else if (action === "business-briefing") {
      // Legacy support or simplified briefing
      userPrompt = `Generate a high-level executive briefing for ${business.name} based on the provided data: ${JSON.stringify(input.payload || input)}`;
    } else {
      // Default to full run if no action specified but schema matches
      const engines = ["pricing", "rfm", "cashflow", "forecast", "deadstock"];
      userPrompt = `Run standard DSS analysis for: ${engines.join(", ")}. Data: ${JSON.stringify(input)}`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    let result;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemContext }] },
              { role: "user", parts: [{ text: userPrompt }] }
            ],
            generationConfig: { 
              temperature: 0.2,
              response_mime_type: "application/json"
            } 
          })
        });

        result = await response.json();
        
        if (response.status === 429) {
          attempts++;
          if (attempts === maxAttempts) throw new Error("Gemini AI Engine Quota Exceeded. Please try again in a few minutes.");
          const delay = Math.pow(2, attempts) * 1000;
          console.warn(`[DSS-AI] 429 detected. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (!response.ok) {
          throw new Error(`Gemini AI Error ${response.status}: ${JSON.stringify(result)}`);
        }
        
        break;
      } catch (err) {
        if (attempts === maxAttempts - 1) throw err;
        attempts++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("AI Engine failed to generate a response. Check API key or data volume.");
    }

    const finalData = JSON.parse(text);

    // Ensure IDs are populated correctly
    if (action !== 'simulation' && action !== 'run-simulation') {
      finalData.dss_run_id = finalData.dss_run_id || crypto.randomUUID();
      finalData.business_id = business?.id || finalData.business_id;
      finalData.generated_at = new Date().toISOString();
    } else {
      finalData.simulation_id = finalData.simulation_id || crypto.randomUUID();
      finalData.generated_at = new Date().toISOString();
    }

    return new Response(JSON.stringify(finalData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[DSS-AI Error]:", error);
    const isQuota = error.message?.includes("429") || error.message?.includes("Quota");
    return new Response(JSON.stringify({ 
      error: error.message,
      isQuota,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isQuota ? 429 : 400,
    });
  }
});


