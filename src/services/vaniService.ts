import { supabase } from "../lib/supabase";

export const vaniService = {
  processCommand: async (transcript: string, context: any) => {
    try {
      // 1. Log the attempt to audit_logs for compliance (as per Architecture Sec 5)
      await supabase.from('audit_logs').insert({
        action: 'VANI_VOICE_COMMAND',
        module: context.activeModule || 'System',
        metadata: { transcript },
        severity: 'Info'
      });

      // 2. Build full context data for the brain
      let ownerName = "Vyapari Owner";
      let businessSettings = {};

      if (context.profile?.business_id) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('name, settings')
          .eq('id', context.profile.business_id)
          .single();
        if (biz) {
          ownerName = context.profile.full_name || "Owner";
          businessSettings = biz.settings || {};
        }
      }

      const [invoices, stocks, contacts, salesSummary, reminders] = await Promise.all([
        context.profile?.business_id
          ? supabase.from('invoices')
              .select('id, invoice_number, total_amount, status, created_at')
              .eq('business_id', context.profile.business_id)
              .gte('created_at', new Date().toISOString().split('T')[0])
          : Promise.resolve({ data: [] }),
        context.profile?.business_id
          ? supabase.from('products')
              .select('name, quantity, selling_price')
              .eq('business_id', context.profile.business_id)
              .lt('quantity', 10)
          : Promise.resolve({ data: [] }),
        context.profile?.business_id
          ? supabase.from('contacts')
              .select('name, phone')
              .eq('business_id', context.profile.business_id)
              .limit(50)
          : Promise.resolve({ data: [] }),
        context.profile?.business_id
          ? supabase.rpc('get_dashboard_summary', { p_business_id: context.profile.business_id })
          : Promise.resolve({ data: null }),
        context.profile?.business_id
          ? supabase.from('reminders')
              .select('message, remind_at')
              .eq('business_id', context.profile.business_id)
              .eq('status', 'pending')
          : Promise.resolve({ data: [] })
      ]);
      
      const dashboardStats = salesSummary.data?.[0] || {};

      const contextData = {
        owner_name: ownerName,
        settings: businessSettings,
        today_total_sales: dashboardStats.today_revenue || 0,
        today_invoice_count: dashboardStats.today_invoice_count || 0,
        critical_stock: stocks.data || [],
        contacts: contacts.data || [],
        reminders: reminders.data || [],
        overdue_count: dashboardStats.overdue_count || 0,
        current_time: new Date().toLocaleTimeString('en-IN'),
        current_date: new Date().toLocaleDateString('en-IN')
      };

      // 3. Invoke the Edge Function brain
      const { data, error } = await supabase.functions.invoke('vani-brain', {
        body: { 
          transcript,
          businessId: context.profile?.business_id,
          contextData
        }
      });

      if (error) throw error;
      return data; // Returns { intent, params, spoken_response, proactive_note, requires_confirmation, confirmation_message }
    } catch (err) {
      console.error("VANI Brain Error:", err);
      return {
        intent: 'error',
        spoken_response: "I'm having trouble connecting to my neural core. Please try again."
      };
    }
  },

  speak: (text: string, rate = 0.92) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Preference for Google voices as per Sec 5
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }
};
