import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, ShieldCheck, X } from "lucide-react";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title?: string;
  description?: string;
}

export const PinModal = ({ isOpen, onClose, onConfirm, title = "Confirm Identity", description = "Enter your Owner PIN to authorize this sensitive action." }: PinModalProps) => {
  const [pin, setPin] = useState("");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-neon/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center text-neon mb-8">
              <Lock size={32} />
            </div>
            
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{title}</h2>
            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-10">{description}</p>

            <div className="w-full space-y-8">
              <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                      pin.length > i ? 'bg-slate-900 border-slate-900 scale-125' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === "C") setPin("");
                      else if (btn === "OK") {
                        if (pin.length === 4) onConfirm(pin);
                      }
                      else if (pin.length < 4) setPin(p => p + btn);
                    }}
                    className={`h-20 rounded-2xl font-black text-xl flex items-center justify-center transition-all ${
                      btn === "OK" 
                        ? 'bg-neon text-white shadow-lg shadow-neon/30' 
                        : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
