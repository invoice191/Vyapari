import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "8658673137:AAHK2B-5RMoJPKiOTnU2OygCOhpriOwn4fo";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nossraveojtofrpjxlhn.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3NyYXZlb2p0b2ZycGp4bGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2MzY2NiwiZXhwIjoyMDg5MTM5NjY2fQ.nellAMY-rvxuJkYz96gz4jIAwMKK_M39GIU86RhsWNQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sendMessage(chatId: string, text: string, replyMarkup?: any) {
  console.log(`Sending message to ${chatId}...`);
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    console.error("Telegram error:", JSON.stringify(err));
  }
}

async function handleVani(chatId: string, businessId: string, text: string) {
  const { data: business } = await supabase.from('businesses').select('name').eq('id', businessId).single();
  const { data: recent } = await supabase.from('invoices').select('total_amount, status').eq('business_id', businessId).limit(3);
  
  const contextData = {
    business_name: business?.name,
    recent_activity: recent
  };

  try {
    const { data: aiResponse, error } = await supabase.functions.invoke('vani-brain', {
      body: { 
        transcript: text, 
        businessId: businessId,
        contextData: contextData
      }
    });

    if (error || !aiResponse) throw new Error("VANI disrupted");

    let responseText = `🤖 <b>VANI Intelligence</b>\n─────────────────────\n${aiResponse.spoken_response}`;
    
    if (aiResponse.summary_card) {
      responseText += `\n\n📊 <b>${aiResponse.summary_card.title}</b>\n`;
      aiResponse.summary_card.items.forEach((it: any) => {
        responseText += ` • ${it.label}: ${it.value}\n`;
      });
    }

    await sendMessage(chatId, responseText, {
      inline_keyboard: [
        [{ text: "📊 Get Summary", callback_data: "/summary" }, { text: "📦 Stock Audit", callback_data: "/stock" }],
        [{ text: "❓ Help", callback_data: "/help" }]
      ]
    });
  } catch (err) {
    await sendMessage(chatId, "⚠️ <i>My neural link is currently unstable. Please try a direct command like /summary.</i>");
  }
}

async function handleConnect(chatId: string, code: string) {
  console.log(`Connection request: Chat ${chatId}, Code ${code}`);
  if (!code) {
    await sendMessage(chatId, "❌ <b>Missing Code</b>\nPlease provide your link code from Settings.\nExample: <code>/connect VYP-XXXX</code>");
    return;
  }

  const { data: connectCode, error } = await supabase
    .from('telegram_connect_codes')
    .select('business_id, businesses(name)')
    .eq('code', code.toUpperCase())
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !connectCode) {
    await sendMessage(chatId, "❌ <b>Invalid Code</b>\nCode is either expired or incorrect. Please generate a new one in Vyapari Settings.");
    return;
  }

  const businessId = connectCode.business_id;

  await supabase.from('businesses').update({ telegram_chat_id: null }).eq('telegram_chat_id', chatId);
  await supabase.from('businesses').update({ telegram_chat_id: null }).eq('id', businessId);

  const { error: linkError } = await supabase
    .from('businesses')
    .update({ telegram_chat_id: chatId, telegram_notifications_enabled: true })
    .eq('id', businessId);

  if (linkError) {
    await sendMessage(chatId, "❌ <b>Link Error</b>\nSystem failure. Please try again.");
    return;
  }

  await supabase.from('telegram_connect_codes').update({ used: true }).eq('code', code.toUpperCase());

  await sendMessage(
    chatId,
    `🚀 <b>System Link Established!</b>\n\nWelcome to Vyapari Elite, <b>${(connectCode.businesses as any)?.name}</b>! Your business intelligence suite is now live on Telegram.\n\nUse the buttons below to explore your data:`,
    {
      inline_keyboard: [
        [{ text: "📊 Summary", callback_data: "/summary" }, { text: "📦 Stock", callback_data: "/stock" }],
        [{ text: "📈 Weekly Report", callback_data: "/report" }, { text: "👥 VIPs", callback_data: "/customers" }],
        [{ text: "❓ View All Commands", callback_data: "/help" }]
      ]
    }
  );
}

