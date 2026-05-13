import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, HelpCircle, History, Search, Filter, 
  Check, Play, Zap, Clock, Rocket, Database, 
  BarChart3, Activity, Cpu, AlertCircle, X,
  MousePointer2, Target, Sparkles, BrainCircuit, Presentation, RefreshCw, Package
} from 'lucide-react';
import PresentationMode from './simulation/PresentationMode';
import { useGlobalData } from '../../context/DataContext';
import { dssService } from '../../services/dss/dssService';
import { useAuth } from '../../context/AuthContext';
import { Badge, ActionBtn as Button } from '../common/UI';

type Step = 'WORKSPACE' | 'SELECTION' | 'CONFIGURE' | 'LAUNCH';

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  costPrice: number;
  newPrice?: number;
  quantity?: number;
  discount?: number;
}

interface SimulationEngineProps {
  onComplete?: (data: any) => void;
  onBack?: () => void;
}

export default function SimulationEngine({ onComplete, onBack }: SimulationEngineProps) {
  const [currentStep, setCurrentStep] = useState<Step>('WORKSPACE');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisDepth, setAnalysisDepth] = useState<'quick' | 'full' | 'deep'>('full');
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [globalParams, setGlobalParams] = useState({
    horizon: 30,
    marketCondition: 'normal',
    competitorPrice: null
  });
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [showResultsBtn, setShowResultsBtn] = useState(false);
  const [ghostNumbers, setGhostNumbers] = useState<{ id: number, text: string, x: number, y: number }[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { products } = useGlobalData();
  const { business, user } = useAuth();

  const statusItems = [
    "Loading transaction history...",
    "Calculating price elasticity...",
    "Running demand forecasts...",
    "Analyzing market benchmarks...",
    "Running AI intelligence layer...",
    "Generating comparison report...",
    "Finalizing recommendations..."
  ];

  useEffect(() => {
    if (currentStep !== 'LAUNCH' || showResultsBtn) return;
    const interval = setInterval(() => {
      const examples = ["Rs.4,78,000", "-=0.42", "31 units", "87%", "Rs.1,240", "ROI: 14%"];
      const newGhost = {
        id: Date.now(),
        text: examples[Math.floor(Math.random() * examples.length)],
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20
      };
      setGhostNumbers(prev => [...prev.slice(-10), newGhost]);
    }, 400);
    return () => clearInterval(interval);
  }, [currentStep, showResultsBtn]);

  const handleToggleProduct = (product: any) => {
    if (selectedProductIds.includes(product.id)) {
      setSelectedProductIds(prev => prev.filter(id => id !== product.id));
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      setSelectedProductIds(prev => [...prev, product.id]);
      setSelectedProducts(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: product.selling_price || 0,
        stock: product.quantity || 0,
        costPrice: product.cost_price || (product.selling_price || 100) * 0.7,
        newPrice: product.selling_price,
        quantity: 10,
        discount: 0
      }]);
    }
  };

  const handleUpdateProductConfig = (id: string, updates: Partial<SelectedProduct>) => {
    setSelectedProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const runSimulationAction = async () => {
    if (!business?.id) return;

    setCurrentStep('LAUNCH');
    setProgress(0);
    setStatusIndex(0);
    setShowResultsBtn(false);
    
    const minDuration = 1000;
    const startTime = Date.now();

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const elapsed = Date.now() - startTime;
        return Math.min(100, (elapsed / minDuration) * 100);
      });
    }, 50);

    const statusTimer = setInterval(() => {
      setStatusIndex(prev => Math.min(statusItems.length - 1, prev + 1));
    }, minDuration / statusItems.length);

    try {
      const result = await dssService.runSimulation(
        business, 
        { ...globalParams, depth: analysisDepth },
        selectedProducts
      );
      setSimulationResult(result);
      setTimeout(() => {
        clearInterval(progressTimer);
        clearInterval(statusTimer);
        setProgress(100);
        setShowResultsBtn(true);
      }, 200);
    } catch (err) {
      setCurrentStep('CONFIGURE');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Neural Simulator</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">High-fidelity predictive modeling for pricing and inventory strategy.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
              Cancel
           </button>
           <button onClick={() => setShowHistory(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">
              History
           </button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center gap-6 py-4">
         {['SELECTION', 'CONFIGURE', 'LAUNCH'].map((s, i) => (
            <div key={s} className="flex items-center gap-4">
               <div className={`px-5 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all ${currentStep === s ? 'bg-white text-slate-900' : 'text-slate-600'}`}>
                  {i + 1}. {s}
               </div>
               {i < 2 && <div className="w-12 h-px bg-slate-800" />}
            </div>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {(currentStep === 'WORKSPACE' || currentStep === 'SELECTION') && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-4 bg-[#1E293B]/30 border border-slate-800 rounded-3xl p-6 flex flex-col space-y-6 h-[600px]">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    className="w-full bg-slate-900 border border-slate-800 pl-11 pr-4 py-3.5 rounded-xl text-xs font-bold tracking-tight outline-none focus:border-indigo-500 transition-all text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {filteredProducts.map((p: any) => (
                    <div 
                      key={p.id} 
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedProductIds.includes(p.id) ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'}`}
                      onClick={() => handleToggleProduct(p)}
                    >
                       <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-xs text-white truncate pr-2">{p.name}</h4>
                          {selectedProductIds.includes(p.id) && <Check size={14} className="text-indigo-400" />}
                       </div>
                       <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span>{p.quantity || 0} Stock</span>
                          <span className="text-indigo-400">Rs.{p.selling_price?.toLocaleString()}</span>
                       </div>
                    </div>
                  ))}
               </div>
               
               <button 
                 disabled={selectedProducts.length === 0}
                 className={`w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${selectedProducts.length === 0 ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20'}`}
                 onClick={() => setCurrentStep('CONFIGURE')}
               >
                 Next: Configure Model
               </button>
            </div>

            <div className="lg:col-span-8 bg-[#1E293B]/20 border border-slate-800 rounded-[2.5rem] p-10 flex items-center justify-center">
               {selectedProducts.length === 0 ? (
                 <div className="text-center space-y-4 opacity-40">
                    <MousePointer2 size={48} className="mx-auto" />
                    <p className="text-xs font-bold uppercase tracking-widest">Select products to begin</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
                    {selectedProducts.map(p => (
                       <div key={p.id} className="p-6 bg-slate-800/30 border border-slate-800 rounded-3xl relative group">
                          <button onClick={() => handleToggleProduct(p)} className="absolute top-3 right-3 text-slate-600 hover:text-white">
                             <X size={16} />
                          </button>
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-4">
                             <Target size={20} />
                          </div>
                          <h4 className="text-[11px] font-bold text-white text-center truncate px-2">{p.name}</h4>
                       </div>
                    ))}
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {currentStep === 'CONFIGURE' && (
          <motion.div 
            key="configure"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 space-y-4 h-[600px] overflow-y-auto pr-4">
               {selectedProducts.map((p) => (
                  <div key={p.id} className="bg-slate-800/20 border border-slate-800 rounded-3xl p-8 group transition-all hover:bg-slate-800/30">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <h4 className="text-lg font-bold text-white tracking-tight">{p.name}</h4>
                           <div className="flex gap-4 mt-1 text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                              <span>Base: Rs.{p.price}</span>
                              <span className="text-rose-400">Cost: Rs.{p.costPrice}</span>
                           </div>
                        </div>
                        <button onClick={() => handleToggleProduct(p)} className="text-slate-600 hover:text-rose-400 transition-colors">
                           <X size={18} />
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simulated Price</label>
                              <span className="text-sm font-bold text-indigo-400">Rs.{p.newPrice?.toLocaleString()}</span>
                           </div>
                           <input 
                              type="range" 
                              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                              min={p.price * 0.5} 
                              max={p.price * 1.5} 
                              value={p.newPrice}
                              onChange={(e) => handleUpdateProductConfig(p.id, { newPrice: Number(e.target.value) })}
                           />
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Projected Volume</label>
                           <div className="relative">
                              <input 
                                 type="number" 
                                 className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all" 
                                 value={p.quantity}
                                 onChange={(e) => handleUpdateProductConfig(p.id, { quantity: Number(e.target.value) })}
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-600 uppercase">UNITS</div>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="lg:col-span-4 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] p-8 space-y-8">
               <div className="flex items-center gap-3 text-indigo-400">
                  <BrainCircuit size={18} />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest">Global Parameters</h3>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Environment</label>
                  <div className="grid grid-cols-2 gap-2">
                     {['normal', 'festive', 'sale', 'recession'].map(m => (
                        <button 
                          key={m}
                          onClick={() => setGlobalParams(prev => ({ ...prev, marketCondition: m }))}
                          className={`py-3 rounded-xl border transition-all text-[9px] font-bold uppercase tracking-widest ${globalParams.marketCondition === m ? 'bg-white text-slate-900 border-white' : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                        >
                           {m}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="pt-6 border-t border-indigo-500/10 space-y-3">
                  <button onClick={runSimulationAction} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                     <Rocket size={16} />
                     Run Simulation
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {currentStep === 'LAUNCH' && (
          <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)] animate-pulse" />
             
             {ghostNumbers.map(gn => (
               <motion.div 
                 key={gn.id}
                 initial={{ opacity: 0, y: 0 }}
                 animate={{ opacity: [0, 0.4, 0], y: -80 }}
                 className="absolute text-[9px] font-bold text-indigo-500/40"
                 style={{ left: `${gn.x}%`, top: `${gn.y}%` }}
               >
                  {gn.text}
               </motion.div>
             ))}

             <div className="text-center relative z-10 max-w-sm w-full px-8">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-10 animate-spin-slow">
                   <RefreshCw size={32} />
                </div>
                
                <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] mb-4">Processing Matrix</h2>
                
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden mb-12">
                   <motion.div 
                     className="h-full bg-indigo-500 shadow-[0_0_15px_#6366f1]"
                     animate={{ width: `${progress}%` }}
                   />
                </div>

                <div className="space-y-3 text-left">
                   {statusItems.slice(statusIndex, statusIndex + 1).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-white justify-center">
                         <Activity size={12} className="text-indigo-400 animate-pulse" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item}</span>
                      </div>
                   ))}
                </div>

                {showResultsBtn && (
                   <motion.button 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     onClick={() => onComplete && onComplete(simulationResult)}
                     className="mt-12 w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-2xl border border-indigo-400"
                   >
                      Reveal Insights
                   </motion.button>
                )}
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
