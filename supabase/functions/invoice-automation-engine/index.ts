import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch active automation rules
    const { data: rules, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesError) throw rulesError;

    // 2. Fetch relevant invoices (unpaid, not cancelled)
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("*, contacts(*)")
      .not("status", "in", "('paid', 'cancelled', 'written_off')");

    if (invError) throw invError;

    const results = [];

    for (const rule of rules) {
      for (const invoice of invoices) {
        let shouldTrigger = false;
        const now = new Date();
        const dueDate = new Date(invoice.due_date);
        const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        // Trigger logic
        if (rule.trigger_event === 'invoice.due_in_days') {
          const daysBefore = rule.trigger_conditions.days_before;
          const targetDate = new Date(invoice.due_date);
          targetDate.setDate(targetDate.getDate() - daysBefore);
          if (targetDate.toDateString() === now.toDateString()) {
            shouldTrigger = true;
          }
        } else if (rule.trigger_event === 'invoice.overdue_days') {
          const daysAfter = rule.trigger_conditions.days_after;
          if (diffDays === daysAfter) {
            shouldTrigger = true;
          }
        } else if (rule.trigger_event === 'invoice.paid' && invoice.status === 'paid') {
           // This would normally be triggered via database webhook, but for completeness:
           // We check if it was recently paid (maybe checking paid_at)
           const paidAt = new Date(invoice.paid_at);
           if (paidAt.toDateString() === now.toDateString()) {
             shouldTrigger = true;
           }
        }

        if (shouldTrigger) {
          // Fire Actions
          for (const action of rule.actions) {
            if (action.type === 'send_whatsapp') {
              const message = action.template
                .replace('{customer_name}', invoice.contacts.name)
                .replace('{invoice_number}', invoice.invoice_number)
                .replace('{amount}', invoice.total_amount)
                .replace('{due_date}', invoice.due_date)
                .replace('{payment_link}', `https://vyapari.app/pay/${invoice.id}`);

              await supabase.from("whatsapp_queue").insert({
                business_id: invoice.business_id,
                contact_id: invoice.contact_id,
                phone: invoice.contacts.phone,
                message: message,
                reference_id: invoice.id,
                reference_type: 'invoice',
                automation_rule_id: rule.id
              });
            } else if (action.type === 'telegram_alert') {
              // Add to telegram_alerts table or similar
              // For now, we log it
              console.log(`Telegram Alert for ${invoice.invoice_number}: ${action.template}`);
            }
          }

          // Log to automation_logs
          await supabase.from("automation_logs").insert({
            business_id: invoice.business_id,
            invoice_id: invoice.id,
            rule_name: rule.rule_name,
            status: 'success',
            details: `Triggered for invoice ${invoice.invoice_number}`
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
