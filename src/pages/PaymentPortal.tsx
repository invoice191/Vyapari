import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { stripeService } from "../services/stripeService";
import { razorpayService } from "../services/razorpayService";
import { 
  CheckCircle2, 
  Smartphone, 
  CreditCard, 
  ShieldCheck, 
  Download, 
  ArrowLeft, 
  Store, 
  AlertTriangle,
  QrCode,
  Loader2,
  Receipt
} from "lucide-react";
import { motion } from "motion/react";
import { useToast } from "../components/common/Toast";

export default function PaymentPortal() {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<"pending" | "processing" | "success">("pending");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [txId, setTxId] = useState<string>("");
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const invoiceNum = searchParams.get("inv");

  useEffect(() => {
    async function fetchInvoice() {
      if (!invoiceNum) {
        setError("Invalid Payment Link. No invoice specified.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchErr } = await supabase
          .from("invoices")
          .select("*, contacts(*), businesses(*)")
          .eq("invoice_number", invoiceNum)
          .single();

        if (fetchErr || !data) {
          setError("Invoice not found in system directory.");
        } else {
          setInvoice(data);
          if (data.status === "paid") {
            setPaymentStep("success");
            setTxId("tx_prepaid_db_sync");
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to retrieve payment details.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceNum]);

  const handlePayStripe = async () => {
    if (!invoice) return;
    setPaymentStep("processing");
    setPaymentMethod("Stripe");
    
    const success = await stripeService.payInvoice({
      invoiceId: invoice.id,
      amount: invoice.total_amount,
      customerName: invoice.contacts?.name || "Customer",
      customerPhone: invoice.contacts?.phone,
      customerEmail: invoice.contacts?.email
    }, (id) => {
      setTxId(id);
      setPaymentStep("success");
    }, () => {
      setPaymentStep("pending");
    });

    if (!success) {
      toast("Failed to initialize Stripe checkout.", "error");
      setPaymentStep("pending");
    }
  };

  const handlePayRazorpay = async () => {
    if (!invoice) return;
    setPaymentStep("processing");
    setPaymentMethod("Razorpay");

    const success = await razorpayService.payInvoice({
      invoiceId: invoice.id,
      amount: invoice.total_amount,
      customerName: invoice.contacts?.name || "Customer",
      customerPhone: invoice.contacts?.phone,
      customerEmail: invoice.contacts?.email
    }, (id) => {
      setTxId(id);
      setPaymentStep("success");
    }, () => {
      setPaymentStep("pending");
    });

    if (!success) {
      toast("Failed to initialize Razorpay checkout.", "error");
      setPaymentStep("pending");
    }
  };

  const handleSimulateUPISuccess = async () => {
    if (!invoice) return;
    setPaymentStep("processing");
    setPaymentMethod("UPI Instant");

    setTimeout(async () => {
      try {
        const { error: updateErr } = await supabase
          .from("invoices")
          .update({ status: "paid" })
          .eq("id", invoice.id);

        if (updateErr) throw updateErr;

        setTxId(`upi_ref_${Math.floor(1000000000 + Math.random() * 9000000000)}`);
        setPaymentStep("success");
      } catch (err) {
        console.error("UPI update failed", err);
        setPaymentStep("pending");
      }
    }, 1500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-neon mb-4 h-12 w-12" />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">Loading Secure Payment Gateway...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
        <div className="glass-card max-w-md w-full !p-12 text-center space-y-6 border border-red-500/20">
          <AlertTriangle className="mx-auto text-red-500 h-14 w-14" />
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">Payment Session Error</h2>
          <p className="text-slate-400 font-bold text-sm leading-relaxed">{error || "Something went wrong."}</p>
          <a 
            href="/signin" 
            className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-slate-300"
          >
            <ArrowLeft size={14} /> Back to Portal
          </a>
        </div>
      </div>
    );
  }

  const businessName = invoice.businesses?.name || "Vyapari Partner";
  const upiId = invoice.businesses?.settings?.upiId || "prajwaltraders@upi";
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${invoice.total_amount}&tn=Invoice%20${invoice.invoice_number}`;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f172a&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Glow Rings */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10">
        {/* Portal Header */}
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-neon">
              <Store size={20} />
            </div>
            <div>
              <h1 className="font-black text-sm uppercase tracking-wider text-white">{businessName}</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Invoice Checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 font-black text-[9px] uppercase tracking-widest">
            <ShieldCheck size={12} /> SECURE GATEWAY
          </div>
        </div>

        {paymentStep === "pending" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Invoice Breakdown Card */}
            <div className="glass-card !p-8 sm:!p-10 border border-slate-800 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500/10 border-b border-l border-amber-500/20 px-6 py-2 rounded-bl-2xl text-amber-400 font-black text-[10px] uppercase tracking-widest">
                Overdue Payment
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Invoice Reference</span>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{invoice.invoice_number}</h2>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-800">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Customer Details</span>
                  <p className="font-black text-sm text-slate-200">{invoice.contacts?.name || "Premium Customer"}</p>
                  <p className="font-bold text-[11px] text-slate-400 mt-0.5">{invoice.contacts?.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Issue Date</span>
                  <p className="font-black text-sm text-slate-200">{new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Outstanding Balance</span>
                  <span className="text-sm font-bold text-slate-400 mt-1 block">GST Included</span>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black tracking-tight text-white">Rs.{invoice.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic UPI QR Code */}
              <div className="glass-card !p-8 border border-slate-800 bg-slate-900/40 text-center flex flex-col justify-between items-center">
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <Smartphone size={16} className="text-neon" />
                    <h3 className="font-black text-xs uppercase tracking-wider text-white">Scan & Pay via UPI</h3>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instant settlement on any UPI app</p>
                </div>

                <div className="bg-white p-4 rounded-3xl mb-4 border border-slate-800 shadow-xl">
                  <img src={qrImage} alt="UPI Payment QR Code" className="w-40 h-40" />
                </div>

                <button 
                  onClick={handleSimulateUPISuccess}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl shadow-lg transition-all hover:scale-[1.01]"
                >
                  -- SIMULATE UPI SUCCESS
                </button>
              </div>

              {/* Stripe / Razorpay Gateways */}
              <div className="glass-card !p-8 border border-slate-800 bg-slate-900/40 flex flex-col justify-between space-y-6">
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <CreditCard size={16} className="text-neon" />
                    <h3 className="font-black text-xs uppercase tracking-wider text-white">International / Cards</h3>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pay securely with Credit/Debit cards</p>
                </div>

                <div className="space-y-4 w-full">
                  <button 
                    onClick={handlePayStripe}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    -- Pay via Stripe (Visa/Master)
                  </button>
                  
                  <button 
                    onClick={handlePayRazorpay}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 border-2 border-indigo-500/30 text-indigo-400 hover:text-white font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    -- Pay via Razorpay (India Card/Net)
                  </button>
                </div>

                <div className="text-center md:text-left">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    By proceeding, you agree to secure transaction guidelines and billing terms.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {paymentStep === "processing" && (
          <div className="glass-card !p-12 text-center space-y-6 border border-slate-800 flex flex-col items-center justify-center py-20 bg-slate-900/60 backdrop-blur-xl">
            <Loader2 className="animate-spin text-indigo-500 h-16 w-16 mb-4" />
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Verifying Transaction</h3>
            <p className="text-slate-400 font-bold text-sm max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
              Communicating with {paymentMethod || "gateway"} API endpoints and securing ledger sync. Please do not close this tab.
            </p>
          </div>
        )}

        {paymentStep === "success" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Receipt / Invoice Printout Block */}
            <div className="glass-card !p-8 sm:!p-12 border border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden print:bg-white print:text-black print:p-0 print:border-0 print:shadow-none">
              {/* Confetti Glow */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none print:hidden"></div>
              
              <div className="text-center space-y-4 mb-8 pb-8 border-b border-slate-800 print:border-black print:mb-6 print:pb-6">
                <CheckCircle2 className="mx-auto text-emerald-400 h-16 w-16 print:text-black" />
                <div className="space-y-1">
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-white print:text-black">Payment Successful</h3>
                  <p className="text-[10px] font-black text-emerald-400 print:text-black uppercase tracking-[0.2em]">Transaction Verified & Database Synced</p>
                </div>
              </div>

              {/* Billing Breakdown */}
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 print:text-black uppercase tracking-widest block">Issued By</span>
                    <h4 className="font-black text-lg text-white print:text-black mt-1">{businessName}</h4>
                    <p className="text-[11px] text-slate-400 print:text-black">{invoice.businesses?.email || "billing@vyapari.com"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 print:text-black uppercase tracking-widest block">Receipt Ref</span>
                    <p className="font-black text-sm text-slate-300 print:text-black mt-1">{invoice.invoice_number}</p>
                    <p className="text-[11px] text-slate-400 print:text-black mt-0.5">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="bg-slate-950/50 print:bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-800/60 print:border-black">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 print:text-black uppercase tracking-widest">Transaction Ref</span>
                    <span className="font-mono text-xs text-slate-200 print:text-black uppercase tracking-wider">{txId || "tx_direct_ledger_sync"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 print:text-black uppercase tracking-widest">Gateway</span>
                    <span className="font-black text-xs text-slate-200 print:text-black uppercase tracking-widest">{paymentMethod || "Digital Balance Sync"}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-slate-800/60 print:border-black">
                    <span className="text-[10px] font-black text-slate-400 print:text-black uppercase tracking-widest">Total Amount Paid</span>
                    <span className="font-black text-lg text-emerald-400 print:text-black">Rs.{invoice.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Printing footer */}
              <div className="hidden print:block text-center mt-12 pt-8 border-t border-slate-200 text-[10px] font-bold uppercase tracking-widest">
                Thank you for your business. Generated by Vyapari ERP.
              </div>
            </div>

            {/* Success Actions */}
            <div className="flex flex-col sm:flex-row gap-4 print:hidden">
              <button 
                onClick={handlePrintReceipt}
                className="flex-1 py-4.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
              >
                <Download size={14} className="text-neon" /> Print Online Receipt
              </button>
              
              <a 
                href="/signin"
                className="flex-1 py-4.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
              >
                <Receipt size={14} /> Open Vyapari Portal
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
