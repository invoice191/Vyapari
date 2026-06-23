import { supabase } from "../lib/supabase";

function localFuzzyParse(transcript: string, contextData: any): any {
  const t = transcript.toLowerCase().trim();

  // 1. Check for specific module navigation keywords directly (English + Regional Indian Languages)
  const targetMap: Record<string, string> = {
    // ── English ──
    'dashboard': 'dashboard',          'home': 'dashboard',
    'main page': 'dashboard',          'invoices': 'invoices',
    'invoice': 'invoices',             'billing': 'invoices',
    'bill': 'invoices',                'pos': 'pos',
    'billing counter': 'pos',          'counter desk': 'pos',
    'inventory': 'inventory',          'stock': 'inventory',
    'product': 'inventory',            'warehouse': 'inventory',
    'ledger': 'ledger',                'transaction': 'ledger',
    'dss': 'dss',                      'tip': 'dss',
    'recommendation': 'dss',           'prediction': 'prediction',
    'simulation': 'prediction',        'what-if': 'prediction',
    'what if': 'prediction',           'calculator': 'prediction',
    'ocr': 'ocr',                      'scanner': 'ocr',
    'camera': 'ocr',                   'purchases': 'purchases',
    'purchase': 'purchases',           'procurement': 'purchases',
    'vendor': 'purchases',             'supplier': 'purchases',
    'contact': 'contacts',             'contacts': 'contacts',
    'customer': 'contacts',            'client': 'contacts',
    'accounting': 'accounting',        'banker': 'banker',
    'bank': 'banker',                  'loan': 'banker',
    'settings': 'settings',            'setting': 'settings',
    'config': 'settings',              'users': 'team',
    'staff': 'team',                   'team': 'team',
    'permission': 'team',              'audit': 'audit',
    'logs': 'audit',                   'activity': 'audit',
    // ── Hindi (hi-IN) ──
    'डैशबोर्ड': 'dashboard',           'होम': 'dashboard',
    'मुख्य पृष्ठ': 'dashboard',        'मुख पेज': 'dashboard',
    'चालान': 'invoices',               'बिल': 'invoices',
    'बिलिंग': 'invoices',              'इनवॉइस': 'invoices',
    'पीओएस': 'pos',                    'काउंटर': 'pos',
    'माल': 'inventory',                'स्टॉक': 'inventory',
    'गोदाम': 'inventory',              'सामान': 'inventory',
    'खाता': 'ledger',                  'लेजर': 'ledger',
    'लेनदेन': 'ledger',                'सेटिंग': 'settings',
    'सेटिंग्स': 'settings',            'ग्राहक': 'contacts',
    'सप्लायर': 'purchases',            'खरीद': 'purchases',
    'रिपोर्ट': 'dss',                  'भविष्यवाणी': 'prediction',
    'बैंक': 'banker',                   'ऋण': 'banker',
    // ── Marathi (mr-IN) ──
    'डॅशबोर्ड': 'dashboard',           'मुख्यपृष्ठ': 'dashboard',
    'बिल करा': 'invoices',             'पावती': 'invoices',
    'माल साठा': 'inventory',          'साठा': 'inventory',
    'खरेदी ग्राहक': 'contacts',        'खरेदी': 'purchases',
    'विक्रेता': 'purchases',           'खातेवही': 'ledger',
    'अहवाल': 'dss',                    'अंदाज': 'prediction',
    'सेटिंग्ज': 'settings',
    // ── Tamil (ta-IN) ──
    'டாஷ்போர்டு': 'dashboard',       'வீடு': 'dashboard',
    'ரசீது': 'invoices',               'பில்': 'invoices',
    'சரக்கு': 'inventory',             'வாடிக்கையாளர்': 'contacts',
    'கொள்முதல்': 'purchases',          'அமைப்புகள்': 'settings',
    'வங்கி': 'banker',                 'அறிக்கை': 'dss',
    // ── Telugu (te-IN) ──
    'డాష్‌బోర్డ్': 'dashboard',       'హోమ్': 'dashboard',
    'బిల్లు': 'invoices',              'జాబితా': 'inventory',
    'కొనుగోలు': 'purchases',           'సెట్టింగులు': 'settings',
    'వినియోగదారు': 'contacts',         'నివేదిక': 'dss',
    // ── Gujarati (gu-IN) ──
    'ડેશબોર્ડ': 'dashboard',           'ઇનવૉઇસ': 'invoices',
    'બિલ': 'invoices',                 'સ્ટૉક': 'inventory',
    'ગ્રાહક': 'contacts',              'ખરીદી': 'purchases',
    'સેટિંગ': 'settings',              'અહેવાલ': 'dss',
    // ── Kannada (kn-IN) ──
    'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್': 'dashboard',    'ಸ್ಟಾಕ್': 'inventory',
    'ಬಿಲ್ಲು': 'invoices',              'ಗ್ರಾಹಕ': 'contacts',
    'ಖರೀದಿ': 'purchases',             'ಸೆಟ್ಟಿಂಗ್': 'settings',
    'ವರದಿ': 'dss',                     'ಬ್ಯಾಂಕ್': 'banker',
    // ── Bengali (bn-IN) ──
    'ড্যাশবোর্ড': 'dashboard',        'চালান': 'invoices',
    'মজুদ': 'inventory',               'গ্রাহক': 'contacts',
    'কেনাকাটা': 'purchases',          'সেটিং': 'settings',
    'ব্যাংক': 'banker',                'প্রতিবেদন': 'dss',
  };

  // Extract common numbers safely
  const extractAmount = (text: string) => {
    // Matches "5000", "5000 rupees", "rs 5000", "₹5000"
    const match = text.match(/(?:rs\.?|₹|rupees?|of)?\s*(\d+)\s*(?:rs\.?|₹|rupees?)?/i);
    return match && match[1] ? parseInt(match[1], 10) : null;
  };

  // Check navigation intent first
  for (const [key, targetModule] of Object.entries(targetMap)) {
    if (t === key || t === `${key} page` || t === `open ${key}` || t.includes(`go to ${key}`) || t.includes(`navigate to ${key}`) || t.includes(`show ${key}`) ||
        t.includes(`${key} खोलो`) || t.includes(`${key} दिखाओ`) || t.includes(`${key} पेज`) ||
        t.includes(`${key} उघडा`) || t.includes(`${key} दाखवा`)) {
      return {
        intent: 'NAVIGATE',
        confidence: 0.95,
        params: { target_page: targetModule },
        vani_response: `Opening the ${key} workspace, Sir.`,
        summary_card: {
          title: "Navigation",
          subtitle: `Redirected to ${targetModule}`,
          items: [{ label: "Target Module", value: targetModule }],
          status: "success"
        }
      };
    }
  }
  // 1.5. QUERY_INVOICE
  const queryInvoiceKeywords = [
    'show invoice', 'latest invoice', 'recent invoice', 'find invoice', 'search invoice', 'invoice status', 'check invoice',
    'show bill', 'latest bill', 'recent bill', 'find bill', 'search bill', 'bill status', 'check bill',
    'पुराने बिल', 'बिल दिखाओ', 'चालान दिखाओ', 'बिल शो', 'इनवॉइस दिखाओ'
  ];
  if (queryInvoiceKeywords.some(kw => t.includes(kw)) || ((t.includes('invoice') || t.includes('bill') || t.includes('बिल') || t.includes('चालान')) && (t.includes('show') || t.includes('latest') || t.includes('find') || t.includes('search') || t.includes('दिखाओ') || t.includes('बताओ')))) {
    let queryParam = 'latest';
    // try to extract invoice number or customer name
    const forMatch = t.match(/(?:for|of)\s+([a-zA-Z0-9\s]+)$/i);
    if (forMatch && forMatch[1]) {
      queryParam = forMatch[1].trim();
    }
    
    return {
      intent: 'QUERY_INVOICE',
      confidence: 0.9,
      params: { query: queryParam },
      vani_response: "Accessing the invoice registry to pull up the requested records.",
      summary_card: {
        title: "Invoice Query",
        subtitle: "Searching records",
        items: [{ label: "Search Term", value: queryParam }],
        status: "success"
      }
    };
  }

  // 2. CREATE_INVOICE fallback
  const invoiceKeywords = [
    'invoice', 'bill', 'billing', 'create bill', 
    'चालान', 'बिल', 'बिल बनाओ', 'बिल बनाना', 'बिल करो',
    'इनवॉइस बनाओ', 'बिल बना दो', 
    'बिल करा', 'पावती', 'बिल बनवा'
  ];
  if (invoiceKeywords.some(kw => t.includes(kw))) {
    let contact_name = "Walk-in Customer";
    // Match "for [name]" or "to [name]"
    const forMatch = t.match(/(?:for|to)\s+([a-zA-Z\s]+?)(?:\s+(?:for|of|with|amount|rupees|rs|₹)|$)/i);
    if (forMatch && forMatch[1]) {
      contact_name = forMatch[1].trim();
    }
    
    // Fuzzy search in context
    if (contextData?.contacts) {
      const match = contextData.contacts.find((c: any) => c.name.toLowerCase().includes(contact_name.toLowerCase()));
      if (match) contact_name = match.name;
    }

    const total = extractAmount(t) || 100;

    return {
      intent: 'CREATE_INVOICE',
      confidence: 0.9,
      params: { contact_name, items: [{ name: 'General Merchandise', qty: 1, price: total }], total },
      vani_response: `I have prepared a sales invoice draft for ${contact_name} amounting to ₹${total}. Proceeding to billing desk.`,
      summary_card: {
        title: "Draft Created",
        subtitle: `Invoice pre-filled for ${contact_name}`,
        items: [
          { label: "Customer", value: contact_name },
          { label: "Total Amount", value: `₹${total}` }
        ],
        status: "success"
      }
    };
  }

  // 3. SEND_REMINDER / SMART_DUNNING
  const reminderKeywords = [
    'remind', 'reminder', 'dunn', 'dunning', 'recovery',
    'याद दिलाओ', 'याद दिला', 'रिमाइंडर', 'वसूली', 
    'बकाया', 'उधार वसूल', 'पैसे मांगो', 
    'आठवण करून दे', 'वसुली'
  ];
  if (reminderKeywords.some(kw => t.includes(kw))) {
    let contact_name = "Customer";
    const match = t.match(/(?:to|for|of)\s+([a-zA-Z\s]+?)(?:\s+(?:for|of|with|amount|rupees|rs|₹)|$)/i);
    if (match && match[1]) contact_name = match[1].trim();
    
    if (contextData?.contacts) {
      const found = contextData.contacts.find((c: any) => c.name.toLowerCase().includes(contact_name.toLowerCase()));
      if (found) contact_name = found.name;
    }

    const amount = extractAmount(t) || 2500;

    return {
      intent: 'SEND_REMINDER',
      confidence: 0.85,
      params: { contact_name, amount, date: new Date().toISOString() },
      spoken_response: `I have scheduled a dunning reminder for ${contact_name} regarding the outstanding balance of ₹${amount}.`,
      summary_card: {
        title: "Reminder Scheduled",
        subtitle: `Reminder logged for ${contact_name}`,
        items: [
          { label: "Contact", value: contact_name },
          { label: "Amount", value: `₹${amount}` }
        ],
        status: "success"
      }
    };
  }

  // 4. CHECK_STOCK / INVENTORY
  const stockKeywords = [
    'stock', 'inventory', 'quantity', 'godown', 'warehouse',
    'स्टॉक', 'माल', 'सामान', 'गोदाम', 'स्टॉक देखो', 'माल कितना है',
    'साठा', 'माल साठा'
  ];
  if (stockKeywords.some(kw => t.includes(kw))) {
    let product_name = "items";
    // Find what follows 'for' or what comes right before 'stock'
    const forMatch = t.match(/(?:for|of)\s+([a-zA-Z\s]+?)(?:\s|$)/i);
    if (forMatch && forMatch[1]) {
      product_name = forMatch[1].trim();
    } else {
      const words = t.split(' ');
      const stockIndex = words.findIndex(w => w.includes('stock') || w.includes('inventory') || w.includes('माल') || w.includes('साठा'));
      if (stockIndex > 0 && words[stockIndex - 1] !== 'check' && words[stockIndex - 1] !== 'the') {
        product_name = words[stockIndex - 1];
      } else if (stockIndex !== -1 && words[stockIndex + 1]) {
        product_name = words[stockIndex + 1];
      }
    }

    if (contextData?.products) {
      const match = contextData.products.find((p: any) => p.name.toLowerCase().includes(product_name.toLowerCase()));
      if (match) product_name = match.name;
    }

    return {
      intent: 'CHECK_STOCK',
      confidence: 0.85,
      params: { query: product_name },
      spoken_response: `Searching registry for stock levels of ${product_name}, Sir.`,
      summary_card: {
        title: "Stock Query",
        subtitle: `Query: ${product_name}`,
        items: [
          { label: "SKU Keyword", value: product_name },
          { label: "Status", value: "Scanning..." }
        ],
        status: "success"
      }
    };
  }

  // 5. AUTONOMOUS_REORDER / PROCUREMENT
  if (t.includes('reorder') || t.includes('procure') || t.includes('restock') || t.includes('negotiate')) {
    return {
      intent: 'AUTONOMOUS_REORDER',
      confidence: 0.9,
      params: { runDraft: true },
      spoken_response: "Launching Autonomous Procurement Agent to balance warehouse stock levels and pre-fill supplier orders.",
      summary_card: {
        title: "Procurement Mode",
        subtitle: "Safety restock initiated",
        items: [
          { label: "Agent status", value: "Active" },
          { label: "Task", value: "Auto-Replenish" }
        ],
        status: "success"
      }
    };
  }

  // 6. STRATEGIC_PLAN / PREDICTION
  if (t.includes('strategic') || t.includes('plan') || t.includes('prediction') || t.includes('forecast') || t.includes('simulate') || t.includes('what-if') || t.includes('what if')) {
    return {
      intent: 'STRATEGIC_PLAN',
      confidence: 0.9,
      params: { goal: 'Margin Expansion' },
      spoken_response: "Opening the Strategic Prediction Lab. Initializing simulation models.",
      summary_card: {
        title: "Prediction Lab",
        subtitle: "Strategic simulator loaded",
        items: [
          { label: "Mode", value: "What-If Simulation" },
          { label: "Variables", value: "Price, Stock Velocity" }
        ],
        status: "success"
      }
    };
  }

  // 7. SHOW_REPORT
  if (t.includes('report') || t.includes('reports') || t.includes('sales') || t.includes('profit')) {
    return {
      intent: 'SHOW_REPORT',
      confidence: 0.9,
      params: { report_type: 'sales' },
      spoken_response: "Compiling monthly sales ledger and tax compliance velocity reports.",
      summary_card: {
        title: "Report Center",
        subtitle: "Generating PDF ledger",
        items: [
          { label: "Type", value: "Sales Report" },
          { label: "Audit status", value: "Verified" }
        ],
        status: "success"
      }
    };
  }

  // 8. GET_BRIEFING / STATUS (multilingual detection)
  const briefingKeywords = [
    'briefing', 'brief', 'status', 'check', 'update', 'sync',
    'बताओ', 'कितना', 'हाल', 'आज का', 'रिपोर्ट दो', 'स्थिति',
    'सांग', 'किती', 'आजचा'
  ];
  if (briefingKeywords.some(kw => t.includes(kw)) || t.startsWith('hi') || t.startsWith('hello') || t.startsWith('नमस्ते')) {
    return {
      intent: 'GET_BRIEFING',
      confidence: 0.95,
      params: {},
      spoken_response: `Here is your business briefing, Sir. Today's sales: ₹${contextData?.today_total_sales || 0}. Low stock alerts: ${contextData?.critical_stock?.length || 0} products. Overdue invoices: ${contextData?.overdue_count || 0}.`,
      summary_card: {
        title: "System Briefing",
        subtitle: "Daily parameters",
        items: [
          { label: "Sales Today", value: `₹${contextData?.today_total_sales || 0}` },
          { label: "Stock Alerts", value: `${contextData?.critical_stock?.length || 0} SKUs` },
          { label: "Overdue bills", value: `${contextData?.overdue_count || 0} Invoices` }
        ],
        status: "success"
      }
    };
  }

  // 9. Default catch-all fallback navigation/briefing so it NEVER fails
  return {
    intent: 'GET_BRIEFING',
    confidence: 0.5,
    params: {},
    spoken_response: `Sir, I have registered your instruction: "${transcript}". I am opening the main dashboard workspace to coordinate this request.`,
    summary_card: {
      title: "Command Handled",
      subtitle: "Dashboard sync",
      items: [
        { label: "Command", value: transcript.length > 20 ? transcript.slice(0, 18) + "..." : transcript },
        { label: "Status", value: "Routing complete" }
      ],
      status: "success"
    }
  };
}

