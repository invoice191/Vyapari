
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { sendMessage } from "../_shared/telegram.ts";
import { supabase } from "../_shared/db.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { business_id, alert_type, data } = await req.json();

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('telegram_chat_id, telegram_notifications_enabled, telegram_low_stock_alerts, telegram_invoice_alerts, telegram_large_order_alerts')
      .eq('id', business_id)
      .single();

    if (bizError || !business?.telegram_chat_id || !business?.telegram_notifications_enabled) {
      return new Response(JSON.stringify({ ok: false, reason: 'Business not configured for telegram' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let message = '';
    const chatId = business.telegram_chat_id;

    switch (alert_type) {
      case 'LOW_STOCK':
        if (!business.telegram_low_stock_alerts) return new Response(JSON.stringify({ ok: true, skipped: true }));
        message = `⚠️ <b>Low Stock Alert</b>\n📦 ${data.product_name}\nOnly ${data.stock_quantity} units remaining!\nType /stock for full report.\n🤖 Vyapari`;
        break;

      case 'OVERDUE_INVOICE':
        if (!business.telegram_invoice_alerts) return new Response(JSON.stringify({ ok: true, skipped: true }));
        message = `🔴 <b>Overdue Invoice</b>\n👤 ${data.customer_name}\n💰 ₹${data.invoice_amount.toLocaleString()}\n⏰ ${data.days_overdue} days overdue\nType /invoices for details.\n🤖 Vyapari`;
        break;

      case 'NEW_LARGE_ORDER':
        if (!business.telegram_large_order_alerts) return new Response(JSON.stringify({ ok: true, skipped: true }));
        message = `🎉 <b>Large Order Received!</b>\n🧾 ${data.invoice_number}\n👤 ${data.customer_name}\n💰 ₹${data.invoice_amount.toLocaleString()}\nType /invoices for details.\n🤖 Vyapari`;
        break;

      default:
        return new Response(JSON.stringify({ ok: false, reason: 'Invalid alert type' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    await sendMessage(chatId, message);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Alert error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