async function handleStart(chatId: string, businessId?: string) {
  if (businessId) {
    await sendMessage(chatId, "⚡ <b>Initializing Neural Link...</b>");
    
    await supabase.from('businesses').update({ telegram_chat_id: null }).eq('telegram_chat_id', chatId);
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ telegram_chat_id: chatId, telegram_notifications_enabled: true })
      .eq("id", businessId);

    if (updateError) {
      await sendMessage(chatId, "❌ <b>Link Failed</b>");
      return;
    }

    await sendMessage(
      chatId,
      `✅ <b>Vyapari Intelligence Online</b>\n\nYour account is linked. I will now send you real-time alerts and daily digests.\n\n<b>Try asking me something like:</b>\n<i>"How much did I sell today?"</i>`,
      {
        inline_keyboard: [
          [{ text: "📊 Get Daily Summary", callback_data: "/summary" }],
          [{ text: "🔍 Command Menu", callback_data: "/help" }]
        ]
      }
    );
  } else {
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();

    if (business) {
      await sendMessage(
        chatId,
        `👋 Welcome back, <b>${business.name}</b>!\nYour intelligence engine is ready. How can I assist you today?`,
        {
          inline_keyboard: [
            [{ text: "📊 Summary", callback_data: "/summary" }, { text: "📦 Stock", callback_data: "/stock" }],
            [{ text: "💰 Revenue", callback_data: "/revenue" }, { text: "⚠️ Alerts", callback_data: "/alerts" }],
            [{ text: "🤖 Talk to VANI AI", callback_data: "vani_mode" }]
          ]
        }
      );
    } else {
      await sendMessage(
        chatId,
        `❓ <b>Unlinked Device</b>\n\nPlease connect your Telegram account from <b>Vyapari Web Dashboard > Settings > Integrations</b>.\n\nVyapari Bot v2.0 (Elite Edition) 🤖`
      );
    }
  }
}

async function handleSummary(chatId: string, businessId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, total_amount, gst_amt")
    .eq("business_id", businessId)
    .gte("created_at", today);

  const totalSales = invoices?.reduce((s, i) => s + (Number(i.total_amount) || 0), 0) ?? 0;
  
  const { data: items } = await supabase
    .from("invoice_items")
    .select("quantity, line_profit")
    .in("invoice_id", invoices?.map(inv => inv.id) || []);
    
  const estProfit = items?.reduce((s, i) => s + (Number(i.line_profit) || 0), 0) ?? 0;

  await sendMessage(
    chatId,
    `📊 <b>Daily Intel [${new Date().toLocaleDateString()}]</b>\n─────────────────────\n💰 <b>Sales:</b> ₹${totalSales.toLocaleString("en-IN")}\n💎 <b>Profit:</b> ₹${estProfit.toLocaleString("en-IN")}\n🧾 <b>Invoices:</b> ${invoices?.length ?? 0}\n─────────────────────\n🤖 Vyapari Elite`,
    {
      inline_keyboard: [[{ text: "📦 Check Stock", callback_data: "/stock" }, { text: "📈 Week Report", callback_data: "/report" }]]
    }
  );
}

async function handleStock(chatId: string, businessId: string) {
  const { data: critical } = await supabase
    .from("products")
    .select("name, quantity, reorder_level, unit")
    .eq("business_id", businessId)
    .lt("quantity", 5)
    .order("quantity", { ascending: true });

  const { data: low } = await supabase
    .from("products")
    .select("name, quantity, reorder_level, unit")
    .eq("business_id", businessId)
    .gte("quantity", 5)
    .lt("quantity", 15)
    .order("quantity", { ascending: true })
    .limit(5);

  const criticalText = critical?.length
    ? critical.map(p => `  • 🔴 <b>${p.name}</b> → ${p.quantity} ${p.unit} (Min ${p.reorder_level ?? '0'})`).join("\n")
    : "  ✅ None";

  const lowText = low?.length
    ? low.map(p => `  • 🟡 ${p.name} → ${p.quantity} ${p.unit}`).join("\n")
    : "  ✅ None";

  await sendMessage(
    chatId,
    `📦 <b>Enhanced Stock Audit</b>\n─────────────────────\n🚨 <b>CRITICAL (Restock IMMEDIATELY):</b>\n${criticalText}\n\n⚠️ <b>LOW STOCK ALERT:</b>\n${lowText}\n─────────────────────\n💡 <i>Tip: Type /search &lt;name&gt; to check full pricing and availability details.</i>\n─────────────────────\n🤖 Vyapari`
  );
}

