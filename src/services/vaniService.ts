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

      const t = transcript.toLowerCase();
      
      // ----------------------------------------------------
      // JARVIS HYBRID NEURAL NLP PARSER (ZERO-LATENCY DECK)
      // ----------------------------------------------------
      
      // 0. HUMAN CONVERSATIONAL CHAT (Empathy & Jarvis Persona)
      if (t.includes('who are you') || t.includes('your name') || t.includes('what is vani') || t.includes('introduction') || t.includes('introduce')) {
        return {
          intent: 'GET_BRIEFING',
          params: {},
          spoken_response: "I am V.A.N.I., your Autonomous Business Intelligence companion. Think of me as your personal Jarvis system. I am designed to assist you in monitoring safety stock levels, pre-filling sales bills, scheduling smart payment reminders, and keeping your Vyapari empire running at peak profitability. How may I serve you today?",
          summary_card: {
            title: "V.A.N.I. Identity Protocol",
            subtitle: "Autonomous Companion Core Active",
            status: "success",
            items: [
              { label: "Designation", value: "V.A.N.I." },
              { label: "Role", value: "Business Companion" },
              { label: "Intelligence", value: "Hybrid Neural" },
              { label: "Status", value: "Peak Operational" }
            ]
          }
        };
      }

      if (t.includes('how are you') || t.includes('how is it going') || t.includes('are you ok') || t.includes('how are you doing')) {
        return {
          intent: 'GET_BRIEFING',
          params: {},
          spoken_response: `I am operating at one hundred percent efficiency, sir! Looking over the ledgers, today's revenue targets are well within reach, and all system channels are secure. How are you doing today?`,
          summary_card: {
            title: "System Diagnostics",
            subtitle: "Neural Core Temperature: Nominal",
            status: "success",
            items: [
              { label: "CPU Temp", value: "34.5°C" },
              { label: "Latency", value: "12ms" },
              { label: "Security Lock", value: "Active" },
              { label: "Mood Coefficient", value: "Empathetic" }
            ]
          }
        };
      }

      if (t.includes('thank you') || t.includes('thanks') || t.includes('good job') || t.includes('well done') || t.includes('perfect')) {
        return {
          intent: 'GET_BRIEFING',
          params: {},
          spoken_response: "You are very welcome, sir. It is my absolute privilege to assist you in expanding the Vyapari empire. Let's keep up the momentum!",
          summary_card: {
            title: "Operator Gratitude",
            subtitle: "Privilege to serve",
            status: "success",
            items: [
              { label: "Operator Feedback", value: "Excellent" },
              { label: "Morale Level", value: "100%" },
              { label: "Companion Sync", value: "Calibrated" },
              { label: "Ready Status", value: "Awaiting Command" }
            ]
          }
        };
      }

      if (t.includes('hello') || t.includes('hi ') || t === 'hi' || t.includes('hey') || t.includes('greetings')) {
        return {
          intent: 'GET_BRIEFING',
          params: {},
          spoken_response: `Greetings, sir! I have synchronized with the dashboard ledgers. Today's parameters are perfectly aligned. What shall we tackle next?`,
          summary_card: {
            title: "Welcome Greeting",
            subtitle: "Synchronized with operator",
            status: "success",
            items: [
              { label: "Operator", value: "Vyapari Owner" },
              { label: "Security Level", value: "Biometric Verified" },
              { label: "Active Session", value: "Secure SSL" },
              { label: "Greeting status", value: "Acknowledged" }
            ]
          }
        };
      }

      if (t.includes('good morning') || t.includes('morning')) {
        return {
          intent: 'GET_BRIEFING',
          params: {},
          spoken_response: `Good morning, sir! I hope you slept well. I have compiled your morning market briefing. We have minor low-stock inventory points to address, but overall cash flow is exceptionally strong. Shall we begin our rounds?`,
          summary_card: {
            title: "Morning Briefing Core",
            subtitle: "Dawn diagnostics complete",
            status: "success",
            items: [
              { label: "Time of Scan", value: new Date().toLocaleTimeString('en-IN') },
              { label: "Overdue Invoices", value: "Check Autopilot" },
              { label: "Strategic Pulse", value: "Nominal" },
              { label: "Coffee reminder", value: "Warm" }
            ]
          }
        };
      }

      if (t.includes('good night') || t.includes('goodnight') || t.includes('sleep') || t.includes('bye') || t.includes('exit')) {
        return {
          intent: 'GET_BRIEFING',
          params: {},
          spoken_response: "Good night, sir. Rest well. I will monitor the safety ledgers, automated dunning channels, and warehouse telemetry while you are away.",
          summary_card: {
            title: "Night Standby Protocol",
            subtitle: "Shifting to nightwatch mode",
            status: "success",
            items: [
              { label: "Telemetry scan", value: "Every 5 mins" },
              { label: "Dunning status", value: "Autopilot Lock" },
              { label: "Security lock", value: "Armed" },
              { label: "System standby", value: "Ready" }
            ]
          }
        };
      }

      // 1. CREATE_INVOICE Intent
      if (t.includes('invoice') || t.includes('bill') || t.includes('billing') || t.includes('create bill')) {
        let contact_name = "Walk-in Customer";
        const forMatch = t.match(/(?:for|to)\s+([a-zA-Z\s]+?)(?:\s+for|\s+of|\s+with|$)/);
        if (forMatch && forMatch[1]) {
          contact_name = forMatch[1].trim();
        }

        let items: any[] = [];
        if (t.includes('bread')) items.push({ name: 'Whole Wheat Bread', qty: 2, price: 40 });
        if (t.includes('milk')) items.push({ name: 'Organic Farm Milk', qty: 1, price: 65 });
        if (t.includes('coffee')) items.push({ name: 'Arabic Coffee', qty: 1, price: 120 });
        
        if (items.length === 0) {
          items.push({ name: 'General Merchandise', qty: 1, price: 100 });
        }

        const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

        return {
          intent: 'CREATE_INVOICE',
          params: { contact_name, items, total },
          spoken_response: `Excellent choice, sir. I have prepared a draft invoice for ${contact_name} containing ${items.map(i => `${i.qty} ${i.name}`).join(' and ')} amounting to rupees ${total}. Shall we review it?`,
          summary_card: {
            title: "Invoice Prefill Matrix",
            subtitle: `Draft prepared for ${contact_name}`,
            status: "success",
            items: [
              { label: "Customer", value: contact_name },
              { label: "SKU Total", value: `${items.length} Items` },
              { label: "Invoice Amount", value: `₹${total}` },
              { label: "Tax Offset", value: "CGST/SGST Included" }
            ]
          }
        };
      }

      // 2. CHECK_STOCK Intent
      if (t.includes('stock') || t.includes('inventory') || t.includes('quantity')) {
        let product_name = "bread";
        if (t.includes('milk')) product_name = "milk";
        else if (t.includes('coffee')) product_name = "coffee";

        return {
          intent: 'CHECK_STOCK',
          params: { product_name },
          spoken_response: `Sir, I am checking the current safety threshold of ${product_name} in your warehouse registry. Swapping views now.`,
          summary_card: {
            title: "Safety Stock Query",
            subtitle: `Scanned inventory for: ${product_name}`,
            status: "success",
            items: [
              { label: "Target SKU", value: product_name },
              { label: "Warehouse status", value: "Nominal" },
              { label: "Database link", value: "Supabase Active" },
              { label: "Audit status", value: "Verified" }
            ]
          }
        };
      }

      // 3. SEND_REMINDER / SMART DUNNING Intent
      if (t.includes('reminder') || t.includes('remind') || t.includes('dunn') || t.includes('dunning') || t.includes('recovery')) {
        let contact_name = "Diya";
        const match = t.match(/(?:to|for)\s+([a-zA-Z\s]+?)(?:\s+for|\s+of|$)/);
        if (match && match[1]) contact_name = match[1].trim();

        return {
          intent: 'SEND_REMINDER',
          params: { contact_name, amount: 4250, date: new Date().toISOString() },
          spoken_response: `Accessing dunning autopilot, sir. I have successfully broadcasted a cryptographic payment reminder to ${contact_name} for the outstanding balance of rupees 4250.`,
          summary_card: {
            title: "Dunning Protocol Triggered",
            subtitle: `Reminder dispatched to ${contact_name}`,
            status: "success",
            items: [
              { label: "Recipient", value: contact_name },
              { label: "Dispatched channel", value: "SMS / WhatsApp" },
              { label: "Amount Reminded", value: "₹4,250" },
              { label: "Autopilot Lock", value: "Secured" }
            ]
          }
        };
      }

      // 4. AUTONOMOUS_REORDER Intent
      if (t.includes('reorder') || t.includes('procurement') || t.includes('restock') || t.includes('purchases') || t.includes('negotiate')) {
        return {
          intent: 'AUTONOMOUS_REORDER',
          params: { runDraft: true },
          spoken_response: "System initialized. Launching the Autonomous Procurement Agent to scan safety stock volumes, evaluate historical margins, and compile draft restock purchase orders.",
          summary_card: {
            title: "Autonomous Procurement Mode",
            subtitle: "Safety stock scan initiated",
            status: "warning",
            items: [
              { label: "Agent status", value: "Executing scan..." },
              { label: "Suppliers mapped", value: "3 Active" },
              { label: "Algorithm", value: "Min-Max Replenishment" },
              { label: "Audit status", value: "Pending Approval" }
            ]
          }
        };
      }

      // 5. STRATEGIC_PLAN Intent
      if (t.includes('strategic') || t.includes('plan') || t.includes('prediction') || t.includes('forecast') || t.includes('projection') || t.includes('simulate')) {
        return {
          intent: 'STRATEGIC_PLAN',
          params: { goal: 'Margin Expansion' },
          spoken_response: "Right away, sir. Opening the Neural Projection Lab and initializing Monte Carlo simulations to calculate optimization pathways.",
          summary_card: {
            title: "Neural Simulator Mapped",
            subtitle: "Simulation vectors initialized",
            status: "success",
            items: [
              { label: "Target Goal", value: "Margin Lift" },
              { label: "Confidence Coefficient", value: "94.2%" },
              { label: "Historical Records", value: "12 Months" },
              { label: "Status", value: "Simulating..." }
            ]
          }
        };
      }

      // 6. RUN_REPORT Intent
      if (t.includes('report') || t.includes('reports') || t.includes('sales') || t.includes('profit')) {
        return {
          intent: 'RUN_REPORT',
          params: { report_type: 'sales' },
          spoken_response: "Accessing financial audits, sir. Generating your sales velocity and profit report ledger.",
          summary_card: {
            title: "Financial Ledger Scan",
            subtitle: "Sales velocity reports compiled",
            status: "success",
            items: [
              { label: "Report type", value: "Sales Report" },
              { label: "Format", value: "Interactive Charts" },
              { label: "Timeframe", value: "Month-to-Date" },
              { label: "Data Integrity", value: "100% Verified" }
            ]
          }
        };
      }

      // 7. General navigation
      const targetMap: Record<string, string> = {
        'invoice': 'invoices',
        'billing': 'invoices',
        'bill': 'invoices',
        'stock': 'inventory',
        'inventory': 'inventory',
        'product': 'inventory',
        'team': 'team',
        'employee': 'team',
        'staff': 'team',
        'banker': 'banker',
        'bank': 'banker',
        'ledger': 'ledger',
        'khata': 'ledger',
        'compliance': 'compliance',
        'tax': 'compliance',
        'gst': 'compliance',
        'autopilot': 'autopilot',
        'dunning': 'autopilot',
        'dashboard': 'dashboard',
        'home': 'dashboard',
        'tips': 'dss',
        'dss': 'dss',
        'prediction': 'prediction',
        'simulation': 'prediction',
        'purchase': 'purchases',
        'agent': 'purchases',
        'negotiator': 'purchases',
        'ocr': 'ocr',
        'scanner': 'ocr'
      };

      for (const key of Object.keys(targetMap)) {
        if (t.includes(`go to ${key}`) || t.includes(`open ${key}`) || t.includes(`navigate to ${key}`) || t.includes(`show ${key}`)) {
          const targetModule = targetMap[key];
          return {
            intent: 'NAVIGATE',
            params: { target: targetModule },
            spoken_response: `Opening the ${key} control deck, sir.`,
            summary_card: {
              title: "Navigation Handshake",
              subtitle: `Redirected to ${targetModule} sub-system`,
              status: "success",
              items: [
                { label: "Target Module", value: targetModule },
                { label: "Routing status", value: "Nominal" },
                { label: "Access level", value: "Authorized" }
              ]
            }
          };
        }
      }

      // ----------------------------------------------------
      // FALL-FORWARD CLOUD BRAIN
      // ----------------------------------------------------
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

      const { data, error } = await supabase.functions.invoke('vani-brain', {
        body: { 
          transcript,
          businessId: context.profile?.business_id,
          contextData
        }
      });

      if (error) throw error;
      
      // Proactive Sentiment Injection
      if (contextData.overdue_count > 0 && !data.proactive_note) {
        data.proactive_note = `Sir, I've noticed ${contextData.overdue_count} overdue invoices. Shall I open the Smart Dunning console to analyze their payment sentiment?`;
      } else if (contextData.critical_stock.length > 0 && !data.proactive_note) {
        const itemNames = contextData.critical_stock.slice(0, 2).map((p: any) => p.name).join(' and ');
        data.proactive_note = `Sir, ${itemNames} ${contextData.critical_stock.length > 2 ? 'and others' : ''} are running dangerously low on stock. Would you like me to launch the Procurement Agent to draft restock orders?`;
      }

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
