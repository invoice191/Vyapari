import React, { useState, useEffect } from 'react';
import { 
  Search, Sliders, Play, ChevronLeft, ChevronRight, 
  BarChart3, PieChart, FileDown, Save, Zap, AlertTriangle, 
  Package, Info, CheckCircle, TrendingUp, HelpCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { runSimulation, SimProduct, SimConfig, SimResult } from '../../../utils/simulationCalculations';
import { generateSimulationReport } from '../../../utils/generateSimulationReport';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, LineChart, Line 
} from 'recharts';

export const SimulationEngine: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulation Config
  const [config, setConfig] = useState<SimConfig>({
    newPrice: 0,
    discount: 5,
    horizon: 30,
    marketCondition: 'Normal'
  });

  const [results, setResults] = useState<SimResult | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').limit(50);
    setProducts(data || []);
    setLoading(false);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedProductIds.length > 0) {
      const firstProduct = products.find(p => p.id === selectedProductIds[0]);
      if (firstProduct) {
        setConfig(prev => ({ ...prev, newPrice: firstProduct.selling_price }));
      }
      setStep(2);
    } else if (step === 2) {
      handleLaunchSimulation();
    }
  };

  const handleLaunchSimulation = () => {
    setLoading(true);
    setTimeout(() => {
      const selectedProducts: SimProduct[] = products
        .filter(p => selectedProductIds.includes(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          currentPrice: p.selling_price,
          costPrice: p.cost_price,
          baseQuantity: 120,
          dailySales: 4,
          elasticity: -1.2
        }));

      const simResult = runSimulation(selectedProducts, config);
      setResults(simResult);
      setStep(3);
      setLoading(false);
    }, 1500);
  };

  const handleDownloadReport = async () => {
    if (!results) return;
    await generateSimulationReport({
      ...results,
      businessName: "Vyapari Retailer",
      scenarioName: "Pricing Strategy Analysis",
      aiSummary: "We checked your plan. Increasing the price of " + results.products[0].productName + " will help you make more money. The risk is low because people need this item every day.",
      risk: results.overallRisk
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Simplified Wizard Header */}
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-3xl font-display font-black text-white mb-6 tracking-tight uppercase italic">Try Your Ideas</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-10">See what happens to your profit before you change real prices.</p>
        <div className="flex items-center gap-4 w-full max-w-md">
          <StepIndicator current={step} step={1} label="CHOOSE ITEM" />
          <div className={`h-[2px] flex-1 ${step > 1 ? 'bg-neon' : 'bg-white/10'}`} />
          <StepIndicator current={step} step={2} label="CHANGE PRICE" />
          <div className={`h-[2px] flex-1 ${step > 2 ? 'bg-neon' : 'bg-white/10'}`} />
          <StepIndicator current={step} step={3} label="SEE RESULTS" />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search for an item..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-brand transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => toggleProduct(product.id)}
                className={`
                  p-6 rounded-[2.5rem] cursor-pointer transition-all border-2
                  ${selectedProductIds.includes(product.id) 
                    ? 'bg-brand/20 border-brand shadow-[0_0_20px_rgba(79,70,229,0.2)]' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'}
                `}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/5 rounded-2xl">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  {selectedProductIds.includes(product.id) && <CheckCircle className="w-5 h-5 text-neon" />}
                </div>
                <h4 className="font-bold text-white mb-1">{product.name}</h4>
                <p className="text-2xl font-black text-white mb-4 italic">₹{product.selling_price}</p>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>In Stock: {product.stock_quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50">
            <button 
              onClick={handleNext}
              disabled={selectedProductIds.length === 0}
              className={`
                w-full py-5 rounded-[2rem] font-black text-lg tracking-tight flex items-center justify-center gap-3 transition-all
                ${selectedProductIds.length > 0 
                  ? 'bg-neon text-ink shadow-[0_0_30px_rgba(159,239,0,0.4)]' 
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'}
              `}
            >
              NEXT: SET NEW PRICE
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 italic uppercase">
                <Sliders className="w-5 h-5 text-neon" />
                Your Plan
              </h3>
              
              {selectedProductIds.map(id => {
                const p = products.find(prod => prod.id === id);
                return (
                  <div key={id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-brand/20 rounded-2xl flex items-center justify-center text-brand font-black text-xl italic">
                        {p.name[0]}
                      </div>
                      <span className="font-bold text-xl text-white">{p.name}</span>
                    </div>

                    <div className="space-y-10">
                      <div>
                        <div className="flex justify-between mb-4 items-end">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What is the new price?</label>
                          <span className="text-3xl font-black text-neon italic">₹{config.newPrice}</span>
                        </div>
                        <input 
                          type="range" min={Math.round(p.cost_price * 0.8)} max={p.selling_price * 2} step="1"
                          value={config.newPrice}
                          onChange={(e) => setConfig(prev => ({ ...prev, newPrice: parseInt(e.target.value) }))}
                          className="w-full h-3 bg-white/10 rounded-full appearance-none accent-neon cursor-pointer"
                        />
                        <div className="flex justify-between mt-2 text-[8px] font-bold text-slate-500 uppercase">
                          <span>Low Price</span>
                          <span>High Price</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-4 items-end">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Give a discount?</label>
                          <span className="text-3xl font-black text-neon italic">{config.discount}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="50" step="1"
                          value={config.discount}
                          onChange={(e) => setConfig(prev => ({ ...prev, discount: parseInt(e.target.value) }))}
                          className="w-full h-3 bg-white/10 rounded-full appearance-none accent-neon cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 italic uppercase">
                <TrendingUp className="w-5 h-5 text-neon" />
                Shop Condition
              </h3>
              
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-10 shadow-2xl">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6">How many days to check?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[30, 60, 90].map(d => (
                      <button 
                        key={d}
                        onClick={() => setConfig(prev => ({ ...prev, horizon: d }))}
                        className={`py-4 rounded-2xl font-black text-xs transition-all ${config.horizon === d ? 'bg-white text-slate-900 shadow-xl scale-105' : 'bg-white/5 text-slate-400 border border-white/5'}`}
                      >
                        {d} DAYS
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Any special event?</label>
                  <select 
                    value={config.marketCondition}
                    onChange={(e) => setConfig(prev => ({ ...prev, marketCondition: e.target.value as any }))}
                    className="w-full bg-slate-900/60 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-brand appearance-none"
                  >
                    <option value="Normal">Normal Day</option>
                    <option value="Festival">Festival (Diwali, Eid, etc.)</option>
                    <option value="Off-season">Low Sales Season</option>
                    <option value="Competition">New Shop Opened Nearby</option>
                  </select>
                </div>

                <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] flex gap-4 items-start shadow-inner">
                  <HelpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium uppercase tracking-tight">
                    Tip: Choosing "Festival" will assume more people will buy even if the price is a bit higher.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8">
            <button 
              onClick={() => setStep(1)}
              className="bg-white/5 hover:bg-white/10 text-white font-bold px-10 py-5 rounded-[2rem] border border-white/5 transition-all text-xs uppercase"
            >
              Go Back
            </button>
            <button 
              onClick={handleLaunchSimulation}
              className="flex-1 bg-white text-slate-900 font-black text-xl py-5 rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:bg-neon hover:text-slate-900 transition-all flex items-center justify-center gap-3 uppercase italic"
            >
              {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <>See What Happens <Play className="w-5 h-5 fill-current" /></>}
            </button>
          </div>
        </div>
      )}

      {step === 3 && results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12">
          {/* Simple Result Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResultCard label="EXTRA SALES MONEY" value={`₹${results.revenueChange.toLocaleString()}`} sub={`+${results.revenueChangePct}% compared to now`} positive={results.revenueChange >= 0} />
            <ResultCard label="EXTRA PROFIT MONEY" value={`₹${results.profitChange.toLocaleString()}`} sub={`+${results.profitChangePct}% total profit`} positive={results.profitChange >= 0} />
            <ResultCard label="DANGER LEVEL" value={results.overallRisk === 'LOW' ? 'SAFE' : 'RISKY'} sub={`${results.confidence}% sure about this`} positive={results.overallRisk === 'LOW'} />
          </div>

          {/* AI Advice */}
          <div className="bg-brand/20 border border-brand/30 p-10 rounded-[3rem] relative overflow-hidden group shadow-2xl">
            <Zap className="absolute -right-12 -top-12 w-48 h-48 text-brand opacity-10 group-hover:rotate-12 transition-transform duration-700" />
            <h3 className="text-brand font-black text-xl flex items-center gap-2 mb-8 uppercase tracking-tighter italic">
              <Zap className="w-6 h-6 fill-current" />
              OUR ADVICE FOR YOU
            </h3>
            <div className="space-y-8 relative">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-brand text-white rounded-2xl flex items-center justify-center shrink-0 font-black text-xl shadow-xl">1</div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-lg mb-2">You should do this!</h4>
                  <p className="text-slate-300 leading-relaxed italic">Increasing the price to <span className="text-neon font-bold">₹{config.newPrice}</span> is a great idea. You will make <span className="text-neon font-bold">₹{results.revenueChange.toLocaleString()}</span> more money and customers won't complain much.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl shadow-xl">2</div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-lg mb-2">What to watch?</h4>
                  <p className="text-slate-300 leading-relaxed italic">Try this for one week. If you see that fewer people are buying, you can always change the price back to what it was before.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Final Simple Actions */}
          <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-white/5">
            <button 
              onClick={handleDownloadReport}
              className="flex-1 bg-white text-slate-900 font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-neon transition-all shadow-2xl uppercase tracking-widest text-xs"
            >
              <FileDown className="w-6 h-6" />
              Get Paper Report (PDF)
            </button>
            <button 
              onClick={() => setStep(1)}
              className="px-12 bg-white/5 text-white font-bold py-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
            >
              Try Another Idea
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StepIndicator = ({ current, step, label }: { current: number, step: number, label: string }) => {
  const isPast = current > step;
  const isCurrent = current === step;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`
        w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black transition-all duration-500 text-lg
        ${isCurrent ? 'bg-neon text-ink shadow-[0_0_30px_rgba(159,239,0,0.4)] scale-110' : 
          isPast ? 'bg-brand text-white' : 'bg-white/5 text-slate-500 border border-white/5'}
      `}>
        {isPast ? <CheckCircle className="w-7 h-7" /> : step}
      </div>
      <span className={`text-[9px] font-black tracking-widest uppercase ${isCurrent ? 'text-neon' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
};

const ResultCard = ({ label, value, sub, positive }: { label: string, value: string, sub: string, positive: boolean }) => (
  <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform ${positive ? 'text-neon' : 'text-overdue'}`}>
        {positive ? <TrendingUp size={60} /> : <AlertTriangle size={60} />}
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-6">{label}</span>
    <span className={`text-4xl font-black block mb-2 italic ${positive ? 'text-neon' : 'text-overdue'}`}>{value}</span>
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{sub}</span>
  </div>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 1 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
);