async function handleReport(chatId: string, businessId: string) {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 14);

  const { data: thisWeek } = await supabase
    .from("invoices")
    .select("total_amount")
    .eq("business_id", businessId)
    .gte("created_at", thisWeekStart.toISOString());

  const { data: lastWeek } = await supabase
    .from("invoices")
    .select("total_amount")
    .eq("business_id", businessId)
    .gte("created_at", lastWeekStart.toISOString())
    .lt("created_at", thisWeekStart.toISOString());

  const thisTotal = thisWeek?.reduce((s, i) => s + i.total_amount, 0) ?? 0;
  const lastTotal = lastWeek?.reduce((s, i) => s + i.total_amount, 0) ?? 0;
  const change = lastTotal > 0 ? (((thisTotal - lastTotal) / lastTotal) * 100).toFixed(1) : "N/A";
  const arrow = thisTotal >= lastTotal ? "📈" : "📉";

  await sendMessage(
    chatId,
    `📈 <b>Weekly Business Insight</b>\n📅 ${thisWeekStart.toDateString()} → ${now.toDateString()}\n─────────────────────\n💰 This Week: ₹${thisTotal.toLocaleString("en-IN")}\n   Last Week: ₹${lastTotal.toLocaleString("en-IN")}\n   ${arrow} Revenue Swing: ${change}%\n\n🧾 Invoices Tracked: ${thisWeek?.length ?? 0}\n─────────────────────\n🤖 Vyapari Weekly Intelligence`
  );
}

async function handleInvoices(chatId: string, businessId: string, invoiceNumber?: string) {
  if (invoiceNumber) {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, contacts(name, phone)")
      .eq("business_id", businessId)
      .eq("invoice_number", invoiceNumber)
      .single();

    if (!invoice) {
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("business_id", businessId)
        .ilike("name", `%${invoiceNumber}%`)
        .limit(1);

      if (contacts && contacts.length > 0) {
        const contactId = contacts[0].id;
        const contactName = contacts[0].name;
        
        const { data: invoicesByContact } = await supabase
          .from("invoices")
          .select("invoice_number, total_amount, status, created_at")
          .eq("business_id", businessId)
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false })
          .limit(5);
          
        if (invoicesByContact && invoicesByContact.length > 0) {
          const list = invoicesByContact.map((inv, i) => `${i + 1}. ${inv.invoice_number}\n   ₹${inv.total_amount.toLocaleString("en-IN")} | ${inv.status === "paid" ? "✅ Paid" : "⏳ Unpaid"} | ${new Date(inv.created_at).toLocaleDateString("en-IN")}`).join("\n\n");
          
          await sendMessage(
            chatId,
            `🧾 <b>Invoices for ${contactName}</b>\n─────────────────────\n${list}\n─────────────────────\n🤖 Vyapari`
          );
          return;
        }
      }

      await sendMessage(chatId, `❌ No invoice or customer matching "${invoiceNumber}" found.`);
      return;
    }

    // FETCH ITEMS FOR FULL DETAIL
    const { data: items } = await supabase
      .from("invoice_items")
      .select("quantity, unit_price, line_total, products(name, unit)")
      .eq("invoice_id", invoice.id);

    const itemList = items?.map(it => ` • ${it.products?.name || 'Item'}: ${it.quantity} ${it.products?.unit || ''} x ₹${it.unit_price} = ₹${it.line_total}`).join("\n") || "No items listed.";

    await sendMessage(
      chatId,
      `🧾 <b>Deep-Dive: Invoice ${invoice.invoice_number}</b>\n─────────────────────\n👤 <b>Customer:</b> ${invoice.contacts?.name ?? "Unknown"}\n📅 <b>Date:</b> ${new Date(invoice.created_at).toLocaleDateString("en-IN")}\n💳 <b>Mode:</b> ${invoice.payment_method?.toUpperCase() ?? "CASH"} (${invoice.payment_status?.toUpperCase() ?? "PAID"})\n\n📦 <b>Purchased Items:</b>\n${itemList}\n\n─────────────────────\n💸 Subtotal: ₹${(Number(invoice.subtotal) || 0).toLocaleString("en-IN")}\n➖ Discount: ₹${(Number(invoice.discount_amt) || 0).toLocaleString("en-IN")}\n➕ Tax (GST): ₹${(Number(invoice.gst_amt) || 0).toLocaleString("en-IN")}\n\n🏁 <b>GRAND TOTAL: ₹${invoice.total_amount.toLocaleString("en-IN")}</b>\n─────────────────────\n🤖 Vyapari Detailed Record`
    );
  } else {
    const { data: invoices } = await supabase
      .from("invoices")
      .select("invoice_number, total_amount, status, created_at, contacts(name)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5);

    const list = invoices?.map((inv, i) => `${i + 1}. ${inv.invoice_number} | ${inv.contacts?.name ?? "Unknown"}\n   ₹${inv.total_amount.toLocaleString("en-IN")} | ${inv.status === "paid" ? "✅ Paid" : "⏳ Unpaid"}`).join("\n\n");

    await sendMessage(
      chatId,
      `🧾 <b>Recent Transactions</b>\n─────────────────────\n${list ?? "No invoices found"}\n─────────────────────\n💡 Tip: Reply <code>/invoices &lt;number&gt;</code> to see items breakdown.\n🤖 Vyapari`
    );
  }
}

