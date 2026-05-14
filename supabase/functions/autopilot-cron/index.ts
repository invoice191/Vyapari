import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Note: In a production environment, this function should be triggered securely
    // either by pg_cron inside the database or a secure external scheduler like Inngest/QStash
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("[AutoPilot] Starting daily background synchronization & automation jobs...");

    // 1. AUTO-DUNNING (Payment Reminders)
    console.log("[AutoPilot] Executing Payment Reminders (Auto-Dunning)");
    const { data: upcomingInvoices, error: dunningError } = await supabase
      .from('invoices')
      .select('*, customers(phone, email, name)')
      .eq('payment_status', 'unpaid')
      .not('due_date', 'is', null);

    if (dunningError) throw dunningError;

    const today = new Date();
    
    for (const invoice of upcomingInvoices || []) {
      const dueDate = new Date(invoice.due_date);
      const diffTime = Math.abs(dueDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = today > dueDate;

      // 3 Days before due - Gentle Reminder
      if (!isOverdue && diffDays === 3) {
        console.log(`[AutoPilot] Sending 3-day reminder to ${invoice.customers?.name} (WhatsApp: ${invoice.customers?.phone}) for Rs. ${invoice.total_amount}`);
        // Mocking Gateway Call: await twilio.messages.create({ ... })
      }
      
      // 5 Days overdue - Strict Follow-up & Late Fee
      if (isOverdue && diffDays >= 5) {
        console.log(`[AutoPilot] Sending STRICT overdue alert to ${invoice.customers?.name} for Invoice #${invoice.invoice_number}`);
        
        // Late Fee Execution (2% Penalty if > 10 days)
        if (diffDays >= 10 && !invoice.late_fee_applied) {
          const penalty = invoice.total_amount * 0.02;
          const newTotal = invoice.total_amount + penalty;
          
          await supabase
            .from('invoices')
            .update({ 
              total_amount: newTotal, 
              late_fee_applied: true 
            })
            .eq('id', invoice.id);
            
          console.log(`[AutoPilot] Applied 2% Late Fee (Rs. ${penalty}) to Invoice #${invoice.invoice_number}`);
        }
      }
    }

    // 2. AUTO-RESTOCK (Agentic Procurement)
    console.log("[AutoPilot] Checking Inventory for Auto-Restock");
    const { data: lowStockItems, error: stockError } = await supabase
      .from('inventory')
      .select('*, suppliers(email, name)')
      .lt('quantity', 'min_stock_level');

    if (stockError) throw stockError;

    for (const item of lowStockItems || []) {
      console.log(`[AutoPilot] Item ${item.name} is low (${item.quantity} left). Threshold: ${item.min_stock_level}.`);
      if (item.suppliers?.email) {
        console.log(`[AutoPilot] Dispatching Auto-Restock email to supplier ${item.suppliers.name} at ${item.suppliers.email}`);
        // Mocking SendGrid/Resend API call
      }
    }

    console.log("[AutoPilot] Background jobs completed successfully.");

    return new Response(JSON.stringify({
      success: true,
      message: "Auto-Pilot routines executed successfully.",
      stats: {
        reminders_sent: upcomingInvoices?.length || 0,
        restocks_requested: lowStockItems?.length || 0
      }
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("[AutoPilot] Error executing background jobs:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
