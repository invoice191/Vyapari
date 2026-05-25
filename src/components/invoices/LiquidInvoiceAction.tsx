import React, { useState } from 'react';
import { Zap, Clock, ArrowRight, CheckCircle, Send, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { settlementEngine, SettlementOffer } from '../../services/settlementEngine';

interface LiquidInvoiceProps {
  invoiceId: string;
  totalAmount: number;
  onSuccess: () => void;
  onClose: () => void;
}

export const LiquidInvoiceAction: React.FC<LiquidInvoiceProps> = ({ 
  invoiceId, 
  totalAmount, 
  onSuccess, 
  onClose 
}) => {
  const [offer, setOffer] = useState<SettlementOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'init' | 'offer' | 'success'>('init');

  const generateOffer = async () => {
    setLoading(true);
    const newOffer = await settlementEngine.generateOffer(invoiceId);
    if (newOffer) {
      setOffer(newOffer);
      setStep('offer');
    }
    setLoading(false);
  };

  const finalizeOffer = async () => {
    setLoading(true);
    // In a real app, this would send the WhatsApp/Email offer first
    // For now, we simulate user "Finalizing" the broadcast
    setStep('success');
    setLoading(false);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1b23] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'init' && (
              <motion.div 
                key="init"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  <Zap className="w-10 h-10 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Liquidate Invoice</h2>
                  <p className="text-gray-400 mt-2">Generate a dynamic early-payment offer to unlock cash today.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-gray-500 text-sm block">Invoice Value</span>
                  <span className="text-2xl font-mono text-white font-bold">₹{totalAmount.toLocaleString()}</span>
                </div>
                <button
                  onClick={generateOffer}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20"
                >
                  {loading ? 'Analyzing Risks...' : 'Calculate Best Offer'}
                </button>
              </motion.div>
            )}

            {step === 'offer' && offer && (
              <motion.div 
                key="offer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-widest text-xs">
                  <Calculator className="w-4 h-4" />
                  Settlement Offer Ready
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <div className="bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded-lg">-{offer.discountPercent}%</div>
                  </div>
                  <span className="text-gray-400 text-sm">New Settlement Total</span>
                  <div className="text-4xl font-black text-white mt-1">₹{offer.newTotal.toLocaleString()}</div>
                  <div className="text-emerald-400 text-xs font-medium mt-2">Savings for customer: ₹{offer.discountAmount}</div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-400 text-sm">
                    <Clock className="w-4 h-4 text-orange-400" />
                    Offer expires in 48 hours
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 text-sm">
                    <Send className="w-4 h-4 text-indigo-400" />
                    Automated broadcast to customer
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={finalizeOffer}
                    className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    Activate & Send <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Offer Broadcasted!</h2>
                <p className="text-gray-400">The customer has been notified of the early-payment discount via WhatsApp.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