async function handleRevenue(chatId: string, businessId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { data: monthlyInvoices } = await supabase
    .from("invoices")
    .select("total_amount")
    .eq("business_id", businessId)
    .eq("type", "sale")
    .neq("status", "cancelled")
    .gte("created_at", startOfMonth);

  const currentRevenue = monthlyInvoices?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) ?? 0;
  
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
  
  const { data: prevMonthlyInvoices } = await supabase
    .from("invoices")
    .select("total_amount")
    .eq("business_id", businessId)
    .eq("type", "sale")
    .neq("status", "cancelled")
    .gte("created_at", startOfPrevMonth)
    .lte("created_at", endOfPrevMonth);

  const prevRevenue = prevMonthlyInvoices?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) ?? 0;
  const growth = prevRevenue > 0 ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : "N/A";
  const arrow = currentRevenue >= prevRevenue ? "📈" : "📉";

  await sendMessage(
    chatId,
    `💰 <b>Revenue Matrix</b>\n📅 ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}\n─────────────────────\n✨ This Month: ₹${currentRevenue.toLocaleString("en-IN")}\n📊 Previous Month: ₹${prevRevenue.toLocaleString("en-IN")}\n${arrow} Growth Performance: ${growth}%\n─────────────────────\n🤖 Vyapari`
  );
}

async function handleCustomers(chatId: string, businessId: string) {
  const { data: topCustomers, error } = await supabase
    .from("invoices")
    .select("contact_id, total_amount, contacts(name, clv_tier, loyalty_points)")
    .eq("business_id", businessId)
    .eq("type", "sale")
    .neq("status", "cancelled")
    .order("total_amount", { ascending: false });

  if (error) {
    console.error("Customers error:", error);
    await sendMessage(chatId, "❌ Error fetching customer data.");
    return;
  }

  const customerMap = new Map<string, { name: string; total: number; tier: string; visits: number; points: number }>();
  topCustomers?.forEach(inv => {
    const id = inv.contact_id;
    if (!id) return;
    const name = (inv.contacts as any)?.name || "Unknown";
    const tier = (inv.contacts as any)?.clv_tier || "Bronze";
    const points = (inv.contacts as any)?.loyalty_points || 0;
    const current = customerMap.get(id) || { name, total: 0, tier, visits: 0, points };
    current.total += Number(inv.total_amount) || 0;
    current.visits += 1;
    customerMap.set(id, current);
  });

  const sorted = Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const list = sorted.map((c, i) => `${i + 1}. 👤 <b>${c.name}</b> [${c.tier}]\n   Total: ₹${c.total.toLocaleString("en-IN")} | Visits: ${c.visits}\n   Points: ⭐${c.points}`).join("\n\n");

  await sendMessage(
    chatId,
    `👥 <b>VIP Customer Ledger</b>\n─────────────────────\n${list || "No customer data available."}\n─────────────────────\n💡 <i>Includes automated CLV tier classifications!</i>\n─────────────────────\n🤖 Vyapari Intelligence`
  );
}