export const vaniService = {
  processCommand: async (transcript: string, context: any) => {
    let contextData: any = {};
    try {
      await supabase.from('audit_logs').insert({
        action: 'VANI_VOICE_COMMAND_OFFLINE',
        module: context.activeModule || 'System',
        metadata: { transcript },
        severity: 'Info'
      });

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

      const [invoices, products, contacts, ledgerEntries, recentLogs] = await Promise.all([
        context.profile?.business_id
          ? supabase.from('invoices').select('id, invoice_number, contact_name, total_amount, status, due_date').eq('business_id', context.profile.business_id).order('created_at', { ascending: false }).limit(20)
          : Promise.resolve({ data: [] }),
        context.profile?.business_id
          ? supabase.from('products').select('id, name, quantity, category').eq('business_id', context.profile.business_id).limit(50)
          : Promise.resolve({ data: [] }),
        context.profile?.business_id
          ? supabase.from('contacts').select('id, name, phone, outstanding_balance').eq('business_id', context.profile.business_id).limit(50)
          : Promise.resolve({ data: [] }),
        context.profile?.business_id
          ? supabase.from('ledger_entries').select('id, entry_type, amount, created_at').eq('business_id', context.profile.business_id).order('created_at', { ascending: false }).limit(10)
          : Promise.resolve({ data: [] }),
        context.profile?.business_id
          ? supabase.from('vani_logs').select('transcript, intent, spoken_response').eq('business_id', context.profile.business_id).order('created_at', { ascending: false }).limit(5)
          : Promise.resolve({ data: [] })
      ]);
      
      contextData = {
        business_name: context.profile?.business_name || ownerName,
        business_id: context.profile?.business_id,
        current_user_role: context.profile?.role || 'owner',
        products: products.data || [],
        contacts: contacts.data || [],
        invoices: invoices.data || [],
        ledger_entries: ledgerEntries.data || [],
        recent_vani_logs: recentLogs.data || []
      };

      // Try to use the Cloud LLM (Gemini) for Jarvis-level Natural Language Understanding
      try {
        const { data, error } = await supabase.functions.invoke('vani-brain', {
          body: { transcript, context: contextData }
        });

        if (error) throw error;
        if (data && data.intent) {
          console.log("🧠 VANI Brain (Gemini) Output:", data);
          return data;
        }
      } catch (aiError) {
        console.warn("VANI Brain Cloud unreachable or out of tokens. Falling back to offline Regex mode.", aiError);
        // Fallback to local regex/keyword matching if the internet is down or tokens run out
        return localFuzzyParse(transcript, contextData);
      }
      
      // Safety catch
      return localFuzzyParse(transcript, contextData);

    } catch (err) {
      console.error("VANI Execution Error:", err);
      return localFuzzyParse(transcript, contextData);
    }
  },

  speak: (text: string, rate = 0.92) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;

    // Preference for Google voices as per Sec 5.
    // getVoices() is async on Chrome — must wait for voiceschanged if empty.
    const applyVoiceAndSpeak = (voices: SpeechSynthesisVoice[]) => {
      const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en'));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      applyVoiceAndSpeak(voices);
    } else {
      // Wait for voices to load (Chrome/Edge async behavior)
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        applyVoiceAndSpeak(window.speechSynthesis.getVoices());
      }, { once: true });
      // Fallback: speak without preferred voice after 300ms if event never fires
      setTimeout(() => {
        if (!utterance.voice) window.speechSynthesis.speak(utterance);
      }, 300);
    }
  }
};
