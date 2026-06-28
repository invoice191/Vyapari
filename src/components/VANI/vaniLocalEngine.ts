// ═══════════════════════════════════════════════════════════
// VANI 3.0 — LOCAL FALLBACK ENGINE
// Zero API calls. Answers directly from dataContext.
// Activated when ALL models fail.
// ═══════════════════════════════════════════════════════════

interface Product {
  name: string;
  stock_quantity: number;
  reorder_point?: number;
  selling_price?: number;
  purchase_price?: number;
  category?: string;
}

interface Invoice {
  status: string;
  total: number;
  contact_name?: string;
  due_date?: string;
  invoice_number?: string;
}

interface Contact {
  name: string;
  outstanding_amount: number;
  type?: string;
}

interface DataContext {
  products?: Product[];
  invoices?: Invoice[];
  contacts?: Contact[];
}

// ── MATH ENGINE ─────────────────────────────────────────────
export function computeMath(query: string): string | null {
  const q = query.toLowerCase();

  // "15% of 50000" / "15% ka 50000"
  const pctOf = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of|ka|of|on)\s*([\d,]+)/i);
  if (pctOf) {
    const pct = parseFloat(pctOf[1]);
    const base = parseFloat(pctOf[2].replace(/,/g, ""));
    const result = (pct / 100 * base);
    return `${pct}% of ₹${base.toLocaleString("en-IN")} = **₹${result.toLocaleString("en-IN", { maximumFractionDigits: 2 })}**`;
  }

  // "GST on 10000 at 18%"
  const gst = q.match(/gst\s+(?:on\s+)?([\d,]+)\s+(?:at\s+)?(\d+)\s*%/i);
  if (gst) {
    const base = parseFloat(gst[1].replace(/,/g, ""));
    const rate = parseFloat(gst[2]);
    const amt = parseFloat((base * rate / 100).toFixed(2));
    return `Base: ₹${base.toLocaleString("en-IN")}\nGST @${rate}%: ₹${amt.toLocaleString("en-IN")}\n**Total: ₹${(base + amt).toLocaleString("en-IN")}**`;
  }

  // "cost 500 sell 800" → margin
  const margin = q.match(/(?:cost|lagat)\s+([\d,]+).*?(?:sell|price|selling)\s+([\d,]+)/i);
  if (margin) {
    const c = parseFloat(margin[1].replace(/,/g, ""));
    const s = parseFloat(margin[2].replace(/,/g, ""));
    if (s > 0) {
      return `Cost ₹${c.toLocaleString("en-IN")} → Sell ₹${s.toLocaleString("en-IN")}\n` +
             `**Gross Margin: ${((s - c) / s * 100).toFixed(1)}%**\n` +
             `Markup: ${((s - c) / c * 100).toFixed(1)}%`;
    }
  }

  // Basic arithmetic: 1000 + 500, 9000 * 18 / 100
  const arith = q.match(/([\d,]+(?:\.\d+)?)\s*([\+\-\*\/])\s*([\d,]+(?:\.\d+)?)/);
  if (arith) {
    const a = parseFloat(arith[1].replace(/,/g, ""));
    const op = arith[2];
    const b = parseFloat(arith[3].replace(/,/g, ""));
    const ops: Record<string, number> = { "+": a + b, "-": a - b, "*": a * b, "/": b !== 0 ? a / b : NaN };
    const r = ops[op];
    if (!isNaN(r)) {
      return `${a.toLocaleString("en-IN")} ${op} ${b.toLocaleString("en-IN")} = **${r.toLocaleString("en-IN", { maximumFractionDigits: 4 })}**`;
    }
  }

  return null;
}

// ── QUICK INTENT CLASSIFIER (keyword-based, zero AI) ────────
export function quickClassifyIntent(transcript: string): string {
  const t = transcript.toLowerCase();

  if (/\d+\s*[\+\-\*\/]\s*\d+|\d+%|gst|margin|lagat|cost.*sell/.test(t)) return "MATH";
  if (/dead\s*stock|slow\s*moving|no\s*sale|stuck\s*stock/.test(t)) return "SHOW_DEAD_STOCK";
  if (/low\s*stock|reorder|out\s*of\s*stock|stock\s*khatam/.test(t)) return "SHOW_LOW_STOCK";
  if (/invoice|bill|receipt/.test(t) && /create|new|banao|draft/.test(t)) return "CREATE_INVOICE";
  if (/invoice|bill|payment/.test(t) && /show|list|latest|recent|dekho/.test(t)) return "QUERY_INVOICE";
  if (/customer|client|party|ledger/.test(t) && /show|who|list|top/.test(t)) return "QUERY_CUSTOMER";
  if (/overdue|pending|due|baki/.test(t)) return "PAYMENT_STATUS";
  if (/stock|inventory|product/.test(t)) return "CHECK_STOCK";
  if (/setting|profile|account/.test(t)) return "NAVIGATE";
  if (/report|analytics|summary/.test(t)) return "SHOW_REPORT";
  if (/reminder|follow.?up|dunning/.test(t)) return "SEND_REMINDER";
  if (/improve|grow|strategy|plan|simulate/.test(t)) return "STRATEGIC_PLAN";
  if (/price.*increas|increas.*price|pricing/.test(t)) return "MARKET_SIMULATION";

  return "CONVERSATION";
}

