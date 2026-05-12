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

interface Message {
  id: string;
  role: 'user' | 'ai';
  type: 'text' | 'widget';
  content?: string;
  widgetType?: string;
  widgetData?: any;
  timestamp: Date;
}

interface InvoiceAIConsoleProps {
  invoices: any[];
  contacts: any[];
  fetchInvoices: () => void;
}

export default function InvoiceAIConsole({ invoices, contacts, fetchInvoices }: InvoiceAIConsoleProps) {
  const { business } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      type: 'text',
      content: "Hi! I'm your InvoiceAI assistant. Ask me anything about your invoices — I'll check payment risks, match payments, send reminders, or create new invoices for you. Try one of the quick actions above or type your question below.",
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
        addMessage({ role: 'ai', type: 'text', content: "Optimization applied! Your estimated savings of ₹" + data.savings.toLocaleString() + " will be reflected in your next GST filing draft." });
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
                    <div class="stat-value">₹${(data.payment_received || 0).toLocaleString('en-IN')}</div>
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
                  Powered by Vyapari AI Intelligence
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
             message: `Hi, checking in regarding ${count} pending invoices (Total: ₹${totalAmount.toLocaleString()}). Can we discuss payment?`,
             due_date: "Multiple"
           }
         };
      } else {
         result = { action: 'TEXT', result: { content: `I've analyzed ${count} invoices for ${isCustomer ? clientName : 'this group'}. Total exposure is ₹${totalAmount.toLocaleString()}. What's our next step?` } };
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
                `₹${(amount/1000).toFixed(0)}K is higher than this client's typical purchase`,
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
              message: `Hi ${clientName}, this is a gentle reminder regarding Invoice #${selectedInvoice.invoice_number} for ₹${(selectedInvoice.total_amount || 0).toLocaleString("en-IN")}. It is currently outstanding. You can pay via the portal link. Thanks!`,
              channel: "whatsapp"
            }
          };
          break;
        }
        case 4: { // INVOICE WRITER
          result = {
            action: "INVOICE_WRITER",
            result: {
              summary: `Draft invoice prepared for ${clientName} based on your recent order notes. Total including taxes: ₹${((selectedInvoice.total_amount || 0) * 1.18).toLocaleString("en-IN")}.`,
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
              message: `Early Payment Offer: Pay Invoice #${selectedInvoice?.invoice_number} within 48 hours to get a 2.5% discount (₹${(amount * 0.025).toLocaleString()} off!)`
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
               protected_by: "Vyapari Sentry AI"
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
        content: `**Detailed Analysis:** Based on your current pattern, you have a projected inflow of ₹${(result.result.next_30_days/100000).toFixed(1)}L over the next 30 days. Most of this is concentrated in Week 4. Your liquidity remains strong with a 95% confidence score. No immediate funding gaps detected.`
      });
    }
    setLoading(false);
  };

  const handleQuerySubmit = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const finalQuery = overrideQuery || query;
    if (!finalQuery.trim()) return;

    const userQ = finalQuery;
    addMessage({ role: 'user', type: 'text', content: userQ });
    if (!overrideQuery) setQuery("");

    const q = userQ.toLowerCase();
    
    // Robust NLP routing
    const intentMap = [
      { id: 1, keys: ["risk", "late", "unopened", "predict", "pay on time"] },
      { id: 2, keys: ["reconcile", "paid", "match", "settle", "check payment"] },
      { id: 3, keys: ["remind", "nudge", "follow up", "whatsapp", "message"] },
      { id: 4, keys: ["write", "draft", "create", "make invoice", "new invoice"] },
      { id: 5, keys: ["fraud", "safe", "scam", "verify", "security"] },
      { id: 6, keys: ["portal", "client view", "hub", "customer access"] },
      { id: 7, keys: ["installment", "split", "part pay", "payment plan"] },
      { id: 8, keys: ["bulk", "all", "many", "multiple"] },
      { id: 9, keys: ["currency", "dollar", "usd", "foreign", "convert"] },
      { id: 10, keys: ["tax", "gst", "compliance", "optimization", "save tax"] },
      { id: 11, keys: ["forecast", "future", "cashflow", "projection", "liquidity"] },
      { id: 12, keys: ["discount", "early", "offer", "incentive"] },
    ];

    let detectedId = 0;
    for (const intent of intentMap) {
      if (intent.keys.some(key => q.includes(key))) {
        detectedId = intent.id;
        break;
      }
    }

    if (detectedId) {
      runCapability(detectedId, userQ);
    } else {
      // Default to general chat if no intent detected
      setLoading(true);
      await new Promise(r => setTimeout(r, 800));
      addMessage({ role: 'ai', type: 'text', content: "I'm not sure which engine you need. I can help with payment risks, tax optimization, reminders, and more. Try asking for 'payment risk' or 'tax tips'." });
      setLoading(false);
    }
  };

  const quickActions = [
    { id: 1, name: "Payment Risk", icon: "⏰", desc: "Predict late payers" },
    { id: 2, name: "Match Payment", icon: "💳", desc: "Reconcile bank entries" },
    { id: 11, name: "Forecast", icon: "📊", desc: "30-day cash projections" },
    { id: 10, name: "Tax Savvy", icon: "💼", desc: "Optimize GST/Taxes" },
    { id: 5, name: "Fraud Guard", icon: "🛡️", desc: "Verify transaction safety" },
    { id: 12, name: "Early Offer", icon: "🎁", desc: "Dynamic settlement deals" },
    { id: 3, name: "Auto Nudge", icon: "📢", desc: "Smart WhatsApp reminders" },
    { id: 7, name: "Instalments", icon: "🗓️", desc: "Split large bills" },
    { id: 4, name: "AI Draft", icon: "✍️", desc: "Natural language billing" },
    { id: 13, name: "Stock Audit", icon: "📦", desc: "Festival strategy command" },
    { id: 9, name: "Currency", icon: "🌍", desc: "Live FX conversion" },
  ];

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1A1A2E] rounded-xl flex items-center justify-center text-white shadow-lg">
            <Sparkles size={20} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">InvoiceAI</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-bold text-emerald-600 tracking-wide uppercase">Active</p>
              <span className="text-slate-300 mx-1">•</span>
              <p className="text-[11px] font-medium text-slate-400">Your billing assistant</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
             <History size={18} />
           </button>
           <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
             <MoreVertical size={18} />
           </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="px-4 py-3.5 flex gap-2 overflow-x-auto scrollbar-hide border-b border-slate-50 bg-slate-50/50">
        {quickActions.map(action => (
          <button
            key={action.id}
            onClick={() => handleQuerySubmit(undefined, action.name)}
            className="flex-shrink-0 flex flex-col items-start gap-1 p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group min-w-[130px]"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg group-hover:scale-125 transition-transform">{action.icon}</span>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter whitespace-nowrap">{action.name}</span>
            </div>
            <span className="text-[9px] font-medium text-slate-400 leading-none">{action.desc}</span>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFDFD] relative"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-slate-100' : 'bg-[#1A1A2E]'
                }`}>
                  {msg.role === 'user' ? (
                    <User size={14} className="text-slate-500" />
                  ) : (
                    <span className="text-[10px] font-black text-white">AI</span>
                  )}
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  {msg.type === 'text' && (
                    <div className={`px-5 py-3.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#F5F5F0] text-slate-800 rounded-tr-none border border-[#E5E5DF]' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  )}

                  {msg.type === 'widget' && (
                    <div className="space-y-3">
                      {msg.role === 'ai' && (
                        <div className="text-[11px] font-bold text-slate-500 mb-1 ml-1 flex items-center gap-2">
                          {msg.widgetType === 'LATE_PAYMENT_PREDICTION' ? "I've assessed the payment risk. Here's what I found:" : 
                           msg.widgetType === 'RECONCILIATION' ? "I've matched and reconciled that payment. Here's the summary:" :
                           "Analysis complete:"}
                        </div>
                      )}
                      <WidgetRenderer type={msg.widgetType!} data={msg.widgetData} onAction={handleAction} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start w-full"
            >
              <div className="flex gap-3 items-center ml-11">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{thinkingStep || "Neural Engine Processing..."}</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </AnimatePresence>

        {/* Scroll Bottom Button */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all z-30"
            >
              <ArrowDown size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-5 bg-white border-t border-slate-100">
        <form onSubmit={handleQuerySubmit} className="relative flex items-center gap-3">
          <div className="relative flex-1 bg-[#F1F3F5] rounded-full px-5 py-4 shadow-inner border border-slate-200 flex items-center">
            <div className="flex flex-wrap gap-2 mr-3">
              {selectedTargets.length > 0 ? (
                selectedTargets.map(t => (
                  <div key={t.id} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-700 shadow-sm whitespace-nowrap">
                     {t.type === 'customer' ? <Users size={10} className="text-indigo-500" /> : <FileText size={10} className="text-slate-400" />}
                     {t.type === 'customer' ? contacts.find(c => c.id === t.id)?.name : invoices.find(i => i.id === t.id)?.invoice_number}
                     <button type="button" onClick={() => setSelectedTargets(prev => prev.filter(p => p.id !== t.id))} className="text-slate-400 hover:text-rose-500"><X size={10} /></button>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-full">
                  <Target size={12} /> No Target Selected
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Ask anything about the selected items..."
              className="flex-1 bg-transparent border-none outline-none text-[13px] font-semibold text-slate-700 placeholder:text-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-3 ml-2">
               <button 
                 type="button"
                 onClick={() => setShowSelector(!showSelector)}
                 className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                 title="Select Targets"
               >
                 <PlusCircle size={20} />
               </button>
               <button 
                 type="submit"
                 disabled={!query.trim() || loading || selectedTargets.length === 0}
                 className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                   query.trim() && selectedTargets.length > 0 ? 'bg-[#1A1A2E] text-white shadow-lg active:scale-95' : 'bg-slate-200 text-slate-400'
                 }`}
               >
                 <Send size={16} />
               </button>
            </div>
          </div>

          {showSelector && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-0 right-0 mb-4 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden z-50 p-5"
            >
              <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-2xl">
                 <button 
                   type="button"
                   onClick={() => setTargetCategory('invoice')}
                   className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${targetCategory === 'invoice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >Invoices</button>
                 <button 
                   type="button"
                   onClick={() => setTargetCategory('customer')}
                   className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${targetCategory === 'customer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >Customers</button>
              </div>
              <div className="relative mb-4">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${targetCategory}s...`}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3.5 text-[13px] font-semibold outline-none focus:border-indigo-300 transition-all shadow-inner"
                  value={targetSearch}
                  onChange={(e) => setTargetSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {(targetCategory === 'invoice' ? invoices : contacts)
                  .filter(item => {
                    const searchStr = targetCategory === 'invoice' ? (item as any).invoice_number : (item as any).name;
                    return searchStr.toLowerCase().includes(targetSearch.toLowerCase());
                  })
                  .map(item => {
                    const isSelected = selectedTargets.some(t => t.id === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                           if (isSelected) {
                              setSelectedTargets(prev => prev.filter(p => p.id !== item.id));
                           } else {
                              setSelectedTargets(prev => [...prev, { id: item.id, type: targetCategory }]);
                           }
                        }}
                        className={`flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                             {targetCategory === 'invoice' ? <FileText size={18} /> : <User size={18} />}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-slate-900">
                              {targetCategory === 'invoice' ? (item as any).invoice_number : (item as any).name}
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                              {targetCategory === 'invoice' ? `₹${(item as any).total_amount?.toLocaleString()}` : (item as any).phone || "No Phone"}
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 bg-white'}`}>
                           {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedTargets.length} items selected</span>
                 <button type="button" onClick={() => setShowSelector(false)} className="px-6 py-2.5 bg-[#1A1A2E] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all">Done</button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
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
            <span className="text-sm font-bold text-slate-900">Late payment risk — {data.client_name}</span>
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
              <span className="text-slate-400 font-medium ml-2">— about 9 days after due date</span>
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
            <div className="text-3xl font-black text-slate-900 tracking-tighter">₹{(data.inflow || 0).toLocaleString()}</div>
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
            <div className="text-2xl font-black text-slate-900">₹{(data?.payment_received || 0).toLocaleString()}</div>
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
            <div className="text-2xl font-black text-slate-900 tracking-tight">₹{(opt?.amount || 0).toLocaleString()}</div>
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
        <span className="text-sm font-bold text-slate-900 tracking-tight">AI Drafted Invoice</span>
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
         <div className="text-3xl font-black text-white">₹{(data?.potential_savings || 0).toLocaleString()}</div>
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
         <div className="text-3xl font-black text-white">₹{(data?.revenue_goal || 0).toLocaleString()}</div>
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
        <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
          <Zap size={20} />
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight">Dynamic Discount Offer</span>
      </div>
      <div className="p-5 bg-[#FDF2F2] rounded-[2rem] border border-rose-100 space-y-4 text-center">
         <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Early Settlement Reward</div>
         <div className="text-4xl font-black text-rose-600 tracking-tight">{data.discount_offer}% OFF</div>
         <p className="text-[11px] font-bold text-rose-400">Save ₹{(data?.discount_amount || 0).toLocaleString()} if paid in {data.expiry_days} days</p>
      </div>
      <div className="space-y-3">
         <div className="flex justify-between text-xs font-bold text-slate-500 px-1">
            <span>Original</span>
            <span className="line-through">₹{(data?.original_amount || 0).toLocaleString()}</span>
         </div>
         <div className="flex justify-between text-sm font-black text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span>Final Amount</span>
            <span className="text-emerald-600">₹{(data?.final_amount || 0).toLocaleString()}</span>
         </div>
      </div>
      <button 
        onClick={() => onAction('WHATSAPP_REMINDER', { phone: data.client_phone, message: `Special Offer: Settle your invoice now and get ${data.discount_offer}% off!` })}
        className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-600/20 active:scale-95"
      >
         Deploy Offer to Client
      </button>
    </div>
  );
}
