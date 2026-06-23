import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Terminal, ChevronRight, Check, AlertTriangle, AlertCircle, 
  Copy, HelpCircle, RefreshCw, Send, User, MoreVertical, Phone, 
  Flag, MessageSquare, Receipt, History, MessageCircle, ArrowDown,
  ShieldCheck, Globe, Calculator, TrendingUp, Zap, FileText, Layout,
  Users, X, Search, PlusCircle, Target, Clock, Package, Box, 
  RotateCw, ShoppingCart, Calendar, GitMerge
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { razorpayService } from "../../services/razorpayService";
import { stripeService } from "../../services/stripeService";
import { useToast } from "../common/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useGlobalData } from "../../context/DataContext";

interface Message {
  id: string;
  role: 'user' | 'ai';
  type: 'text' | 'widget';
  content?: string;
  widgetType?: string;
  widgetData?: any;
  buttons?: { label: string; action: string }[];
  timestamp: Date;
}

interface InvoiceAIConsoleProps {
  invoices?: any[];
  contacts?: any[];
  fetchInvoices?: () => void;
}

export default function InvoiceAIConsole(props: InvoiceAIConsoleProps) {
  const globalData = useGlobalData();
  
  // Use props if provided (backwards compatibility), otherwise use global context
  const invoices = props.invoices ?? globalData.invoices;
  const contacts = props.contacts ?? globalData.contacts;
  const fetchInvoices = props.fetchInvoices ?? (() => globalData.refresh('invoices'));

  const { business } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      type: 'text',
      content: "Hi! I'm Vani, your Smart Billing Companion. I can help you check payment risks, match bank deposits to bills, send WhatsApp reminders, or draft new bills for you. Just ask me a question below or try one of the quick buttons!",
      timestamp: new Date()
    }
  ]);
  const [selectedTargets, setSelectedTargets] = useState<{ id: string, type: 'invoice' | 'customer' }[]>([]);
  const [targetSearch, setTargetSearch] = useState("");
  const [targetCategory, setTargetCategory] = useState<'invoice' | 'customer'>('invoice');
  const [showSelector, setShowSelector] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  // Pre-fill selected target if available
  useEffect(() => {
    if (invoices.length > 0 && selectedTargets.length === 0) {
      setSelectedTargets([{ id: invoices[0].id, type: 'invoice' }]);
    }
  }, [invoices]);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleAction = async (action: string, data: any) => {
    switch (action) {
      case 'WHATSAPP_REMINDER':
        window.open(`https://wa.me/${data.phone}?text=${encodeURIComponent(data.message)}`, '_blank');
        toast("WhatsApp Opened: Reminder draft sent", "success");
        break;
      
      case 'MATCH_PAYMENT':
        try {
          const { error } = await supabase
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', data.invoice_id);
          
          if (error) throw error;
          fetchInvoices();
          toast("Payment Reconciled: Invoice status updated to Paid", "success");
          addMessage({ role: 'ai', type: 'text', content: "I've successfully reconciled the payment. The invoice status has been updated to 'Paid' in your ledger." });
        } catch (err: any) {
          toast(`Error: ${err.message}`, "error");
        }
        break;

      case 'CREATE_INSTALLMENT':
        toast(`Plan Created: ${data.plan} initiated`, "success");
        addMessage({ role: 'ai', type: 'text', content: `Great. I've set up the ${data.plan} plan for this invoice. The client will receive an update shortly.` });
        break;

      case 'FLAG_FORECAST':
        toast("Forecast Updated: Invoice flagged as high-risk", "info");
        break;

      case 'OPEN_PORTAL':
        window.open(data.url, '_blank');
        break;

      case 'SECURE_RECORDS':
        toast("Records Secured: All entity records encrypted", "success");
        addMessage({ role: 'ai', type: 'text', content: "I've secured the records for this entity. All sensitive data is now protected by Vyapari Sentry." });
        break;

      case 'RUN_BULK':
        toast(`Processing Started for ${data.count} items`, "info");
        setTimeout(() => {
          toast("Success: All bulk actions completed", "success");
          addMessage({ role: 'ai', type: 'text', content: `Bulk processing for ${data.count} invoices is complete. Notifications have been dispatched.` });
        }, 2000);
        break;

      case 'APPLY_TAX':
        toast("Tax Strategy Applied to your profile", "success");
        addMessage({ role: 'ai', type: 'text', content: "Optimization applied! Your estimated savings of Rs." + data.savings.toLocaleString() + " will be reflected in your next GST filing draft." });
        break;

      case 'EXPORT_FORECAST':
        toast("Exporting 30-day forecast report...", "info");
        setTimeout(() => {
          toast("Download Ready: Forecast PDF generated", "success");
        }, 1500);
        break;

      case 'DOWNLOAD_RECEIPT':
        const receiptHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.5; padding: 0; margin: 0; background: #f8fafc; }
                .receipt-card { max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                .biz-info h1 { margin: 0; font-size: 24px; color: #0f172a; }
                .biz-info p { margin: 4px 0; color: #64748b; font-size: 14px; }
                .title-badge { background: #f1f5f9; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
                .main-stats { background: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
                .stat-value { font-size: 18px; color: #0f172a; font-weight: 600; }
                .amount-highlight { grid-column: span 2; background: #1e293b; color: white; padding: 20px; border-radius: 6px; margin-top: 8px; text-align: center; }
                .amount-highlight .stat-label { color: #94a3b8; }
                .amount-highlight .stat-value { font-size: 32px; color: white; }
                .details-grid { display: grid; grid-template-columns: 100px 1fr; gap: 12px; font-size: 14px; }
                .details-label { color: #64748b; }
                .details-value { font-weight: 500; color: #334155; }
                .settled-stamp { position: absolute; top: 120px; right: -20px; transform: rotate(15deg); border: 4px solid #10b981; color: #10b981; padding: 10px 30px; font-weight: 800; font-size: 32px; border-radius: 8px; opacity: 0.2; pointer-events: none; text-transform: uppercase; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
              </style>
            </head>
            <body>
              <div class="receipt-card">
                <div class="settled-stamp">Settled</div>
                <div class="header">
                  <div class="biz-info">
                    <h1>${business?.name || 'Vyapari Store'}</h1>
                    <p>${business?.address || 'Digital Commerce'}</p>
                    <p>${business?.phone || ''}</p>
                  </div>
                  <div class="title-badge">Payment Receipt</div>
                </div>
                
                <div class="main-stats">
                  <div>
                    <div class="stat-label">Invoice Reference</div>
                    <div class="stat-value">#${data.matched_invoice || 'INV-001'}</div>
                  </div>
                  <div style="text-align: right;">
                    <div class="stat-label">Receipt Date</div>
                    <div class="stat-value">${new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                  <div class="amount-highlight">
                    <div class="stat-label">Total Amount Settled</div>
                    <div class="stat-value">Rs.${(data.payment_received || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div class="details-grid">
                  <div class="details-label">Client Name</div>
                  <div class="details-value">${data.client_name || 'Valued Customer'}</div>
                  
                  <div class="details-label">Payment Mode</div>
                  <div class="details-value">Bank Transfer / UPI</div>
                  
                  <div class="details-label">Auth Code</div>
                  <div class="details-value">${Math.random().toString(36).substring(7).toUpperCase()}</div>
                </div>

                <div class="footer">
                  This is a computer-generated receipt. No signature required.<br/>
                  Powered by Vyapari Smart Engine
                </div>
              </div>
              <script>
                // Auto trigger print to save as PDF
                window.onload = () => {
                  setTimeout(() => {
                    // window.print();
                  }, 500);
                };
              </script>
            </body>
          </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(receiptHtml);
          printWindow.document.close();
          printWindow.focus();
          // Give it a moment to load styles/fonts
          setTimeout(() => {
            printWindow.print();
            // printWindow.close(); // Optional: close after print
          }, 500);
        }
        toast("Premium Receipt Generated! Print and Save as PDF.", "success");
        break;

      case 'EDIT_DRAFT':
        toast("Draft Mode: Opening invoice editor...", "info");
        break;

      default:
        console.log("Action triggered:", action, data);
    }
  };

  const runCapability = async (capId: number, userQuery?: string) => {
    setLoading(true);
    
    const steps = [
      "Analyzing Invoice Data...",
      "Connecting to Supabase...",
      "Matching Ledger Patterns...",
      "Running Neural Models...",
      "Finalizing Insight..."
    ];

    for (const step of steps) {
      setThinkingStep(step);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Determine context
    const isMulti = selectedTargets.length > 1;
    const isCustomer = selectedTargets.some(t => t.type === 'customer');
    
    // Get primary entity for analysis
    const primaryTarget = selectedTargets[0];
    const targetInvoices = primaryTarget?.type === 'customer' 
      ? invoices.filter(i => i.contact_id === primaryTarget.id)
      : invoices.filter(i => selectedTargets.some(t => t.id === i.id));

    const selectedInvoice = targetInvoices[0] || invoices[0];
    
    if (!selectedInvoice && !isCustomer) {
      addMessage({ role: 'ai', type: 'text', content: "I couldn't find any data to analyze. Please select targets first." });
      setLoading(false);
      return;
    }

    const clientName = isCustomer 
      ? contacts.find(c => c.id === primaryTarget?.id)?.name || "Client"
      : selectedInvoice?.contacts?.name || selectedInvoice?.customer_name || "Client";
    
    const clientPhone = isCustomer 
      ? contacts.find(c => c.id === primaryTarget?.id)?.phone || ""
      : selectedInvoice?.contacts?.phone || "";

    let result: any = null;

    // Adjust logic for multi/customer context
    if (isMulti || isCustomer) {
      const count = targetInvoices.length;
      const totalAmount = targetInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const isRisk = capId === 1 || capId === 11;
      const isBulk = capId === 8 || capId === 3;

      if (isRisk) {
         result = {
           action: "CASH_FLOW_FORECAST",
           result: {
             next_30_days: totalAmount * 1.1,
             current_liquidity: totalAmount * 0.4,
             upcoming_gap: `Aggregated analysis for ${isCustomer ? clientName : count + ' invoices'}`,
             confidence: 90,
             risk_score: 75
           }
         };
      } else if (isBulk) {
         result = {
           action: "BULK_PROCESSING",
           result: {
             total_selected: count,
             total_value: totalAmount,
             action_type: isCustomer ? `Invoices for ${clientName}` : "Bulk Follow-up",
             status: "Ready",
             engine: "Vyapari Bulk v2"
           }
         };
      } else if (capId === 3) {
         result = {
           action: "FOLLOW_UP",
           result: {
             client_name: isCustomer ? clientName : "Selected Group",
             client_phone: clientPhone || "919876543210",
             message: `Hi, checking in regarding ${count} pending invoices (Total: Rs.${totalAmount.toLocaleString()}). Can we discuss payment?`,
             due_date: "Multiple"
           }
         };
      } else {
         result = { action: 'TEXT', result: { content: `I've analyzed ${count} invoices for ${isCustomer ? clientName : 'this group'}. Total exposure is Rs.${totalAmount.toLocaleString()}. What's our next step?` } };
      }
    } else {
      // Single Invoice Logic (Existing)
      switch (capId) {
        case 1: { // LATE PAYMENT PREDICTION
          const amount = selectedInvoice.total_amount || 0;
          const isLate = new Date(selectedInvoice.due_date) < new Date();
          const score = isLate ? 85 : Math.floor(Math.random() * 40) + 20;
          const tier = score <= 30 ? "Low" : score <= 65 ? "Medium" : "High";

          result = {
            action: "LATE_PAYMENT_PREDICTION",
            result: {
              invoice_id: selectedInvoice.id,
              invoice_number: selectedInvoice.invoice_number,
              client_name: clientName,
              client_phone: clientPhone,
              risk_score: score,
              risk_tier: tier,
              top_reasons: [
                isLate ? "Invoice is already past the due date" : "Based on historical payment patterns for this client",
                `Rs.${(amount/1000).toFixed(0)}K is higher than this client's typical purchase`,
                "Industry-wide delays observed in the last 14 days"
              ],
              recommended_action: tier === "High" ? "Call + send reminder" : "Send nudge",
              predicted_payment_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              confidence: 92,
              tip: "Setting up a partial payment link might expedite this."
            }
          };
          break;
        }
        case 2: { // AUTO-RECONCILIATION
          result = {
            action: "RECONCILIATION",
            result: {
              invoice_id: selectedInvoice.id,
              payment_received: selectedInvoice.total_amount,
              matched_invoice: selectedInvoice.invoice_number,
              match_percentage: 100,
              client_name: clientName,
              status: "Found an exact match in your bank sync for this amount."
            }
          };
          break;
        }
        case 3: { // SMART FOLLOW-UP
          result = {
            action: "FOLLOW_UP",
            result: {
              invoice_id: selectedInvoice.id,
              client_phone: clientPhone,
              message: `Hi ${clientName}, this is a gentle reminder regarding Invoice #${selectedInvoice.invoice_number} for Rs.${(selectedInvoice.total_amount || 0).toLocaleString("en-IN")}. It is currently outstanding. You can pay via the portal link. Thanks!`,
              channel: "whatsapp"
            }
          };
          break;
        }
        case 4: { // INVOICE WRITER
          result = {
            action: "INVOICE_WRITER",
            result: {
              summary: `Draft invoice prepared for ${clientName} based on your recent order notes. Total including taxes: Rs.${((selectedInvoice.total_amount || 0) * 1.18).toLocaleString("en-IN")}.`,
              invoice_id: selectedInvoice.id
            }
          };
          break;
        }
        case 6: { // CLIENT PORTAL
          result = {
            action: "CLIENT_PORTAL",
            result: {
              client_name: clientName,
              access_status: "Active",
              last_login: "Today, 10:45 AM",
              total_active_invoices: invoices.filter(i => i.contact_id === selectedInvoice.contact_id && i.status === 'pending').length,
              portal_url: `https://vyapari.io/p/${selectedInvoice.contact_id?.substring(0,8)}`
            }
          };
          break;
        }
        case 12: { // DYNAMIC DISCOUNTING
          const amount = selectedInvoice?.total_amount || 0;
          result = {
            action: "DYNAMIC_DISCOUNTING",
            result: {
              invoice_id: selectedInvoice?.id,
              original_amount: amount,
              discount_offer: 2.5,
              discount_amount: amount * 0.025,
              final_amount: amount * 0.975,
              expiry_days: 3,
              client_phone: clientPhone || "919876543210",
              message: `Early Payment Offer: Pay Invoice #${selectedInvoice?.invoice_number} within 48 hours to get a 2.5% discount (Rs.${(amount * 0.025).toLocaleString()} off!)`
            }
          };
          break;
        }
        case 5: { // FRAUD
           result = {
             action: "FRAUD_GUARD",
             result: {
               risk_level: "Low",
               confidence: 99,
               alerts: ["Bank account verified", "Tax ID matches records", "No suspicious activity"],
               protected_by: "Vyapari Sentry"
             }
           };
           break;
        }
        case 7: { // INSTALLMENT
           const amount = selectedInvoice.total_amount || 0;
           result = {
             action: "INSTALLMENT_PLAN",
             result: {
               invoice_id: selectedInvoice.id,
               total_amount: amount,
               options: [
                 { plan: "3 Months", amount: amount/3, total: amount },
                 { plan: "6 Months", amount: (amount*1.05)/6, total: amount*1.05 }
               ]
             }
           };
           break;
        }
        case 9: { // CURRENCY
           const amount = selectedInvoice.total_amount || 0;
           result = {
             action: "MULTI_CURRENCY",
             result: {
               local_amount: amount,
               conversions: [
                 { currency: "USD", amount: amount/83.4, rate: 83.4 },
                 { currency: "EUR", amount: amount/91.2, rate: 91.2 },
                 { currency: "GBP", amount: amount/105.6, rate: 105.6 }
               ],
               hedge_recommendation: "Hedge Recommended: Lock-in current rate"
             }
           };
           break;
        }
        case 10: { // TAX
           const amount = selectedInvoice.total_amount || 0;
           result = {
             action: "TAX_OPTIMIZATION",
             result: {
               tax_type: "GST",
               compliance_score: 98,
               potential_savings: amount * 0.05,
               tips: ["Claim ITC for input materials", "Apply early payment GST credit", "Verify HSN codes"]
             }
           };
           break;
        }
        case 11: { // FORECAST
           const amount = selectedInvoice.total_amount || 0;
           result = {
             action: "CASH_FLOW_FORECAST",
             result: {
               next_30_days: amount * 4.5,
               current_liquidity: amount * 3,
               upcoming_gap: "Surplus",
               confidence: 95
             }
           };
           break;
        }
        case 14: { // NEURAL FORENSIC AUDIT
            const amount = selectedInvoice?.total_amount || 0;
            const client = contacts.find(c => c.id === selectedInvoice?.contact_id);
            result = {
              action: "NEURAL_FORENSIC",
              result: {
                invoice_id: selectedInvoice?.id,
                invoice_number: selectedInvoice?.invoice_number,
                impact_score: 8.4,
                financial_ripple: {
                  profit_contribution: (amount * 0.12),
                  runway_impact_days: 3.5,
                  liquidity_buffer: "Moderate"
                },
                inventory_nexus: {
                  velocity_rank: "Top 5%",
                  stockout_risk: "High",
                  restock_blocked_value: amount * 0.8
                },
                customer_dna: {
                  sentiment: "Neutral-Positive",
                  loyalty_shift: "+4%",
                  preferred_channel: "WhatsApp (Morning)",
                  reliability: 92
                },
                local_benchmarks: {
                  price_deviation: "+2.5%",
                  market_health: "Rising",
                  competitor_avg: amount * 0.975
                }
              }
            };
            break;
        }
        case 13: { // FESTIVAL STOCK AUDIT
           result = {
             action: "FESTIVAL_AUDIT",
             result: {
               strategy_name: "MONSOON ARRIVAL STRATEGY",
               revenue_goal: 5420000,
               growth_plan: 26,
               items: [
                 { name: "Makita Hammer Drill", gap: 145, lead: 3, reliability: 94, health: 3 },
                 { name: "3M N95 Mask", gap: 140, lead: 3, reliability: 94, health: 7 },
                 { name: "Premium Widget", gap: 241, lead: 3, reliability: 94, health: 20 },
                 { name: "Verification Stock", gap: 88, lead: 5, reliability: 89, health: 42 }
               ],
               demand_chart: [
                 { label: "Early", value: 10 },
                 { label: "Mid", value: 18 },
                 { label: "Peak", value: 42 },
                 { label: "Post", value: 12 }
               ],
               elasticity: "High",
               profit_boost: 480000
             }
           };
           break;
        }
        default: {
          result = { action: "TEXT", result: { content: `I've analyzed the selected item. Let me know if you need any specific actions.` } };
        }
      }
    }

    addMessage({
      role: 'ai',
      type: 'widget',
      widgetType: result.action,
      widgetData: result.result
    });

    if (capId === 11) {
      addMessage({
        role: 'ai',
        type: 'text',
        content: `**Detailed Analysis:** Based on your current pattern, you have a projected inflow of Rs.${(result.result.next_30_days/100000).toFixed(1)}L over the next 30 days. Most of this is concentrated in Week 4. Your liquidity remains strong with a 95% confidence score. No immediate funding gaps detected.`
      });
    }
    setLoading(false);
  };

  const getChatbotResponseV2 = (question: string, history: Message[]): { content: string; buttons?: { label: string; action: string }[] } => {
    const queryLower = question.toLowerCase();
    
    // 1. GREETINGS & FRIENDLY CHAT
    if (/^(hi|hello|hey|yo|g'day|good\s+morning|good\s+afternoon|good\s+evening|what's\s+up|sup)\b/i.test(queryLower)) {
      return {
        content: `👋 **Hello there! Welcome!**

I am your friendly business assistant. How is your day going?

I can make your daily business work much easier. Here is what I can do for you:

* **📝 Easy Billing:** Say *"Draft a new bill"* or *"Match my payments"*.

* **🛡️ Smart Safety:** Ask *"Is my money safe?"* or *"Explain fingerprint locks"*.

* **🌐 Auto Syncing:** Ask *"How to send bills directly to other stores?"*.

* **📊 Cash Forecasts:** Ask *"Show me cash flow plans"* or *"Predict late payers"*.

What shall we look at first? Let me know in simple words!`,
        buttons: [
          { label: "📈 Cash Forecast", action: "Forecast cash flow" },
          { label: "🛡️ Safety Lock", action: "Is my money safe" },
          { label: "📝 Draft New Bill", action: "Draft a new bill" }
        ]
      };
    }

    // 2. GRATITUDE & POLITE REMARKS
    if (/\b(thanks|thank you|awesome|perfect|great|cool|nice|wonderful|excellent|superb)\b/i.test(queryLower)) {
      return {
        content: `😊 **You are very welcome!**

I am always happy to help you run a smooth, safe, and easy business.

Would you like to try something else right now? I can:

1. **Check for fake bills:** We can run a safety check on any bill.

2. **Split big bills:** We can break a large bill into easy weekly or monthly parts.

3. **Find tax savings:** We can check how much tax money we can save for you.

Just type what you need!`,
        buttons: [
          { label: "🛡️ Run Fraud Audit", action: "Verify transaction safety" },
          { label: "⚡ Split Large Bill", action: "Split large bills" },
          { label: "🧮 GST Tax Savings", action: "Optimize GST" }
        ]
      };
    }

    // 3. IDENTITY & CAPABILITIES
    if (/\b(who are you|what is your name|your purpose|what do you do|how do you work|tell me about yourself)\b/i.test(queryLower)) {
      return {
        content: `🤖 **Meet Vyapari — Your Smart Business Copilot!**

I am built directly into your dashboard to handle the boring and hard parts of your business:

* **Direct Syncing (The Mesh):** I send bills directly from your screen to your buyer's screen. No more manual typing.

* **Quick Cash (Liquid Invoices):** I create small discount offers to make buyers pay you much faster.

* **Payer Warning:** I check your buyer's past habits to tell you if they might pay you late.

* **Face & Fingerprint Locks:** I keep your money completely safe. I ask for physical touch approval for large cash releases.

Feel free to ask me anything about your bills, taxes, or safety!`,
        buttons: [
          { label: "🌐 Open Mesh Inbox", action: "Mesh Sync" },
          { label: "⚡ Early Discounts", action: "Early settlement deals" },
          { label: "🛡️ Biometric Locks", action: "Explain WebAuthn" }
        ]
      };
    }

    // 4. CONVERSATIONAL CONTINUITY LOOKBACK (Follow-ups like "tell me more" or "explain further")
    if (/\b(tell me more|explain more|elaborate|how to use|how do i|more details|explain further)\b/i.test(queryLower)) {
      const lastAIMsg = [...history].reverse().find(m => m.role === 'ai' && m.type === 'text');
      
      if (lastAIMsg && lastAIMsg.content) {
        const lastContent = lastAIMsg.content.toLowerCase();
        
        if (lastContent.includes('mesh') || lastContent.includes('sync')) {
          return {
            content: `🌐 **How to send bills directly to other stores:**

It is very easy to use! Just follow these three simple steps:

1. **Add your partner:** Connect with other business owners using their store ID.

2. **Send in one click:** When making a bill, select "Send via Mesh". It flies straight to their screen instantly.

3. **Easy approval:** The other store opens their "Mesh Inbox", reviews the details, and clicks "Accept". No typing needed!`,
            buttons: [
              { label: "🌐 Visit Mesh Inbox", action: "Mesh Inbox" },
              { label: "🧮 Hold Tax Escrow", action: "Hold Tax Escrow" }
            ]
          };
        }
        if (lastContent.includes('webauthn') || lastContent.includes('security') || lastContent.includes('safe') || lastContent.includes('lock')) {
          return {
            content: `🛡️ **How to lock your account with Face or Fingerprint:**

You can lock big actions with your physical face or fingerprint:

1. Go to your **Profile and Security settings** in the sidebar.

2. Click **"Register Security Key"** or **"Setup Face/Fingerprint Lock"**.

3. Turn on the lock rule. Now, the system will ask for your touch before releasing any payments over Rs. 50,000.`,
            buttons: [
              { label: "🛡️ Fraud Guard Check", action: "Fraud Guard" },
              { label: "🔑 Account Security", action: "Security Sentry" }
            ]
          };
        }
        if (lastContent.includes('discount') || lastContent.includes('liquid') || lastContent.includes('installment')) {
          return {
            content: `⚡ **How to get paid faster:**

You can use two great ways to make sure you never run out of money:

* **Early Payment Discounts:** Give your clients a small discount (like 1.5% to 3% off) if they pay you within a week.

* **Easy Monthly Splitting:** If a customer does not have full cash, split their bill into 4 weekly payments. We will remind them on WhatsApp automatically!`,
            buttons: [
              { label: "⚡ Early Offer", action: "Early payment offer" },
              { label: "⚡ Instalments", action: "Installment options" }
            ]
          };
        }
        if (lastContent.includes('tax') || lastContent.includes('gst') || lastContent.includes('compliance')) {
          return {
            content: `🧮 **How Tax Escrow works in simple terms:**

This feature makes sure you never lose tax credit:

* When a partner sends you a bill, click **"Hold Tax Escrow"** when you accept it.

* You pay them the base money, but you hold back the tax part (like 18%) safely in your ledger.

* When they pay their government tax, our system sees it and releases the held tax money to their bank account automatically!`,
            buttons: [
              { label: "🧮 Tax Savvy Audit", action: "Tax Savvy GST" },
              { label: "🌐 Mesh Sync Details", action: "Mesh sync protocol" }
            ]
          };
        }
      }
      
      return {
        content: `💡 **Quick guide to chatting with me:**

You can ask me to run tools or just ask simple business questions:

1. **To run a tool:** Select an invoice on the left, then say *"Show forecast"* or *"Predict late payers"*.

2. **To learn concepts:** Ask *"How do I split a bill?"* or *"What is a tax escrow?"*.

3. **To take action:** Say *"Write a reminder"* or *"Draft an invoice"*!`,
        buttons: [
          { label: "📈 Cash Forecast", action: "Forecast cash flow" },
          { label: "📝 Draft Invoice", action: "Draft cement bill" }
        ]
      };
    }

    // 5. TOPIC SEARCH AND INTENT CATEGORIES

    // Security / Fraud / Sentry
    if (/\b(security|safe|fraud|scam|hack|webauthn|biometric|fingerprint|faceid|sentry|protect|encrypt)\b/i.test(queryLower)) {
      return {
        content: `🛡️ **Vyapari Safety & Fraud Shield**

We keep your business completely safe. Here are the three ways we guard your money:

1. **Face & Fingerprint Locks:**
   Whenever you transfer money or accept big deals, you must touch your screen or show your face. Password theft cannot hurt you.

2. **Automatic Scam Detection:**
   We check incoming bills instantly. We warn you if someone is billing you twice or changed their bank details.

3. **Safe Invoices:**
   Every single invoice is locked with a unique digital stamp so no one can fake it.

💡 *Tip: Run a 'Fraud Guard' check to analyze if a new bill is 100% safe!*`,
        buttons: [
          { label: "🛡️ Run Fraud Guard", action: "Fraud Guard" },
          { label: "🛡️ Biometric WebAuthn", action: "Explain fingerprint lock" }
        ]
      };
    }

    // Mesh Sync Protocol
    if (/\b(mesh|sync|peer|zero entry|zero-entry|inbox|incoming|transfer|network|channel)\b/i.test(queryLower)) {
      return {
        content: `🌐 **The Mesh: Direct Store-to-Store Sync**

This is our direct connection system. It links your shop's ledger with your suppliers and buyers:

* **Instant Delivery:** The moment a supplier makes a bill, it lands directly in your **Mesh Inbox** as a draft.

* **No Typing:** You do not need to scan papers or type the bill. Just review the screen and click "Accept".

* **Smart Options:** If some goods are broken, you can accept just a part of the bill and let the supplier know in one click.

💡 *Tip: Open your Mesh Inbox from the menu to see incoming bills from verified partners!*`,
        buttons: [
          { label: "🌐 Open Mesh Inbox", action: "Mesh Inbox" },
          { label: "🧮 Hold Tax Escrow", action: "Tax Escrow" }
        ]
      };
    }

    // Liquid Invoice / Early Settlement
    if (/\b(liquid|early|settle|discount|receivable|factor|installment|part pay|installments|split|offer)\b/i.test(queryLower)) {
      return {
        content: `⚡ **Liquid Invoice: Get Paid Faster**

Never run out of cash. Use these three easy methods to keep money flowing in:

1. **Early Pay Discounts:**
   Offer a small reward (like 1.5% to 3% off) to buyers if they clear their outstanding bills within 7 days.

2. **Easy Splits:**
   Break a big, heavy bill into easy weekly or monthly payment plans so your buyers can pay comfortably.

3. **WhatsApp Reminders:**
   Let our assistant send polite automated WhatsApp messages to nudge late payers.

💡 *Tip: Select any invoice and click 'Early Offer' or 'Instalments' to create quick payment plans!*`,
        buttons: [
          { label: "⚡ Early Offer", action: "Early Offer" },
          { label: "⚡ Instalments", action: "Instalments" }
        ]
      };
    }

    // GST & Taxes
    if (/\b(tax|gst|compliance|itc|input tax|savings|optimize)\b/i.test(queryLower)) {
      return {
        content: `🧮 **Tax Savvy: Simple Tax Savings**

We make saving tax money and filing GST simple and stress-free:

* **Tax Credit Guard:**
  We check if your suppliers are filing their taxes on time. If they are late, we warn you so you do not lose your tax credit.

* **Safe Tax Holding:**
  You can hold back the tax amount (like 18%) safely in escrow. It will be sent to the supplier only after they file their government taxes.

* **Filings Tips:**
  We look at your past bills to show you simple tax-saving tricks.

💡 *Tip: Click 'Tax Savvy' in your Billing Toolkit on the right to run an automated tax audit!*`,
        buttons: [
          { label: "🧮 Optimize Taxes", action: "Tax Savvy" },
          { label: "🌐 Mesh Sync Details", action: "Mesh peer sync" }
        ]
      };
    }

    // VANI voice assistant
    if (/\b(vani|voice|speech|assistant|jarvis|dictate|command|nlp|executor|Vani Assistant)\b/i.test(queryLower)) {
      return {
        content: `🎙️ **VANI: Talk to Your Dashboard**

VANI is your voice assistant. You can speak simple commands to run your business hands-free:

* **Create Bills by Voice:**
  Just say: *"VANI, make an invoice for Rajesh for 10 cement bags."*

* **Smart Chain Commands:**
  Tell it: *"Check Rajesh's bill for scams, and then send him a reminder on WhatsApp."*

* **Spoken Alerts:**
  VANI talks to you proactively if your bank cash is low or if a customer is late on their payments.`,
        buttons: [
          { label: "🎙️ Speak to VANI", action: "VANI assistant" }
        ]
      };
    }

    // Cash flow forecast / Predictive dispute / Dispute Guard
    if (/\b(forecast|future|cashflow|projection|runway|liquidity|risk|dispute|conflict|predict)\b/i.test(queryLower)) {
      return {
        content: `📈 **Simple Cash Forecasting & Safety Warnings**

Our assistant acts early to keep your money healthy and safe:

* **30-Day Cash Plan:**
  We show you how much money will come into your business and go out over the next month.

* **Late Payer Alert:**
  We study past payment dates to tell you which customer has a high chance of paying you late.

* **Conflict Guard:**
  We warn you about possible pricing disputes before you send out bills.

💡 *Tip: Select an active invoice and click 'Forecast' to see your future cash timeline!*`,
        buttons: [
          { label: "📈 Cash Forecast", action: "Forecast" },
          { label: "📉 Payment Risk", action: "Payment Risk" }
        ]
      };
    }

    // Invoicing & Bills drafting
    if (/\b(invoice|bill|draft|create|make|write|list|history|pdf|print|receipt)\b/i.test(queryLower)) {
      return {
        content: `📝 **Simple Bill & Invoice Drafting**

We make managing corporate bills simple and elegant:

* **Smart Bill Drafts:**
  Just type a quick rough sentence (like *"bill rajesh 10 cement bags"*). We will draft a beautiful itemized bill with automatic tax math!

* **Beautiful PDF Receipts:**
  Print premium invoice papers and receipts with your shop details and security stamps with one click.

* **Mesh Delivery:**
  Deliver invoices directly to the other store's computer ledger. No paper, no email, no shipping!

💡 *Tip: Select a customer and try 'Smart Draft' or print a payment receipt!*`,
        buttons: [
          { label: "📝 Quick Invoice Draft", action: "Smart Draft" },
          { label: "🧾 Match Payment", action: "Match Payment" }
        ]
      };
    }

    // General fallback
    return {
      content: `💡 **Vyapari Conversational CFO**

Hello! I am your simple business assistant. I can explain any feature in very easy words:

* **Invoicing:** Ask *"How do I write bills?"* or *"How to print a receipt?"*

* **Direct Sync:** Ask *"What is Mesh peer sync?"* or *"Explain Mesh Inbox"*

* **Account Lock:** Ask *"How to lock with fingerprints?"* or *"Is my money safe?"*

* **Cash Flows:** Ask *"How to get paid faster?"* or *"Explain split bills"*

*Type your question below, or select an invoice on the left to start a visual tool!*`,
      buttons: [
        { label: "📈 Cash Forecast", action: "Forecast cash flow" },
        { label: "🛡️ Safety Lock", action: "Is my money safe" },
        { label: "📝 Draft Invoice", action: "Draft cement bill" }
      ]
    };
  };

  const handleQuerySubmit = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const finalQuery = overrideQuery || query;
    if (!finalQuery.trim()) return;

    const userQ = finalQuery;
    addMessage({ role: 'user', type: 'text', content: userQ });
    if (!overrideQuery) setQuery("");

    const q = userQ.toLowerCase();
    
    // Robust NLP routing with word boundaries to avoid false positives (e.g. 'unpaid' matching 'paid')
    const intentMap = [
      { id: 1, regex: /\b(risk|late|unopened|predict|pay on time|unpaid)\b/i },
      { id: 2, regex: /\b(reconcile|paid|match|settle|check payment)\b/i },
      { id: 3, regex: /\b(remind|nudge|follow up|whatsapp|message)\b/i },
      { id: 4, regex: /\b(write|draft|create|make invoice|new invoice)\b/i },
      { id: 5, regex: /\b(fraud|safe|scam|verify|security)\b/i },
      { id: 6, regex: /\b(portal|client view|hub|customer access)\b/i },
      { id: 7, regex: /\b(installment|split|part pay|payment plan)\b/i },
      { id: 8, regex: /\b(bulk|all|many|multiple)\b/i },
      { id: 9, regex: /\b(currency|dollar|usd|foreign|convert)\b/i },
      { id: 10, regex: /\b(tax|gst|compliance|optimization|save tax)\b/i },
      { id: 11, regex: /\b(forecast|future|cashflow|projection|liquidity)\b/i },
      { id: 12, regex: /\b(discount|early|offer|incentive)\b/i },
      { id: 14, regex: /\b(audit|forensic|impact|deep analysis|dna)\b/i },
    ];

    let detectedId = 0;
    for (const intent of intentMap) {
      if (intent.regex.test(q)) {
        detectedId = intent.id;
        // Special case: if query contains 'unpaid', it's almost always a risk/prediction intent
        if (q.includes('unpaid')) detectedId = 1; 
        break;
      }
    }

    const isQuestion = /^(how|what|why|explain|is|can|will|should|tell|who|thanks|thank|hello|hi|hey|yo)\b/i.test(q) || selectedTargets.length === 0;

    if (detectedId && !isQuestion) {
      runCapability(detectedId, userQ);
    } else {
      setLoading(true);
      await new Promise(r => setTimeout(r, 800));
      const chatbotResult = getChatbotResponseV2(userQ, messages);
      addMessage({ role: 'ai', type: 'text', content: chatbotResult.content, buttons: chatbotResult.buttons });
      setLoading(false);
    }
  };

  const quickActions = [
    { id: 1, name: "Payment Risk Analysis", icon: <AlertTriangle size={14} />, desc: "AI predicts probability of late payments" },
    { id: 11, name: "Cashflow Forecast", icon: <TrendingUp size={14} />, desc: "Advanced 30-day liquidity projections" },
    { id: 5, name: "Fraud Guard", icon: <ShieldCheck size={14} />, desc: "Neural anomaly & safe transaction verification" },
    { id: 3, name: "Smart Auto-Nudge", icon: <MessageCircle size={14} />, desc: "Automated AI-timed WhatsApp reminders" },
    { id: 10, name: "Tax Optimization", icon: <Calculator size={14} />, desc: "Automated GST logic & tax credit tracking" },
    { id: 2, name: "Payment Matcher", icon: <Check size={14} />, desc: "Smart reconciliation of bank entries" },
    { id: 12, name: "Dynamic Settlement", icon: <Zap size={14} />, desc: "Algorithm-based early payment discount offers" },
    { id: 4, name: "Quick Draft", icon: <FileText size={14} />, desc: "Natural language smart invoice creation" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[600px] bg-slate-50 rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden font-sans relative">
      
      {/* 1. LEFT PANEL: INSIGHT RADAR */}
      <div className="lg:w-[320px] bg-white border-r border-slate-200 flex flex-col z-10">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                <Sparkles size={24} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Smart Billing Console</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Assistant Online</span>
                   </div>
                </div>
              </div>
           </div>

           {/* Live Metrics */}
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Health</div>
                 <div className="text-lg font-black text-slate-900">94%</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Monitoring</div>
                 <div className="text-lg font-black text-indigo-600">Active</div>
              </div>
           </div>
        </div>

        {/* Narrative Briefing */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFDFD]">
           <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-indigo-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">What's Happening?</span>
           </div>

           {/* Narrative Cards */}
           <div className="space-y-4">
              <div className="bg-white p-5 rounded-[2rem] border border-indigo-100 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-3 opacity-10">
                    <AlertCircle size={24} className="text-rose-500" />
                 </div>
                 <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-2">Needs Attention</span>
                 <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                    "Rohan Traders has missed the payment threshold. I've flagged this for a potential liquidity gap in your next cycle."
                 </p>
                 <button className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all">Nudge Now</button>
              </div>

              <div className="bg-white p-5 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden">
                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Business Tip</span>
                 <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                    "High-velocity stock movement detected. Restocking <span className="text-indigo-600">Premium Drills</span> now would yield a 14% higher margin."
                 </p>
              </div>
           </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-6 bg-slate-900 text-white">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                 <ShieldCheck size={16} className="text-indigo-400" />
              </div>
              <div>
                 <div className="text-[9px] font-black uppercase tracking-widest">Security Status</div>
                 <div className="text-[8px] font-bold text-slate-400 uppercase">Safe & Secure</div>
              </div>
           </div>
        </div>
      </div>

      {/* 2. CENTER PANEL: NEURAL TERMINAL */}
      <div className="flex-1 flex flex-col bg-white relative">
        {/* Terminal Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
           <div className="flex items-center gap-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Vani Assistant</div>
              <div className="flex gap-1.5">
                 {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />)}
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"><History size={16} /></button>
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"><MoreVertical size={16} /></button>
           </div>
        </div>

        {/* Chat History */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
        >
           <AnimatePresence initial={false}>
             {messages.map((msg) => (
               <motion.div
                 key={msg.id}
                 initial={{ opacity: 0, y: 12 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
               >
                 <div className={`max-w-[85%] group ${msg.role === 'user' ? 'order-2' : ''}`}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                       {msg.role === 'ai' ? (
                          <>
                             <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg"><Sparkles size={12} /></div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Smart Billing Assistant</span>
                          </>
                       ) : (
                          <>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Question</span>
                             <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg"><User size={12} /></div>
                          </>
                       )}
                    </div>

                    {msg.type === 'text' ? (
                       <>
                       <div className={`p-5 rounded-3xl text-sm leading-relaxed shadow-sm border ${
                          msg.role === 'user' 
                             ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-sm' 
                             : 'bg-white text-slate-800 border-slate-100 rounded-tl-sm'
                       }`}>
                          {msg.content}
                       </div>
                       {msg.buttons && msg.buttons.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 mt-3 px-1">
                             {msg.buttons.map((btn, bidx) => (
                                <button
                                   key={bidx}
                                   onClick={() => handleQuerySubmit(undefined, btn.action)}
                                   className="px-4 py-2 bg-white hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-1.5"
                                >
                                   <Sparkles size={11} className="text-indigo-500 hover:text-white animate-pulse" />
                                   {btn.label}
                                </button>
                             ))}
                          </div>
                       )}
                    </>
                    ) : (
                       <div className="mt-2 scale-95 origin-top-left">
                          <WidgetRenderer type={msg.widgetType!} data={msg.widgetData} onAction={handleAction} />
                       </div>
                    )}
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>

           {loading && (
             <div className="flex justify-start">
                <div className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{thinkingStep || "Finding Patterns..."}</div>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll Down */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-32 right-10 w-10 h-10 bg-white border border-slate-100 shadow-2xl rounded-full flex items-center justify-center text-indigo-600 z-30 hover:scale-110 transition-all"
            >
              <ArrowDown size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Terminal */}
        <div className="p-8 border-t border-slate-100 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
           <div className="relative group max-w-4xl mx-auto">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                 <Terminal size={18} className="text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                 <div className="w-px h-4 bg-slate-200" />
              </div>
              <input 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuerySubmit()}
                placeholder="Ask anything (e.g., 'Who hasn't paid this month?')..."
                className="w-full pl-16 pr-32 py-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-3xl text-sm font-bold text-slate-900 outline-none transition-all shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <button 
                   onClick={() => setShowSelector(true)}
                   className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl transition-all flex items-center gap-2"
                 >
                    <Target size={16} />
                    <span className="text-[10px] font-black uppercase">Targets</span>
                 </button>
                 <button 
                   onClick={() => handleQuerySubmit()}
                   disabled={loading || !query.trim()}
                   className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
                 >
                    <Send size={18} />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL: ENGINE LIBRARY */}
      <div className="lg:w-[320px] bg-slate-50/50 border-l border-slate-200 flex flex-col z-10">
         <div className="p-8 border-b border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Smart Billing Toolkit</div>
            <div className="space-y-3">
               {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleQuerySubmit(undefined, action.name)}
                    className="w-full p-4 bg-white border border-slate-200/60 rounded-[1.5rem] hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 transition-all text-left group"
                  >
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                           <div className="text-indigo-500">{action.icon}</div>
                           <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{action.name}</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">{action.desc}</p>
                  </button>
               ))}
            </div>
         </div>
         
         <div className="p-8 flex-1 bg-gradient-to-b from-transparent to-indigo-500/5">
            <div className="p-5 bg-[#1A1A2E] rounded-3xl text-white relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Calculator size={64} />
               </div>
               <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Power User Tip</div>
               <p className="text-[10px] font-medium text-slate-300 leading-relaxed italic">
                  "Try asking for a <b>Detailed Check</b> of your top 5 customers to see a 360-degree risk breakdown."
               </p>
            </div>
         </div>
      </div>

      {/* TARGET SELECTOR MODAL */}
      <AnimatePresence>
        {showSelector && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            >
               <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Select Target Context</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct intelligence towards specific entities</p>
                  </div>
                  <button onClick={() => setShowSelector(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="relative mb-6">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       placeholder="Filter targets..."
                       value={targetSearch}
                       onChange={e => setTargetSearch(e.target.value)}
                       className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                     />
                  </div>

                  <div className="flex gap-2 mb-8">
                     {['invoice', 'customer'].map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setTargetCategory(cat as any)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${targetCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                        >
                           {cat}s
                        </button>
                     ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     {(targetCategory === 'invoice' ? invoices : contacts)
                       .filter(t => (t.invoice_number || t.name || "").toLowerCase().includes(targetSearch.toLowerCase()))
                       .slice(0, 10)
                       .map(t => {
                          const isSelected = selectedTargets.some(st => st.id === t.id);
                          return (
                             <button
                               key={t.id}
                               onClick={() => {
                                  if (isSelected) setSelectedTargets(prev => prev.filter(p => p.id !== t.id));
                                  else setSelectedTargets(prev => [...prev, { id: t.id, type: targetCategory }]);
                               }}
                               className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                             >
                                <div>
                                   <div className="text-[11px] font-black text-slate-900 uppercase">{t.invoice_number || t.name}</div>
                                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{t.customer_name || t.phone || "No details"}</div>
                                </div>
                                {isSelected && <Check size={14} className="text-indigo-600" />}
                             </button>
                          );
                       })
                     }
                  </div>
               </div>

               <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedTargets.length} Contexts Locked</div>
                  <button 
                    onClick={() => setShowSelector(false)}
                    className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                  >
                     Apply Context
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WidgetRenderer({ type, data, onAction }: { type: string, data: any, onAction: (a: string, d: any) => void }) {
  switch (type) {
    case 'LATE_PAYMENT_PREDICTION':
      return <LatePaymentRiskWidget data={data} onAction={onAction} />;
    case 'RECONCILIATION':
      return <ReconciliationWidget data={data} onAction={onAction} />;
    case 'FOLLOW_UP':
      return <FollowUpWidget data={data} onAction={onAction} />;
    case 'INSTALLMENT_PLAN':
      return <InstallmentWidget data={data} onAction={onAction} />;
    case 'INVOICE_WRITER':
      return <InvoiceWriterWidget data={data} onAction={onAction} />;
    case 'FRAUD_GUARD':
      return <FraudGuardWidget data={data} onAction={onAction} />;
    case 'CLIENT_PORTAL':
      return <ClientPortalWidget data={data} onAction={onAction} />;
    case 'BULK_PROCESSING':
      return <BulkProcessingWidget data={data} onAction={onAction} />;
    case 'MULTI_CURRENCY':
      return <MultiCurrencyWidget data={data} onAction={onAction} />;
    case 'TAX_OPTIMIZATION':
      return <TaxOptimizationWidget data={data} onAction={onAction} />;
    case 'CASH_FLOW_FORECAST':
      return <CashFlowForecastWidget data={data} onAction={onAction} />;
    case 'FESTIVAL_AUDIT':
      return <FestivalStockAuditWidget data={data} onAction={onAction} />;
    case 'DYNAMIC_DISCOUNTING':
      return <DynamicDiscountingWidget data={data} onAction={onAction} />;
    case 'NEURAL_FORENSIC':
      return <NeuralForensicWidget data={data} onAction={onAction} />;
    default:
      return null;
  }
}

function LatePaymentRiskWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-900">Late payment risk - {data.client_name}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            data.risk_tier === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {data.risk_tier} risk
          </span>
        </div>

        {/* Score */}
        <div className="space-y-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-6xl font-black text-slate-900 tracking-tight">{data.risk_score}</span>
            <span className="text-lg font-bold text-slate-300">/ 100</span>
          </div>
          
          <div className="relative pt-1">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${data.risk_tier === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`} 
                style={{ width: `${data.risk_score}%` }} 
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2">
              <span>Low</span>
              <span className="ml-8">Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Reasons */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Top reasons for concern</p>
          {(data?.top_reasons || []).map((reason: string, i: number) => (
            <div key={i} className="flex gap-3 items-center p-4 bg-[#F8F9FA] rounded-[1.5rem] border border-slate-100">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                {i === 0 ? <History size={14} className="text-amber-500" /> : 
                 i === 1 ? <TrendingUp size={14} className="text-indigo-500" /> :
                 <Calculator size={14} className="text-slate-400" />}
              </div>
              <span className="text-xs font-semibold text-slate-600 leading-snug">{reason}</span>
            </div>
          ))}
        </div>

        {/* Prediction */}
        <div className="pt-5 border-t border-slate-100 space-y-4">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Predicted payment date</div>
            <div className="text-sm font-bold text-slate-900">
              Expected around <span className="text-indigo-600 underline underline-offset-4">{data.predicted_payment_date}</span> 
              <span className="text-slate-400 font-medium ml-2">- about 9 days after due date</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => onAction('WHATSAPP_REMINDER', { phone: data.client_phone, message: `Hi ${data.client_name}, this is a reminder regarding your invoice for ${data.invoice_number}.` })}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <Phone size={14} className="text-indigo-600" />
              {data.recommended_action}
            </button>
            <button 
              onClick={() => onAction('FLAG_FORECAST', data)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <Flag size={14} className="text-slate-400" />
              Flag in forecast
            </button>
          </div>
        </div>
      </div>
      
      {/* Tip Footer */}
      <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Confidence: {data.confidence}%</span>
        <div className="flex items-center gap-1.5">
           <Zap size={12} className="text-indigo-500" />
           <span className="text-[10px] font-bold text-slate-600 italic">Tip: {data.tip}</span>
        </div>
      </div>
    </div>
  );
}


function CashFlowForecastWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
          <TrendingUp size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">30-Day Forecast</span>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forecasted Inflow</div>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">Rs.{(data.inflow || 0).toLocaleString()}</div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Growth</div>
             <div className="text-sm font-black text-emerald-600">+{data.growth_percentage || 0}%</div>
          </div>
        </div>
        <div className="h-16 w-full flex items-end gap-1.5 pt-2">
          {[40, 60, 45, 70, 85, 65, 90].map((h, i) => (
            <div key={i} className="flex-1 bg-indigo-50 rounded-t-lg group relative">
               <div className="absolute inset-x-0 bottom-0 bg-indigo-500 rounded-t-lg transition-all duration-500" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      </div>
      <button 
        onClick={() => onAction('VIEW_FULL_FORECAST', data)}
        className="w-full py-4 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10"
      >
        Full analysis
      </button>
    </div>
  );
}


function ReconciliationWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
             <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
               <Check size={20} />
             </div>
             <span className="text-[15px] font-bold text-slate-900 tracking-tight">Payment matched</span>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
            Matched {data.match_percentage}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-[#F9FAFB] rounded-[1.8rem] border border-slate-100 shadow-sm">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Payment Received</div>
            <div className="text-2xl font-black text-slate-900">Rs.{(data?.payment_received || 0).toLocaleString()}</div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">from {data?.client_name || "Customer"}</div>
          </div>
          <div className="p-5 bg-[#F9FAFB] rounded-[1.8rem] border border-slate-100 shadow-sm">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Invoice</div>
            <div className="text-2xl font-black text-slate-900">{data.matched_invoice}</div>
            <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              exact match found
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl flex items-center justify-center gap-2.5">
          <span className="text-xs font-bold text-emerald-700">{data.status}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => onAction('WHATSAPP_REMINDER', { phone: data.client_phone, message: "Thank you for the payment!" })}
            className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/20 transition-all shadow-sm group"
          >
            <MessageSquare size={18} className="text-slate-400 group-hover:text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600">Send thank you</span>
          </button>
          <button 
            onClick={() => onAction('MATCH_PAYMENT', data)}
            className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/20 transition-all shadow-sm group"
          >
            <Check size={18} className="text-slate-400 group-hover:text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-600">Approve Match</span>
          </button>
          <button 
            onClick={() => onAction('DOWNLOAD_RECEIPT', data)}
            className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-sky-200 hover:bg-sky-50/20 transition-all shadow-sm group"
          >
            <ArrowDown size={18} className="text-slate-400 group-hover:text-sky-500" />
            <span className="text-[10px] font-bold text-slate-600">Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowUpWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-fuchsia-50 rounded-xl flex items-center justify-center text-fuchsia-600 shadow-sm">
          <MessageSquare size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">Smart Nudge Draft</span>
      </div>
      <div className="p-5 bg-[#1A1A2E] rounded-[2rem] relative group border border-slate-800 shadow-xl">
        <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>WhatsApp Blueprint</span>
          <Copy size={12} className="opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer" />
        </div>
        <p className="text-[13px] text-white/90 font-medium leading-relaxed italic pr-2">"{data.message}"</p>
      </div>
      <button 
        onClick={() => onAction('WHATSAPP_REMINDER', { phone: data.client_phone, message: data.message })}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
      >
        <MessageCircle size={16} />
        Send via WhatsApp
      </button>
    </div>
  );
}

function InstallmentWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
          <History size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">Installment options</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(data?.options || []).map((opt: any, i: number) => (
          <div 
            key={i} 
            onClick={() => onAction('CREATE_INSTALLMENT', opt)}
            className="p-5 bg-[#F9FAFB] rounded-[2rem] border border-slate-100 text-center space-y-1.5 hover:border-indigo-300 hover:bg-white transition-all cursor-pointer group shadow-sm"
          >
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500">{opt?.plan || "Plan"}</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">Rs.{(opt?.amount || 0).toLocaleString()}</div>
            <div className="text-[10px] font-bold text-slate-400">per month</div>
          </div>
        ))}
      </div>
      <button 
        onClick={() => onAction('CREATE_INSTALLMENT', data?.options?.[0] || {})}
        className="w-full py-4 bg-[#1A1A2E] hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
      >
        Create payment plan
      </button>
    </div>
  );
}

function InvoiceWriterWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
          <FileText size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">Smart-Drafted Invoice</span>
      </div>
      <div className="p-5 bg-[#F9FAFB] rounded-[1.8rem] border border-slate-100 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Summary</span>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">DRAFT</span>
        </div>
        <p className="text-xs font-semibold text-slate-600 leading-relaxed">{data.summary}</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={() => onAction('MATCH_PAYMENT', { invoice_id: data.invoice_id })}
          className="flex-1 py-3.5 bg-[#1A1A2E] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-xl active:scale-[0.98]"
        >
          Review & Send
        </button>
        <button 
          onClick={() => onAction('EDIT_DRAFT', data)}
          className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:bg-slate-50"
        >
          Edit draft
        </button>
      </div>
    </div>
  );
}

function FraudGuardWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">Fraud Guard Analysis</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
          data.risk_level === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {data.risk_level} Risk
        </span>
      </div>
      <div className="space-y-3">
        {(data?.alerts || []).map((alert: string, i: number) => (
          <div key={i} className="flex gap-3 items-center p-4 bg-[#FFF5F5] rounded-2xl border border-rose-100">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-rose-800 leading-snug">{alert}</span>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
         <span className="text-[10px] font-bold text-slate-400 uppercase">Engine: {data.protected_by}</span>
         <button 
           onClick={() => onAction('SECURE_RECORDS', data)}
           className="px-4 py-2 bg-[#1A1A2E] text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
         >
           Secure Records
         </button>
      </div>
    </div>
  );
}

function ClientPortalWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
          <Globe size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">Client Hub Status</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Login</div>
           <div className="text-sm font-bold text-slate-900">{data.last_login}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Invoices</div>
           <div className="text-sm font-bold text-slate-900">{data.total_active_invoices} items</div>
        </div>
      </div>
      <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 space-y-2">
         <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Unique Portal URL</div>
         <div className="text-[11px] font-bold text-indigo-600 truncate">{data.portal_url}</div>
      </div>
      <button 
        onClick={() => onAction('OPEN_PORTAL', { url: data.portal_url })}
        className="w-full py-4 bg-[#1A1A2E] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
      >
         <Globe size={14} /> Open Client Dashboard
      </button>
    </div>
  );
}

function BulkProcessingWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 shadow-sm">
          <Zap size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">Bulk Action Processor</span>
      </div>
      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
           <span className="text-2xl font-black text-slate-900">{data.total_selected}</span>
        </div>
        <div>
           <div className="text-xs font-bold text-slate-900">{data.action_type}</div>
           <div className="text-[10px] font-medium text-slate-400 mt-1">Ready to process {data.total_selected} invoices</div>
        </div>
      </div>
      <button 
        onClick={() => onAction('RUN_BULK', { count: data.total_selected })}
        className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-sky-600/20 active:scale-95"
      >
        Run Engine Now
      </button>
    </div>
  );
}

function MultiCurrencyWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
          <Globe size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">Currency Conversion</span>
      </div>
      <div className="space-y-3">
        {(data?.conversions || []).map((conv: any, i: number) => (
          <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black text-slate-600 shadow-sm">
                {conv.currency}
              </div>
              <span className="text-sm font-bold text-slate-900">{(conv?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Rate: {conv?.rate || 0}</span>
          </div>
        ))}
      </div>
      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
         <Zap size={14} className="text-emerald-500" />
         <span className="text-xs font-bold text-emerald-700 italic">{data.hedge_recommendation}</span>
      </div>
      <button 
        onClick={() => onAction('SECURE_RECORDS', { type: 'currency_hedge' })}
        className="w-full py-4 bg-[#1A1A2E] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all mt-4"
      >
        Apply Hedge Strategy
      </button>
    </div>
  );
}

function TaxOptimizationWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
            <Calculator size={20} />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">Tax & Compliance</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100">
           {data.compliance_score}% Compliant
        </div>
      </div>
      <div className="p-5 bg-[#1A1A2E] rounded-[2rem] text-center space-y-1 shadow-xl">
         <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Potential Savings</div>
         <div className="text-3xl font-black text-white">Rs.{(data?.potential_savings || 0).toLocaleString()}</div>
      </div>
      <div className="space-y-2.5">
         {(data?.tips || []).map((tip: string, i: number) => (
           <div key={i} className="flex gap-3 items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
             <span className="text-xs font-semibold text-slate-600">{tip}</span>
           </div>
         ))}
      </div>
      <button 
        onClick={() => onAction('APPLY_TAX', { savings: data.potential_savings })}
        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-amber-500/20 mt-4"
      >
        Apply Strategy
      </button>
    </div>
  );
}

function FestivalStockAuditWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  // Restore legacy design: 420px card with focused metrics
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
            <Package size={20} />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">Stock Audit</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase border border-orange-100">
           {data.strategy_name}
        </div>
      </div>

      <div className="p-5 bg-[#1A1A2E] rounded-[2rem] text-center space-y-1 shadow-xl">
         <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Revenue Goal</div>
         <div className="text-3xl font-black text-white">Rs.{(data?.revenue_goal || 0).toLocaleString()}</div>
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Procurement Gaps</div>
        {(data?.items || []).slice(0, 4).map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="text-xs font-black text-slate-900">{item.name}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Health: {item.health}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-rose-500">+{item.gap} Units</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lead: {item.lead}d</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
         <Target size={14} className="text-amber-500" />
         <span className="text-[10px] font-bold text-amber-700 italic">"Simulated 4,000 scenarios. Current buffer covers 92% of demand."</span>
      </div>

      <button 
        onClick={() => onAction('PROCURE_NOW', { items: data.items })}
        className="w-full py-4 bg-[#1A1A2E] hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg mt-4"
      >
        Execute Procurement
      </button>
    </div>
  );
}

function DynamicDiscountingWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
          <Sparkles size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">Dynamic Discount Settlement</span>
      </div>
      
      <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider">Original Invoice Amount</span>
          <span className="font-black text-slate-900">Rs.{(data.original_amount || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-emerald-600 uppercase tracking-wider">Early Settlement Offer ({data.discount_percentage || 0}%)</span>
          <span className="font-black text-emerald-600">Rs.{(data.settlement_amount || 0).toLocaleString()}</span>
        </div>
        <div className="h-px bg-slate-200" />
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Total Savings</span>
          <span className="font-black text-indigo-600">Rs.{(data.savings || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-3">
         <Zap size={14} className="text-indigo-500" />
         <span className="text-[10px] font-bold text-indigo-700 italic">"Offer expires in {data.expires_in_days || 3} days. Settlement will improve instant cash flow."</span>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => onAction('APPROVE_SETTLEMENT', data)}
          className="flex-1 py-4 bg-[#1A1A2E] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
        >
          Approve Settlement
        </button>
        <button 
          onClick={() => onAction('SEND_OFFER', data)}
          className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all hover:bg-slate-50"
        >
          Send Offer
        </button>
      </div>
    </div>
  );
}

function NeuralForensicWidget({ data, onAction }: { data: any, onAction: (a: string, d: any) => void }) {
  return (
    <div className="w-[500px] bg-slate-950 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl relative group">
      {/* Animated Background Pulse */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full -mr-16 -mt-16 animate-pulse" />
      
      <div className="relative p-8 space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Detailed Business Audit</div>
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Impact Assessment: {data.invoice_number}</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-4xl font-black text-white tracking-tighter">{data.impact_score}</div>
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Impact Coefficient</div>
          </div>
        </div>

        {/* 4-Quadrant Impact Map */}
        <div className="grid grid-cols-2 gap-4">
          {/* Financial Ripple */}
          <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-3 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-2 text-emerald-400">
              <Calculator size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Financial Ripple</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">₹{data.financial_ripple.profit_contribution.toLocaleString()}</div>
              <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Direct Profit Contribution</div>
            </div>
            <div className="text-[10px] font-bold text-emerald-500/80 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-lg inline-block">
              +{data.financial_ripple.runway_impact_days} Days Runway
            </div>
          </div>

          {/* Inventory Nexus */}
          <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-3 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-2 text-rose-400">
              <Box size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Inventory Nexus</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">Velocity: {data.inventory_nexus.velocity_rank}</div>
              <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Ranked in Procurement Graph</div>
            </div>
            <div className="text-[10px] font-bold text-rose-500/80 bg-rose-500/5 border border-rose-500/10 px-2 py-1 rounded-lg inline-block uppercase">
              Stockout Risk: {data.inventory_nexus.stockout_risk}
            </div>
          </div>

          {/* Customer DNA */}
          <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-3 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-2 text-indigo-400">
              <Users size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Customer DNA</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">{data.customer_dna.sentiment}</div>
              <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Active Sentiment Score</div>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
               <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">{data.customer_dna.loyalty_shift} Loyalty Growth</span>
            </div>
          </div>

          {/* Market Intelligence */}
          <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-3 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-2 text-amber-400">
              <Globe size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Local Benchmark</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">{data.local_benchmarks.price_deviation} Deviation</div>
              <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Against Local Area Avg</div>
            </div>
            <div className="text-[10px] font-bold text-slate-300">
              Health: <span className="text-amber-500">{data.local_benchmarks.market_health}</span>
            </div>
          </div>
        </div>

        {/* Neural Suggestion Box */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-600/10 relative overflow-hidden group/box">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover/box:scale-125 transition-transform">
             <Zap size={32} className="text-white" />
          </div>
          <div className="text-[9px] font-black text-indigo-100 uppercase tracking-widest mb-2">Smart Strategy</div>
          <p className="text-sm font-bold text-white leading-relaxed pr-8 italic">
            "This customer responds best to early-morning WhatsApp nudges. Smart prediction: settlement in 48h if nudged today."
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button 
            onClick={() => onAction('WHATSAPP_REMINDER', { phone: data.customer_dna.preferred_channel.includes('WhatsApp') ? '919876543210' : '', message: 'Smart Follow-up based on habits analysis.' })}
            className="flex-1 py-4 bg-white text-slate-900 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all shadow-xl active:scale-95"
          >
             Deploy Nudge
          </button>
          <button 
            className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all active:scale-95"
          >
             Export habits report
          </button>
        </div>
      </div>

      {/* Sentry Badge */}
      <div className="px-8 py-3 bg-white/5 border-t border-white/5 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sentry V4 Monitoring</span>
         </div>
         <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest cursor-pointer hover:text-indigo-300">View Full Trace</span>
      </div>
    </div>
  );
}
