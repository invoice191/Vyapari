import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body parameters
    let businessId = "";
    let reportType = "daily"; // daily, weekly, monthly

    try {
      const body = await req.json();
      businessId = body.businessId;
      reportType = body.reportType || "daily";
    } catch {
      // Allow GET requests or cron invocation with query params
      const url = new URL(req.url);
      businessId = url.searchParams.get("businessId") || "";
      reportType = url.searchParams.get("reportType") || "daily";
    }

    if (!businessId) {
      // If no businessId provided, process for all businesses
      const { data: businesses } = await supabase.from("businesses").select("id");
      if (!businesses || businesses.length === 0) {
        return new Response(JSON.stringify({ message: "No businesses found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const results = [];
      for (const biz of businesses) {
        try {
          const res = await processReport(supabase, biz.id, reportType, geminiApiKey);
          results.push({ businessId: biz.id, status: "success", summary: res });
        } catch (bizErr) {
          console.error(`Failed report for business ${biz.id}:`, bizErr);
          results.push({ businessId: biz.id, status: "failed", error: bizErr.message });
        }
      }
      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const summary = await processReport(supabase, businessId, reportType, geminiApiKey);
    return new Response(JSON.stringify({ status: "success", summary }), {
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

async function processReport(supabase: any, businessId: string, reportType: string, geminiApiKey: string) {
  // Determine date ranges
  const now = new Date();
  let startDate = new Date();
  if (reportType === "daily") {
    startDate.setDate(now.getDate() - 1);
  } else if (reportType === "weekly") {
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate.setDate(now.getDate() - 30);
  }
  const startDateStr = startDate.toISOString();

  // Fetch sales and collections
  const { data: invoices } = await supabase
    .from("invoices")
    .select("total_amount, status, type")
    .eq("business_id", businessId)
    .gte("created_at", startDateStr);

  const salesInvoices = invoices?.filter((i: any) => i.type === "sale") || [];
  const totalSales = salesInvoices.reduce((sum: number, i: any) => sum + (Number(i.total_amount) || 0), 0);
  const totalCollected = salesInvoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + (Number(i.total_amount) || 0), 0);

  // Fetch low stock count
  const { data: products } = await supabase
    .from("products")
    .select("id, name, quantity, reorder_level")
    .eq("business_id", businessId);

  const lowStockProducts = products?.filter((p: any) => (p.quantity || 0) <= (p.reorder_level || 0)) || [];
  const lowStockCount = lowStockProducts.length;

  // Build the AI Prompt
  const prompt = `
    You are a premier business advisory AI assisting an Indian retail merchant.
    Generate a concise, elite 3-4 bullet-point executive advisory digest based on these business metrics:
    - Period: Past ${reportType === "daily" ? "24 hours" : reportType === "weekly" ? "7 days" : "30 days"}
    - Total Sales Revenue: ₹${totalSales.toLocaleString("en-IN")}
    - Payments Received: ₹${totalCollected.toLocaleString("en-IN")}
    - Outstanding unpaid from this period: ₹${(totalSales - totalCollected).toLocaleString("en-IN")}
    - Products below/at safe Reorder Level: ${lowStockCount} items
    
    Structure your advisory precisely with these bullets, using emojis and friendly, professional Hinglish. Do NOT include markdown styling or asterisks:
    1. Trend: A sharp comment on sales/collection speed.
    2. Stock Danger: Urgent warning about low items.
    3. Opportunity: A practical commercial suggestion (e.g. upselling, clearing dead stock, or dunning).
    4. Action item: The single most important task for today.
  `;

  let aiAdvice = "";
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6 }
      })
    });
    const result = await response.json();
    aiAdvice = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch (err) {
    console.error("Gemini failed in scheduled-reports:", err);
  }

  if (!aiAdvice) {
    aiAdvice = `Namaste ji! Sales are ₹${totalSales.toLocaleString("en-IN")} with ₹${totalCollected.toLocaleString("en-IN")} collected. Please review low stock (${lowStockCount} items) in the dashboard today.`;
  }

  // Log report automation
  const { data: logData, error: logError } = await supabase
    .from("automation_log")
    .insert({
      business_id: businessId,
      rule_name: `${reportType}_business_digest`,
      trigger_event: `schedule_${reportType}`,
      actions_taken: {
        total_sales: totalSales,
        total_collected: totalCollected,
        low_stock_count: lowStockCount
      },
      ai_decision: { advisory: aiAdvice },
      status: "success"
    })
    .select()
    .single();

  if (logError) console.error("Failed to log report automation:", logError);

  // Queue WhatsApp for owner
  const { data: owner } = await supabase
    .from("profiles")
    .select("phone")
    .eq("business_id", businessId)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (owner?.phone) {
    await supabase.from("whatsapp_queue").insert({
      business_id: businessId,
      phone: owner.phone,
      message: `Namaste Ji! Here is your ${reportType.toUpperCase()} retail digest:\n\n${aiAdvice}\n\n— Vyapari Executive Intelligence`,
      message_type: "scheduled_report",
      reference_id: logData?.id || null,
      reference_type: "automation_log"
    });
  }

  return aiAdvice;
}

