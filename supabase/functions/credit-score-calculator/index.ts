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
    // 1. Fetch all contacts with their invoice history
    const { data: contacts, error: contactError } = await supabase
      .from("contacts")
      .select("id, name, credit_score, invoices(status, due_date, paid_at, total_amount)");

    if (contactError) throw contactError;

    for (const contact of contacts) {
      let score = 100; // Starting points as requested
      const invoices = contact.invoices || [];

      for (const inv of invoices) {
        if (inv.status === 'paid' && inv.paid_at) {
          const paidAt = new Date(inv.paid_at);
          const dueDate = new Date(inv.due_date);
          const diffDays = Math.ceil((paidAt.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

          if (diffDays < 0) score += 5; // Paid early
          else if (diffDays === 0) score += 2; // Paid on time
          else if (diffDays > 30) score -= 30; // 30+ days late
          else if (diffDays > 7) score -= 20; // 7+ days late
          else if (diffDays > 0) score -= 10; // Late
        } else if (inv.status === 'overdue') {
          const dueDate = new Date(inv.due_date);
          const diffDays = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays > 30) score -= 30;
          else if (diffDays > 7) score -= 20;
          else score -= 10;
        }
      }

      // Clamp score
      score = Math.max(0, Math.min(100, score));

      // Determine behavior
      let behavior = 'unknown';
      if (score >= 90) behavior = 'excellent';
      else if (score >= 70) behavior = 'good';
      else if (score >= 50) behavior = 'average';
      else if (score >= 30) behavior = 'poor';
      else behavior = 'blocked';

      await supabase
        .from("contacts")
        .update({ 
          credit_score: score, 
          payment_behavior: behavior,
          credit_score_last_updated: new Date().toISOString()
        })
        .eq("id", contact.id);
    }

    return new Response(JSON.stringify({ success: true, processed: contacts.length }), {
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
