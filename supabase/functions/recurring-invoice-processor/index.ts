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
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch recurring invoices due today
    const { data: templates, error: templateError } = await supabase
      .from("recurring_invoices")
      .select("*, contacts(*)")
      .eq("status", "active")
      .lte("next_invoice_date", today);

    if (templateError) throw templateError;

    const results = [];

    for (const template of templates) {
      // 2. Create the invoice
      const totalAmount = template.template_items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
      
      const { data: newInvoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          business_id: template.business_id,
          contact_id: template.contact_id,
          total_amount: totalAmount,
          status: 'draft',
          is_recurring: true,
          created_via: 'automation',
          due_date: new Date(Date.now() + (template.credit_days || 15) * 86400000).toISOString().split('T')[0]
        })
        .select()
        .single();

      if (invError) {
        console.error(`Error creating recurring invoice for ${template.id}:`, invError);
        continue;
      }

      // 3. Create items
      const items = template.template_items.map((item: any) => ({
        ...item,
        invoice_id: newInvoice.id,
        business_id: template.business_id
      }));

      await supabase.from("invoice_items").insert(items);

      // 4. Update template
      let nextDate = new Date(template.next_invoice_date);
      if (template.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (template.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (template.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);

      await supabase
        .from("recurring_invoices")
        .update({
          next_invoice_date: nextDate.toISOString().split('T')[0],
          last_invoice_date: today,
          total_created: (template.total_created || 0) + 1
        })
        .eq("id", template.id);

      results.push({ id: newInvoice.id, customer: template.contacts.name });
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
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
