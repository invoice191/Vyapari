import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, Tag, BarChart3, Landmark, TrendingUp, 
  Package, TrendingDown, FileText, Gift, Microscope, RefreshCw, AlertTriangle, Brain, ChevronRight, LayoutDashboard, Settings, Radar
} from 'lucide-react';
import DSSLanding from './DSSLanding';
import { HealthPanel } from './HealthPanel';
import { PricingEngine } from './engines/PricingEngine';
import { RFMEngine } from './engines/RFMEngine';
import { CashFlowEngine } from './engines/CashFlowEngine';
import { ChurnEngine } from './engines/ChurnEngine';
import { DeadStockEngine } from './engines/DeadStockEngine';
import { MarketEngine } from './engines/MarketEngine';
import { ForecastEngine } from './engines/ForecastEngine';
import { GSTEngine } from './engines/GSTEngine';
import { BundleEngine } from './engines/BundleEngine';
import { DiscountEngine } from './engines/DiscountEngine';
import { BankerEngine } from './engines/BankerEngine';
import { WarRoomEngine } from './engines/WarRoomEngine';
import { SimulationEngine } from './simulation/SimulationEngine';

const ENGINES = [
  { id: 'strategy', label: 'Neural Brief', icon: Brain, category: 'Intelligence' },
  { id: 'warroom', label: 'War Room', icon: Radar, category: 'Intelligence' },
  { id: 'pricing', label: 'Set Prices', icon: DollarSign, category: 'Financial' },
  { id: 'rfm', label: 'Best Customers', icon: Users, category: 'Customers' },
  { id: 'discount', label: 'Smart Offers', icon: Tag, category: 'Strategy' },
  { id: 'market', label: 'Market Trends', icon: BarChart3, category: 'Strategy' },
  { id: 'forecast', label: 'Future Sales', icon: TrendingUp, category: 'Financial' },
  { id: 'banker', label: 'Bank Readiness', icon: Landmark, category: 'Financial' },
  { id: 'churn', label: 'Customer Retention', icon: TrendingDown, category: 'Customers' },
  { id: 'deadstock', label: 'Dead Stock', icon: Package, category: 'Inventory' },
  { id: 'cashflow', label: 'Cash Flow', icon: Landmark, category: 'Financial' },
  { id: 'gst', label: 'GST Helper', icon: FileText, category: 'Financial' },
  { id: 'bundle', label: 'Product Bundles', icon: Gift, category: 'Strategy' },
  { id: 'simulation', label: 'What-If Simulation', icon: Microscope, category: 'Intelligence' },
];

export const DSSLayout: React.FC = () => {
  const [activeEngine, setActiveEngine] = useState('strategy');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderEngineContent = () => {
    switch (activeEngine) {
      case 'strategy': return <DSSLanding />;
      case 'pricing': return <PricingEngine />;
      case 'rfm': return <RFMEngine />;
      case 'cashflow': return <CashFlowEngine />;
      case 'churn': return <ChurnEngine />;
      case 'deadstock': return <DeadStockEngine />;
      case 'market': return <MarketEngine />;
      case 'forecast': return <ForecastEngine />;
      case 'gst': return <GSTEngine />;
      case 'bundle': return <BundleEngine />;
      case 'discount': return <DiscountEngine />;
      case 'banker': return <BankerEngine />;
      case 'warroom': return <WarRoomEngine />;
      case 'simulation': return <SimulationEngine />;
      default: return <DSSLanding />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar - Clean & Structured */}
      <aside 
        className={`
          ${isSidebarOpen ? 'w-72' : 'w-20'} 
          bg-[#1E293B]/50 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-50
        `}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Brain size={18} />
             </div>
             {isSidebarOpen && <span className="font-bold text-sm tracking-tight text-white uppercase">Intelligence</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-hide">
          {/* Grouped Navigation */}
          {['Intelligence', 'Financial', 'Customers', 'Inventory', 'Strategy'].map(category => (
             <div key={category} className="space-y-1">
                {isSidebarOpen && <h4 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{category}</h4>}
                {ENGINES.filter(e => e.category === category).map(engine => (
                   <button
                     key={engine.id}
                     onClick={() => setActiveEngine(engine.id)}
                     className={`
                       w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium
                       ${activeEngine === engine.id 
                         ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                         : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}
                     `}
                   >
                     <engine.icon size={18} className={activeEngine === engine.id ? 'text-indigo-400' : 'text-slate-500'} />
                     {isSidebarOpen && <span>{engine.label}</span>}
                     {activeEngine === engine.id && isSidebarOpen && <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" />}
                   </button>
                ))}
             </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
           >
              <LayoutDashboard size={18} className={isSidebarOpen ? 'rotate-180 transition-transform' : ''} />
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header - Unified */}
        <header className="h-16 bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800/50 px-8 flex items-center justify-between z-40 sticky top-0">
           <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">Intelligence Suite</span>
              <ChevronRight size={14} className="text-slate-700" />
              <span className="text-white text-sm font-bold tracking-tight">
                {ENGINES.find(e => e.id === activeEngine)?.label}
              </span>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Last Update</p>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Sync Active - Just Now</p>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                 <RefreshCw size={16} />
              </button>
           </div>
        </header>

        {/* Dynamic Content Scrollable */}
        <div className="flex-1 overflow-y-auto bg-[#0F172A] p-8 scrollbar-hide">
           <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
              {renderEngineContent()}
           </div>
        </div>
      </main>
    </div>
  );
};