async function handleLedger(chatId: string, businessId: string, customerName: string) {
  if (!customerName) {
    await sendMessage(chatId, "🔍 Provide customer name to view ledger.\nExample: /ledger name");
    return;
  }
  
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, credit_limit")
    .eq("business_id", businessId)
    .ilike("name", `%${customerName}%`)
    .limit(1);

  if (!contacts || contacts.length === 0) {
    await sendMessage(chatId, `❌ Customer "${customerName}" not found.`);
    return;
  }
  
  const contact = contacts[0];
  
  const { data: ledger } = await supabase
    .from("ledger_entries")
    .select("type, amount, description, timestamp")
    .eq("contact_id", contact.id)
    .order("timestamp", { ascending: false })
    .limit(5);
    
  const { data: allLedger } = await supabase
    .from("ledger_entries")
    .select("type, amount")
    .eq("contact_id", contact.id);
    
  let netBalance = 0;
  allLedger?.forEach(e => {
    if (e.type === 'debit') netBalance -= Number(e.amount) || 0;
    if (e.type === 'credit') netBalance += Number(e.amount) || 0;
  });
  
  const statusLabel = netBalance >= 0 ? "Balance Receivable (Credit)" : "Balance Payable (Debit)";
  const entriesList = ledger?.map(e => ` • ${e.type === 'credit' ? '🟢' : '🔴'} ₹${Math.abs(Number(e.amount)).toLocaleString("en-IN")} | ${e.description ?? 'No desc'}`).join("\n") || "No recent ledger activity.";
  
  await sendMessage(
    chatId,
    `📒 <b>Full Ledger: ${contact.name}</b>\n─────────────────────\n⚖️ <b>Current Net Balance:</b> ₹${Math.abs(netBalance).toLocaleString("en-IN")}\n📝 <b>Status:</b> ${statusLabel}\n🛑 <b>Credit Limit set:</b> ₹${(Number(contact.credit_limit) || 0).toLocaleString("en-IN")}\n\n🕒 <b>Last 5 Operations:</b>\n${entriesList}\n─────────────────────\n🤖 Vyapari Smart Ledger`
  );
}

async function handleSearch(chatId: string, businessId: string, query: string) {
  if (!query) {
    await sendMessage(chatId, "🔍 Please provide a product name to search.\nExample: /search milk");
    return;
  }

  const { data: products } = await supabase
    .rpc("search_products_smart", {
      p_business_id: businessId,
      p_query: query,
      p_limit: 5
    });

  const list = products?.map((p: any) => 
    `📦 <b>${p.name}</b>\n   Available: ${p.quantity} ${p.unit}\n   M.R.P: ₹${p.unit_price}\n   Health: ${p.stock_status.toUpperCase().replace('_', ' ')}`
  ).join("\n\n");

  await sendMessage(
    chatId,
    `🔍 <b>Global Product Lookup: "${query}"</b>\n─────────────────────\n${list || "No products found."}\n─────────────────────\n🤖 Vyapari`
  );
}

async function handleAlerts(chatId: string, businessId: string) {
  const { data: overdue } = await supabase
    .from("invoices")
    .select("invoice_number, total_amount, due_date, contacts(name)")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .lt("due_date", new Date().toISOString().split('T')[0])
    .limit(3);

  const { data: criticalStock } = await supabase
    .from("products")
    .select("name, quantity, reorder_level")
    .eq("business_id", businessId)
    .lte("quantity", 0)
    .limit(3);

  const overdueList = overdue?.map(i => `🔸 <b>${i.invoice_number}</b> (${(i.contacts as any)?.name}): ₹${i.total_amount}`).join("\n") || "✅ Healthy";
  const stockList = criticalStock?.map(p => `🔸 <b>${p.name}</b>: OUT OF STOCK`).join("\n") || "✅ Healthy";

  await sendMessage(
    chatId,
    `⚠️ <b>Advanced Alerts Engine</b>\n─────────────────────\n⌛ <b>Overdue Receivables:</b>\n${overdueList}\n\n📦 <b>Critical Stock Outs:</b>\n${stockList}\n─────────────────────\n💡 <i>Resolve overdue invoices inside the Vyapari dashboard today!</i>\n─────────────────────\n🤖 Vyapari Intelligence`
  );
}

