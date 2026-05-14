import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { image, imageBase64, mimeType, businessId } = body;
    const imageData = image || imageBase64;

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in Supabase Secrets.");
    }

    if (!imageData) {
      throw new Error("Missing image data (image or imageBase64 is required)");
    }

    // Force sanitization of incoming image binary data
    const cleanImageData = imageData.replace(/^data:.*?;base64,/, "").replace(/\s/g, "");

    const prompt = `
      Perform a high-fidelity visual audit and text extraction from this invoice image, specifically optimized for the Indian retail ecosystem.
      1. SCRIPT SUPPORT: Accurately read and transliterate text in English, Hindi (Devanagari), Marathi, and Gujarati. 
         - IMPORTANT: Support Devanagari numerals (०, १, २, ३, ४, ५, ६, ७, ८, ९) and convert them to standard integers.
      2. ENTITY EXTRACTION: Identify Vendor Name, GSTIN (15-digit format), Bill Date, and Bill Number.
      3. LINE ITEMS: Extract every line item with HSN/SAC codes if present.
      4. TAXATION: Identify GST breakdown (CGST, SGST, IGST) per line item or total.
      5. VALIDATION: Ensure individual item totals match (Qty * Price).
      6. CONFIDENCE: Provide a per-field confidence score (0.0 to 1.0).
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    let result;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const schema = {
          type: "object",
          properties: {
            vendor_name: {
              type: "object",
              properties: { value: { type: "string" }, confidence: { type: "number" } },
              required: ["value", "confidence"]
            },
            vendor_gstin: {
              type: "object",
              properties: { value: { type: "string", nullable: true }, confidence: { type: "number" } },
              required: ["confidence"]
            },
            bill_date: {
              type: "object",
              properties: { value: { type: "string" }, confidence: { type: "number" } },
              required: ["value", "confidence"]
            },
            bill_number: {
              type: "object",
              properties: { value: { type: "string", nullable: true }, confidence: { type: "number" } },
              required: ["confidence"]
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "object", properties: { value: { type: "string" }, confidence: { type: "number" } }, required: ["value"] },
                  hsn_code: { type: "object", properties: { value: { type: "string", nullable: true }, confidence: { type: "number" } } },
                  quantity: { type: "object", properties: { value: { type: "number" }, confidence: { type: "number" } }, required: ["value"] },
                  unit_price: { type: "object", properties: { value: { type: "number" }, confidence: { type: "number" } }, required: ["value"] },
                  tax_rate: { type: "object", properties: { value: { type: "number" }, confidence: { type: "number" } } },
                  total: { type: "object", properties: { value: { type: "number" }, confidence: { type: "number" } }, required: ["value"] }
                },
                required: ["name", "quantity", "unit_price", "total"]
              }
            },
            grand_total: {
              type: "object",
              properties: { value: { type: "number" }, confidence: { type: "number" } },
              required: ["value", "confidence"]
            },
            overall_confidence: { type: "number" }
          },
          required: ["vendor_name", "bill_date", "items", "grand_total", "overall_confidence"]
        };

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mimeType || "image/jpeg", data: cleanImageData } }] }],
            generationConfig: { 
              responseMimeType: "application/json", 
              responseSchema: schema,
              temperature: 0.1 
            }
          })
        });

        result = await response.json();
        
        if (result.error) {
          console.error("[OCR] Detected Embedded Gemini Error:", result.error);
          throw new Error(`Gemini Embedded API Error: ${result.error.message || JSON.stringify(result.error)}`);
        }

        console.log("[OCR] Gemini API Raw Text:", result.candidates?.[0]?.content?.parts?.[0]?.text);
        
        if (response.status === 429) {
          attempts++;
          if (attempts === maxAttempts) throw new Error("Gemini API Quota Exceeded after 3 attempts.");
          const delay = Math.pow(2, attempts) * 1000;
          console.warn(`[OCR-Service] 429 detected. Retrying in ${delay}ms...`);
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

    let extractedData = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    // --- Task 2: Advanced Margin Erosion & Trend Detection ---
    if (businessId && extractedData.items) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      
      for (const item of extractedData.items) {
        const itemName = item.name?.value;
        if (!itemName) continue;
        const currentPrice = item.unit_price?.value || 0;

        // 1. Try to find matching product
        const { data: products } = await supabase
          .from("products")
          .select("id, cost_price, name")
          .eq("business_id", businessId)
          .ilike("name", `%${itemName}%`)
          .limit(1);

        if (products && products.length > 0) {
          const product = products[0];
          item.product_id = product.id;
          item.historical_cost = product.cost_price;
          
          // 2. Query Price History for Trend Analysis
          const { data: history } = await supabase
            .from("cost_price_history")
            .select("price, created_at")
            .eq("product_id", product.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (currentPrice > product.cost_price) {
            item.margin_erosion = true;
            item.erosion_pct = ((currentPrice - product.cost_price) / product.cost_price) * 100;
          }

          // 3. Trend Logic
          if (history && history.length > 0) {
            const lastPrice = history[0].price;
            item.last_purchase_price = lastPrice;
            item.price_diff_last = currentPrice - lastPrice;
            
            // Simple Trend: If current > last AND last > second-to-last
            const isRising = currentPrice > lastPrice && (history.length > 1 ? lastPrice >= history[1].price : true);
            item.price_trend = isRising ? 'UPWARD' : 'STABLE';
            
            if (isRising && item.erosion_pct > 5) {
              item.alert_type = 'CRITICAL_HIKE';
              item.alert_message = `Third price increase detected for ${product.name}. Potential margin collapse.`;
            }
          }
        }
      }
    }

    // --- Mathematical Cross-Validation (Gap 4) ---
    const itemsSum = (extractedData.items || []).reduce((acc: number, item: any) => acc + (item.total?.value || 0), 0);
    const grandTotal = extractedData.grand_total?.value || 0;
    const isMathematicallyConsistent = Math.abs(itemsSum - grandTotal) < (grandTotal * 0.01); // 1% tolerance for roundings
    
    const formattedData = {
      vendor: extractedData.vendor_name?.value || "Unknown Vendor",
      vendor_gstin: extractedData.vendor_gstin?.value || null,
      date: extractedData.bill_date?.value || new Date().toLocaleDateString('en-IN'),
      invoice_no: extractedData.bill_number?.value || `AI-SCAN-${Math.floor(Math.random() * 100000)}`,
      total_amount: grandTotal,
      confidence: Math.round((extractedData.overall_confidence || 0.85) * 100),
      is_validated: isMathematicallyConsistent,
      validation_error: isMathematicallyConsistent ? null : `Mathematical mismatch: Sum of items (Rs.${itemsSum}) does not match Grand Total (Rs.${grandTotal})`,
      items: (extractedData.items || []).map((item: any) => ({
        description: item.name?.value || "Extracted Item",
        hsn_code: item.hsn_code?.value || null,
        quantity: item.quantity?.value || 1,
        unit_price: item.unit_price?.value || 0,
        tax_rate: item.tax_rate?.value || null,
        total: item.total?.value || 0,
        confidence: Math.round((item.name?.confidence || 0.8) * 100),
        // Keep advanced intelligence flags
        margin_erosion: item.margin_erosion,
        erosion_pct: item.erosion_pct,
        price_trend: item.price_trend,
        last_purchase_price: item.last_purchase_price,
        alert_type: item.alert_type,
        alert_message: item.alert_message
      })),
      rawGeminiDiagnostics: JSON.stringify(result)
    };

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[OCR-Service Error]:", error);
    const isQuota = error.message?.includes("429") || error.message?.includes("Quota");
    return new Response(JSON.stringify({ error: error.message, isQuota }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isQuota ? 429 : 400,
    });
  }
});

