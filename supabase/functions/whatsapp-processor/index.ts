import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Multi-tier Credential Fallback Strategy
let TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
let TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
let TWILIO_FROM_PHONE = Deno.env.get("TWILIO_FROM_PHONE");
let TWILIO_MESSAGING_SERVICE_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
let GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

async function sendTwilioMessage(to: string, message: string, channel: 'sms' | 'whatsapp' = 'whatsapp') {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error("Twilio credentials missing");
    return { success: false, error: "Twilio credentials missing" };
  }

  const formattedTo = channel === 'whatsapp' ? `whatsapp:${to.startsWith('+') ? to : '+' + to}` : (to.startsWith('+') ? to : '+' + to);
  const formattedFrom = channel === 'whatsapp' ? `whatsapp:${TWILIO_FROM_PHONE}` : TWILIO_FROM_PHONE;

  const body = new URLSearchParams();
  body.append("To", formattedTo);
  body.append("From", formattedFrom);
  body.append("Body", message);
  if (TWILIO_MESSAGING_SERVICE_SID) {
    body.append("MessagingServiceSid", TWILIO_MESSAGING_SERVICE_SID);
  }

  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`,
      },
      body: body.toString(),
    }
  );

  const result = await response.json();
  if (response.ok) {
    return { success: true, sid: result.sid };
  } else {
    console.error("Twilio Error:", result);
    return { success: false, error: result.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();

    // Body-based credential injection (for testing/failover)
    TWILIO_ACCOUNT_SID = payload.twilio_sid || TWILIO_ACCOUNT_SID;
    TWILIO_AUTH_TOKEN = payload.twilio_token || TWILIO_AUTH_TOKEN;
    TWILIO_FROM_PHONE = payload.twilio_from || TWILIO_FROM_PHONE;
    TWILIO_MESSAGING_SERVICE_SID = payload.twilio_service_sid || TWILIO_MESSAGING_SERVICE_SID;
    GEMINI_API_KEY = payload.apiKey || GEMINI_API_KEY;

    // Handle Direct Send Request
    if (payload.direct) {
      const { phone, message, channel, referenceId, referenceType, businessId, contactId } = payload;
      const res = await sendTwilioMessage(phone, message, channel || 'sms');
      
      // Log it
      await supabase.from("notification_logs").insert({
        phone,
        channel: channel || 'sms',
        message,
        status: res.success ? 'sent' : 'failed',
        provider: 'twilio',
        provider_response: res,
        invoice_id: referenceType === 'invoice' ? referenceId : null,
        business_id: businessId,
        contact_id: contactId
      });

      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: res.success ? 200 : 400,
      });
    }

    // Process Queue (Background mode)
    const { data: queueItems, error: queueError } = await supabase
      .from("whatsapp_queue")
      .select("*, contact:contact_id(*)")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(10);

    if (queueError) throw queueError;

    const results = [];

    for (const item of (queueItems || [])) {
      let finalMessage = item.message;

      // Handle AI message generation for re-engagement
      if (item.message && item.message.startsWith("PENDING_AI_GENERATION|")) {
        const parts = item.message.split("|");
        const name = parts[1] || "Valued Customer";
        const daysInactive = parts[2] || "30";
        
        const prompt = `
          Generate a warm, respectful Hinglish re-engagement message for an Indian retail shop.
          Customer Name: ${name}. Days inactive: ${daysInactive}.
          Offer a 5% discount. Max 2 sentences.
        `;

        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
          const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const geminiResult = await geminiResponse.json();
          finalMessage = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || finalMessage;
        } catch (e) {
          console.error("AI Gen Failed", e);
        }
      }

      // Real Send
      const sendRes = await sendTwilioMessage(item.phone, finalMessage, item.channel || 'whatsapp');

      // Update queue item
      await supabase
        .from("whatsapp_queue")
        .update({
          status: sendRes.success ? "sent" : "failed",
          sent_at: sendRes.success ? new Date().toISOString() : null,
          message: finalMessage,
          attempt_count: (item.attempt_count || 0) + 1,
          last_error: sendRes.success ? null : sendRes.error
        })
        .eq("id", item.id);

      // Log Communication
      await supabase.from("notification_logs").insert({
        phone: item.phone,
        channel: item.channel || 'whatsapp',
        message: finalMessage,
        status: sendRes.success ? 'sent' : 'failed',
        provider: 'twilio',
        invoice_id: item.reference_type === 'invoice' ? item.reference_id : null,
        contact_id: item.contact_id
      });

      results.push({ id: item.id, success: sendRes.success });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
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