async function handleStop(chatId: string) {
  await supabase
    .from("businesses")
    .update({ telegram_notifications_enabled: false })
    .eq("telegram_chat_id", chatId);
  await sendMessage(chatId, `🔕 Notifications successfully paused.\nSend /start to reactivate intelligence updates.\n🤖 Vyapari`);
}

async function handleHelp(chatId: string) {
  await sendMessage(
    chatId,
    `🤖 <b>Vyapari Elite Bot Console</b>\n─────────────────────\n📊 /summary — Full daily profit & sales\n🧾 /invoices — List recent transactions\n🧾 /invoices &lt;num&gt; — FULL itemized breakdown\n📒 /ledger &lt;name&gt; — View customer credit balance\n📦 /stock — Enhanced audit with reorder alerts\n📈 /report — Growth analytics report\n💰 /revenue — Advanced monthly matrix\n👥 /customers — Top VIP customers with CLV\n⚠️ /alerts — Real-time actionable alerts\n🔍 /search &lt;query&gt; — Inventory lookup\n🔕 /stop — Mute engine alerts\n🔔 /start — Wake system engines\n─────────────────────\n🤖 Empowering Growth by Vyapari`
  );
}

Deno.serve(async (req) => {
  try {
    const textBody = await req.text();
    
    if (!textBody || textBody.trim() === "") {
      return new Response("ok", { status: 200 });
    }

    let body;
    try {
      body = JSON.parse(textBody);
    } catch (e) {
      return new Response("ok", { status: 200 });
    }

    const message = body?.message;
    if (!message) return new Response("ok", { status: 200 });
    
    const chatId = String(message.chat.id);
    const text: string = message.text ?? "";
    const cleanText = text.trim();
    const parts = cleanText.split(/\s+/);
    
    let command = "";
    if (parts[0]) {
      const raw = parts[0].toLowerCase();
      const match = raw.match(/[a-z]+/); 
      if (match) command = match[0];
    }
    
    const arg = parts.slice(1).join(" ") ?? ""; // Combine all arguments for search queries / ledger lookups
    
    console.error(`[V-EX] CHAT: ${chatId} CMD: "${command}" ARG: "${arg}"`);

    if (command === "ping") {
      await sendMessage(chatId, "🏓 System Active & Secured!");
      return new Response("ok", { status: 200 });
    }
    
    if (command === "start") {
      await handleStart(chatId, arg || undefined);
      return new Response("ok", { status: 200 });
    }
    
    if (command === "connect") {
      await handleConnect(chatId, arg);
      return new Response("ok", { status: 200 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("telegram_chat_id", chatId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const businessId = business?.id;
    
    if (!businessId) {
      await sendMessage(chatId, `❓ Account not paired. Please pair from Settings.\n🤖 Vyapari`);
    } else if (command === "summary") {
      await handleSummary(chatId, businessId);
    } else if (command === "stock") {
      await handleStock(chatId, businessId);
    } else if (command === "report") {
      await handleReport(chatId, businessId);
    } else if (command === "revenue") {
      await handleRevenue(chatId, businessId);
    } else if (command === "customers") {
      await handleCustomers(chatId, businessId);
    } else if (command === "ledger") {
      await handleLedger(chatId, businessId, arg);
    } else if (command === "search") {
      await handleSearch(chatId, businessId, arg);
    } else if (command === "alerts") {
      await handleAlerts(chatId, businessId);
    } else if (command === "invoices") {
      await handleInvoices(chatId, businessId, arg || undefined);
    } else if (command === "stop") {
      await handleStop(chatId);
    } else if (command === "help") {
      await handleHelp(chatId);
    } else {
      await sendMessage(chatId, `❓ Unknown command: "${command}"\nType /help.\n🤖 Vyapari`);
    }
  } catch (err) {
    console.error("Master Webhook Error:", err);
  }
  return new Response("ok", { status: 200 });
});