// ── CONTEXTUAL FALLBACK REPLY ────────────────────────────────
// Builds a data-driven reply from React dataContext when all AI fails
export function buildLocalFallback(
  transcript: string,
  intent: string,
  dataContext: DataContext
): string {
  const products = dataContext?.products ?? [];
  const invoices = dataContext?.invoices ?? [];
  const contacts = dataContext?.contacts ?? [];

  switch (intent) {
    case "SHOW_DEAD_STOCK": {
      const dead = products.filter(p => p.stock_quantity === 0 || (p.stock_quantity > 0 && p.stock_quantity <= 2));
      if (dead.length === 0) return "Koi dead stock nahi mila. Sab products moving hain! ✅";
      return `🔴 Dead/Slow Stock (${dead.length} items):\n\n${dead.slice(0, 10).map(p =>
        `• ${p.name}: ${p.stock_quantity} units remaining`
      ).join("\n")}`;
    }

    case "SHOW_LOW_STOCK":
    case "CHECK_STOCK": {
      const q = transcript.toLowerCase();
      const term = products.find(p => q.includes(p.name.toLowerCase()));
      if (term) {
        const isLow = term.stock_quantity <= (term.reorder_point ?? 10);
        return `**${term.name}**: ${term.stock_quantity} units${isLow ? " ⚠️ LOW STOCK — reorder recommended!" : " ✅ Stock OK"}`;
      }
      const low = products.filter(p => p.stock_quantity <= (p.reorder_point ?? 10));
      if (low.length === 0) return `All ${products.length} products are above reorder point. ✅`;
      return `⚠️ Low Stock Alert (${low.length} items):\n\n${low.slice(0, 10).map(p =>
        `• ${p.name}: ${p.stock_quantity} units`
      ).join("\n")}`;
    }

    case "QUERY_CUSTOMER": {
      if (contacts.length === 0) return "No customer data found.";
      const sorted = [...contacts]
        .filter(c => !c.type || c.type === "customer")
        .sort((a, b) => (b.outstanding_amount ?? 0) - (a.outstanding_amount ?? 0))
        .slice(0, 5);
      return `Top Customers by Outstanding:\n\n${sorted.map((c, i) =>
        `${i + 1}. ${c.name} — ₹${(c.outstanding_amount ?? 0).toLocaleString("en-IN")}`
      ).join("\n")}`;
    }

    case "PAYMENT_STATUS":
    case "QUERY_INVOICE": {
      if (invoices.length === 0) return "No invoice data found.";
      const pending = invoices.filter(i => i.status === "pending" || i.status === "overdue");
      const totalPending = pending.reduce((s, i) => s + (i.total ?? 0), 0);
      return `📋 Invoice Summary:\n\nTotal Pending: ${pending.length} invoices — ₹${totalPending.toLocaleString("en-IN")}\n\n` +
        (pending.slice(0, 3).map(i =>
          `• ${i.contact_name ?? "Unknown"} — ₹${(i.total ?? 0).toLocaleString("en-IN")} (${i.status})`
        ).join("\n"));
    }

    case "MARKET_SIMULATION":
    case "STRATEGIC_PLAN": {
      const avgMargin = products
        .filter(p => p.selling_price && p.purchase_price)
        .map(p => ((p.selling_price! - p.purchase_price!) / p.selling_price!) * 100);
      const avg = avgMargin.length > 0 ? (avgMargin.reduce((a, b) => a + b, 0) / avgMargin.length).toFixed(1) : "N/A";
      return `📊 Business Intelligence:\n\nAverage margin: ${avg}%\nTotal products: ${products.length}\nActive customers: ${contacts.length}\n\nAI advisor temporarily unavailable. Opening simulation module for detailed analysis...`;
    }

    default:
      return `Request received. AI is briefly unavailable — your command has been processed locally. Please try again in a moment for a full AI response.`;
  }
}
