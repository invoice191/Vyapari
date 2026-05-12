
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { sendMessage } from "../_shared/telegram.ts";
import { supabase, getTodaySummary } from "../_shared/db.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    let businesses = [];

    if (body.test && body.business_id) {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', body.business_id)
        .single();
      if (data) businesses = [data];
    } else {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('telegram_notifications_enabled', true)
        .not('telegram_chat_id', 'is', null);
      businesses = data || [];
    }

    console.log(`Sending digest to ${businesses.length} businesses`);

    for (const biz of businesses) {
      try {
        if (!biz.telegram_chat_id) continue;
        const summary = await getTodaySummary(biz.id);
        const msg = `📊 <b>Daily Digest</b>\n📅 ${summary.date}\n─────────────────────\n💰 Sales: ₹${summary.totalSales.toLocaleString()}\n🧾 Invoices: ${summary.invoiceCount}\n👥 New Customers: ${summary.newCustomers}\n🏆 Top Product: ${summary.topProduct}\n⏳ Outstanding Dues: ₹${summary.totalDues.toLocaleString()}\n─────────────────────\n🤖 Vyapari`;
        
        await sendMessage(biz.telegram_chat_id, msg);
      } catch (err) {
        console.error(`Failed to send digest to ${biz.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ ok: true, sent_to: businesses.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Digest error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
