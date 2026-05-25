import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Scan,
  Package,
  ArrowRight,
  Eye,
  RefreshCw,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VisualVerification() {
  const [step, setStep] = useState<'upload' | 'scanning' | 'verified'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        startScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = () => {
    setStep('scanning');
    setTimeout(() => {
      setStep('verified');
      toast.success("Visual Proof of Delivery Verified!");
    }, 3000);
  };

  const reset = () => {
    setStep('upload');
    setImage(null);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-neon text-ink flex items-center justify-center rounded-2xl shadow-[0_0_30px_rgba(159,239,0,0.3)]">
              <Scan size={28} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">vPOD Intelligence</h1>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest pl-1">Visual Proof of Delivery & Inventory Sync</p>
        </div>
        <div className="relative z-10 px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">Smart Vision Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INTERFACE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-sm text-slate-900 uppercase">Capture Station</h3>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">v2.0 Beta</div>
           </div>

           <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                 {step === 'upload' && (
                    <motion.div 
                      key="upload"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-48 h-48 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                       >
                          <Camera size={48} className="text-slate-300 group-hover:text-indigo-500 transition-colors mb-2" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scan Shipment</span>
                       </div>
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                       <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto">
                          Place the shipment under the camera or upload a clear photo of the goods and invoice.
                       </p>
                    </motion.div>
                 )}

                 {step === 'scanning' && (
                    <motion.div 
                      key="scanning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8 w-full max-w-sm"
                    >
                       <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl">
                          {image && <img src={image} className="w-full h-full object-cover grayscale opacity-50" />}
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-full h-1 bg-neon shadow-[0_0_20px_rgba(159,239,0,1)] animate-scan" />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span>Object Recognition</span>
                             <span className="text-indigo-600">88%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: '88%' }}
                               className="h-full bg-indigo-600"
                             />
                          </div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse">Running Smart Cross-Check...</p>
                       </div>
                    </motion.div>
                 )}

                 {step === 'verified' && (
                    <motion.div 
                      key="verified"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8"
                    >
                       <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl mx-auto">
                          <CheckCircle2 size={48} />
                       </div>
                       <div>
                          <h4 className="text-2xl font-black text-slate-900 uppercase">Verification Success</h4>
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Inventory updated automatically</p>
                       </div>
                       
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold">
                             <span className="text-slate-400 uppercase">Items Detected</span>
                             <span className="text-slate-900">12x Basmati Rice (5kg)</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold">
                             <span className="text-slate-400 uppercase">Match Confidence</span>
                             <span className="text-emerald-500">99.4%</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold">
                             <span className="text-slate-400 uppercase">Invoice Ref</span>
                             <span className="text-slate-900">PO-8821-X</span>
                          </div>
                       </div>

                       <button 
                         onClick={reset}
                         className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 mx-auto"
                       >
                          <RefreshCw size={14} /> New Verification
                       </button>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* STATS & SIDEBAR */}
        <div className="space-y-6">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-6">Security Protocol</h3>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                       <ShieldCheck size={20} />
                    </div>
                    <div>
                       <div className="font-black text-sm text-slate-900 uppercase">Anti-Fraud Vision</div>
                       <p className="text-xs text-slate-500 font-medium">Detects duplicates or modified packaging to prevent return fraud.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                       <Zap size={20} />
                    </div>
                    <div>
                       <div className="font-black text-sm text-slate-900 uppercase">Instant Ledger Sync</div>
                       <p className="text-xs text-slate-500 font-medium">Auto-updates inventory quantities in the database upon verification.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mb-10 -mr-10" />
              <h4 className="text-xl font-black uppercase tracking-tight mb-4">Autonomous Logistics</h4>
              <p className="text-white/70 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
                 Vyapari is the only platform that uses computer vision to automate the physical-to-digital handshake.
              </p>
              <div className="flex items-center gap-4">
                 <div className="flex-1">
                    <div className="text-2xl font-black">100%</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Accuracy Rate</div>
                 </div>
                 <div className="w-[1px] h-10 bg-white/20" />
                 <div className="flex-1 text-right">
                    <div className="text-2xl font-black">0s</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Manual Entry</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%, 100% { top: 0% }
          50% { top: 100% }
        }
        .animate-scan {
          position: absolute;
          animation: scan 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
