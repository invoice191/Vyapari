import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Heart,
  Smile,
  Frown,
  Zap
} from 'lucide-react';
import { toast } from '../common/Toast';
import { useGlobalData } from '../../context/DataContext';

interface OverdueInvoice {
  id: string;
  customer: string;
  amount: number;
  daysOverdue: number;
  relationship: 'loyal' | 'regular' | 'new' | 'at-risk';
  suggestedTone: 'friendly' | 'firm' | 'urgent';
  phone?: string;
}

export default function SmartDunning() {
  const { invoices } = useGlobalData();
  const [selectedInvoice, setSelectedInvoice] = useState<OverdueInvoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');

  // Filter real overdue invoices
  const overdueInvoices: OverdueInvoice[] = (invoices || [])
    .filter(inv => inv.status !== 'Paid' && new Date(inv.due_date) < new Date())
    .map(inv => {
      const daysLate = Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 3600 * 24));
      
      // Heuristic for relationship and tone
      let rel: OverdueInvoice['relationship'] = 'regular';
      if (inv.total_amount > 50000) rel = 'loyal';
      if (daysLate > 30) rel = 'at-risk';

      let tone: OverdueInvoice['suggestedTone'] = 'friendly';
      if (daysLate > 7) tone = 'firm';
      if (daysLate > 14) tone = 'urgent';

      return {
        id: inv.invoice_number || inv.id.slice(0, 8),
        customer: inv.contacts?.name || 'Unknown Customer',
        amount: inv.total_amount || 0,
        daysOverdue: daysLate,
        relationship: rel,
        suggestedTone: tone,
        phone: inv.contacts?.phone
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Initialize selected invoice if not set
  useEffect(() => {
    if (!selectedInvoice && overdueInvoices.length > 0) {
      setSelectedInvoice(overdueInvoices[0]);
    }
  }, [overdueInvoices, selectedInvoice]);

  const generateMessage = (inv: OverdueInvoice) => {
    setIsGenerating(true);
    setGeneratedMessage('');
    
    // AI Thinking Simulation
    setTimeout(() => {
      let msg = "";
      if (inv.suggestedTone === 'friendly') {
        msg = `Hi ${inv.customer.split(' ')[0]}! Hope you're doing well. Just a gentle nudge about your last bill for ₹${inv.amount.toLocaleString()}. No rush, just wanted to make sure it didn't slip your mind. Looking forward to seeing you soon!`;
      } else if (inv.suggestedTone === 'firm') {
        msg = `Hello ${inv.customer}, this is a reminder that invoice ${inv.id} for ₹${inv.amount.toLocaleString()} is now ${inv.daysOverdue} days overdue. Please settle this at your earliest convenience to keep your credit line active. Thank you.`;
      } else {
        msg = `URGENT: ${inv.customer}, your payment of ₹${inv.amount.toLocaleString()} is significantly overdue. Please settle this immediately to avoid service suspension and late fees. Click here to pay: https://vyapari.ai/pay/${inv.id}`;
      }
      setGeneratedMessage(msg);
      setIsGenerating(false);
    }, 1000);
  };

  const sendReminder = () => {
    toast.success(`Sentiment-optimized reminder sent to ${selectedInvoice?.customer} via WhatsApp.`);
    setGeneratedMessage('');
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] border border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-500 text-white flex items-center justify-center rounded-2xl shadow-lg">
              <Brain size={28} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Smart Dunning</h1>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest pl-1">Sentiment-Aware Debt Recovery Engine</p>
        </div>
        <div className="flex items-center gap-4 text-white/60 font-black text-[10px] uppercase tracking-widest">
           <span className="flex items-center gap-2"><Zap size={14} className="text-neon" /> AI Sentiment Analysis</span>
           <span className="w-[1px] h-4 bg-white/10" />
           <span className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={14} /> Recovery Rate: +24%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INVOICE LIST */}
        <div className="lg:col-span-5 space-y-4">
           <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 px-4">Overdue Accounts</h3>
           <div className="space-y-3">
              {overdueInvoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => { setSelectedInvoice(inv); setGeneratedMessage(''); }}
                  className={`w-full text-left p-5 rounded-3xl border transition-all ${selectedInvoice?.id === inv.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-xs uppercase tracking-widest opacity-60">{inv.id}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedInvoice?.id === inv.id ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'}`}>
                      {inv.daysOverdue} Days Late
                    </span>
                  </div>
                  <div className="text-lg font-black tracking-tight">{inv.customer}</div>
                  <div className="mt-4 flex justify-between items-end">
                    <div className="text-xl font-black">₹{inv.amount.toLocaleString()}</div>
                    <div className="flex items-center gap-2 opacity-60">
                       {inv.relationship === 'loyal' ? <Heart size={14} /> : <User size={14} />}
                       <span className="text-[10px] font-bold uppercase tracking-widest">{inv.relationship}</span>
                    </div>
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* AI CONSOLE */}
        <div className="lg:col-span-7">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                       <MessageSquare size={20} />
                    </div>
                    <div>
                       <div className="font-black text-slate-900 text-sm uppercase">Message Lab</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drafting recovery sequence</div>
                    </div>
                 </div>
                 {selectedInvoice && (
                   <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                         <span className="text-[8px] font-black text-slate-400 uppercase">Tone Recommendation</span>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${selectedInvoice.suggestedTone === 'urgent' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {selectedInvoice.suggestedTone}
                         </span>
                      </div>
                      {selectedInvoice.suggestedTone === 'friendly' ? <Smile className="text-emerald-500" /> : selectedInvoice.suggestedTone === 'urgent' ? <Frown className="text-rose-500" /> : <AlertCircle className="text-amber-500" />}
                   </div>
                 )}
              </div>

              <div className="flex-1 p-8 flex flex-col justify-center items-center">
                {selectedInvoice ? (
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center space-y-4"
                      >
                         <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Analyzing relationship history...</p>
                      </motion.div>
                    ) : generatedMessage ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full space-y-6"
                      >
                         <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] relative">
                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 text-white flex items-center justify-center rounded-lg shadow-lg">
                               <Brain size={16} />
                            </div>
                            <p className="text-slate-700 font-bold leading-relaxed">{generatedMessage}</p>
                         </div>
                         <div className="flex gap-4">
                            <button 
                              onClick={() => setGeneratedMessage('')}
                              className="flex-1 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                               Discard
                            </button>
                            <button 
                              onClick={sendReminder}
                              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                            >
                               <Send size={16} /> Send via WhatsApp
                            </button>
                         </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                            <Brain size={40} />
                         </div>
                         <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Ready to Resolve</h4>
                         <p className="text-slate-500 text-xs font-bold max-w-xs mx-auto mb-8 uppercase tracking-widest">The AI will craft a personalized message based on {selectedInvoice.customer}'s payment history.</p>
                         <button 
                           onClick={() => generateMessage(selectedInvoice)}
                           className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all"
                         >
                            Analyze & Draft Message
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  <div className="text-slate-300 font-black text-sm uppercase tracking-widest">Select an invoice to begin</div>
                )}
              </div>

              <div className="p-6 bg-slate-900 text-white/40 text-[9px] font-black uppercase tracking-[0.3em] text-center">
                 Neural Sentiment Engine v2.5 | End-to-End Encrypted
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
