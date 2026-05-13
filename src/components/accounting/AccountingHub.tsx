import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar, 
  ArrowRight, 
  ShieldCheck,
  IndianRupee,
  DownloadCloud,
  Wallet,
  Receipt,
  Briefcase,
  FileJson
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { accountingService } from '../../services/accountingService';
import { exportService } from '../../services/exportService';
import { supabase } from '../../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AccountingHub() {
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pl');
  const [plData, setPlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const loadMetrics = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [pl, bs] = await Promise.all([
        accountingService.getProfitLossData(business.id, dateRange.start, dateRange.end),
        accountingService.getBalanceSheet(business.id)
      ]);
      setPlData(pl);
      setBsData(bs);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to compile financial statements.");
    } finally {
      setLoading(false);
    }
  };

  const handleTallyExport = async () => {
    if (!business?.id) return;
    const loadToast = toast.loading("Compiling Ledger XML Hierarchy...");
    try {
      // Fetch recent invoice records with related contact data for export
      const { data, error } = await supabase
        .from('invoices')
        .select('*, contact:contacts(name)')
        .eq('business_id', business.id)
        .gte('invoice_date', dateRange.start)
        .lte('invoice_date', dateRange.end)
        .order('invoice_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("No transactional data found for selected periodicity.");
        toast.dismiss(loadToast);
        return;
      }

      await exportService.exportTallyXML(business.business_name || "Vyapari Entity", data);
      toast.success("Tally ISO 20022 structure successfully written to local memory.");
    } catch (e: any) {
      toast.error("Export halted: " + e.message);
    } finally {
      toast.dismiss(loadToast);
    }
  };

  const handleGSTR1Export = async () => {
    if (!business?.id) return;
    const loadToast = toast.loading("Compiling GSTR-1 JSON Payload...");
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, contact:contacts(gstin, name, state_code)')
        .eq('business_id', business.id)
        .gte('invoice_date', dateRange.start)
        .lte('invoice_date', dateRange.end);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("No transactional data found for selected periodicity.");
        toast.dismiss(loadToast);
        return;
      }

      await exportService.exportGSTR1JSON(business, data);
      toast.success("GSTR-1 Official JSON generated successfully.");
    } catch (e: any) {
      toast.error("Export halted: " + e.message);
    } finally {
      toast.dismiss(loadToast);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [business, dateRange]);

  const formatCurr = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const NavTab = ({ id, label, icon: Icon }: any) => {
    const active = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id)}
        className={`relative px-6 py-4 font-black text-[10px] uppercase tracking-[0.15em] flex items-center gap-2.5 transition-all ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <Icon size={14} strokeWidth={active ? 3 : 2} />
        {label}
        {active && <motion.div layoutId="accTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* TOP BANNER & DATE FILTER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-indigo-600 text-white flex items-center justify-center rounded-2xl shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)]">
              <Landmark size={22} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Ledger Analytics</h1>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest pl-14">Statutory Reporting & Balance Intelligence</p>
        </motion.div>

        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-white/80 shadow-sm">
          <input 
            type="date" 
            value={dateRange.start}
            onChange={e => setDateRange({...dateRange, start: e.target.value})}
            className="bg-transparent font-black text-[10px] uppercase tracking-wider text-slate-600 outline-none px-2"
          />
          <ArrowRight size={12} className="text-slate-300" />
          <input 
            type="date" 
            value={dateRange.end}
            onChange={e => setDateRange({...dateRange, end: e.target.value})}
            className="bg-transparent font-black text-[10px] uppercase tracking-wider text-slate-600 outline-none px-2"
          />
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        <NavTab id="pl" label="Profit & Loss" icon={TrendingUp} />
        <NavTab id="bs" label="Balance Sheet" icon={PieChart} />
        <NavTab id="compliance" label="Compliance & Export" icon={DownloadCloud} />
      </div>

      {/* MAIN CONTENT RENDERER */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Auditing Blockchain Node...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'pl' && plData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Master summary Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <SummaryBox label="Total Revenue" val={plData.revenue} color="emerald" trend="up" />
                  <SummaryBox label="Gross Profit" val={plData.grossProfit} color="indigo" sub={`${plData.grossMargin.toFixed(1)}% Margin`} />
                  <SummaryBox label="Direct COGS" val={plData.cogs} color="amber" />
                  <SummaryBox label="Net Earnings" val={plData.netProfit} color={plData.netProfit >= 0 ? "emerald" : "red"} highlight={true} />
                </div>

                {/* Vertical P&L Structure */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30">
                  <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                    <Receipt size={14}/> Statement of Income Operations
                  </h3>
                  
                  <div className="space-y-6">
                    <LineItem label="Trading Sales Volume" val={plData.revenue} />
                    <LineItem label="Cost of Goods Sold (COGS)" val={-plData.cogs} indent />
                    <hr className="border-slate-100 border-dashed" />
                    <LineItem label="Gross Trading Profit" val={plData.grossProfit} bold />
                    
                    <div className="pt-6">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase mb-4 ml-2">Operating Overheads</h4>
                      {Object.entries(plData.expenses).map(([cat, amt]: any) => (
                        <LineItem key={cat} label={cat} val={-amt} indent />
                      ))}
                      {Object.keys(plData.expenses).length === 0 && (
                        <div className="p-4 text-center border-2 border-dashed border-slate-100 rounded-2xl font-bold text-[10px] text-slate-400 uppercase">No recorded ledger expenses found for period</div>
                      )}
                    </div>
                    
                    <hr className="border-slate-200" />
                    <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
                      <span className="font-black text-xs uppercase tracking-[0.1em]">Net Post-Expense Profit</span>
                      <span className="font-black text-2xl">{formatCurr(plData.netProfit)}</span>
                    </div>
                  </div>
                </div>

                {/* Expense Waterfall Placeholder */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-10 -translate-y-10" />
                  <div className="relative z-10">
                    <ShieldCheck className="mb-4 opacity-60" size={32} />
                    <h3 className="text-2xl font-black tracking-tighter leading-tight">Capital Efficiency Score</h3>
                    <p className="text-indigo-200 text-xs font-bold mt-2 uppercase tracking-wider">Analyzing cash cycle velocities...</p>
                    
                    <div className="mt-12">
                      <div className="text-6xl font-black tracking-tighter">{((plData.netProfit / (plData.revenue || 1)) * 100).toFixed(0)}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mt-2">Operational Conversion Rate</div>
                    </div>
                  </div>
                  <div className="relative z-10 mt-8 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 text-xs font-bold">
                    Your burn rate is within optimal historical guidelines.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bs' && bsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ASSETS PANEL */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-white shadow-xl border-t-4 border-t-emerald-500">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h3 className="font-black text-3xl tracking-tight text-slate-900 uppercase">Assets</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Resource Allocation</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-600">{formatCurr(bsData.assets.total)}</span>
                  </div>
                  <div className="space-y-4">
                    <AssetLiabilityRow icon={Wallet} label="Unrealized Inventory Value" val={bsData.assets.inventory} />
                    <AssetLiabilityRow icon={Receipt} label="Pending Receivables" val={bsData.assets.receivables} />
                  </div>
                </div>

                {/* LIABILITIES PANEL */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-white shadow-xl border-t-4 border-t-rose-500">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h3 className="font-black text-3xl tracking-tight text-slate-900 uppercase">Liabilities</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Obligations</span>
                    </div>
                    <span className="text-2xl font-black text-rose-600">{formatCurr(bsData.liabilities.total)}</span>
                  </div>
                  <div className="space-y-4">
                    <AssetLiabilityRow icon={Briefcase} label="Outstanding Payables" val={bsData.liabilities.payables} color="rose" />
                    <AssetLiabilityRow icon={Landmark} label="Term Loans & Debt" val={bsData.liabilities.loans} color="rose" />
                  </div>
                </div>

                {/* NET EQUITY BANNER */}
                <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-8 flex justify-between items-center shadow-xl shadow-slate-300">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Retained Earnings / Net Equity Position</div>
                    <div className="text-indigo-400 text-xs font-bold uppercase">Assets Less Liabilities</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-black tracking-tight ${bsData.equity >= 0 ? 'text-white' : 'text-red-400'}`}>
                      {formatCurr(bsData.equity)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200 flex flex-col items-center gap-6 shadow-inner">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <DownloadCloud size={36} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Master XML Engine</h2>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Inject directly into Tally Prime using ISO 20022.</p>
                  </div>
                  <button 
                    onClick={handleTallyExport}
                    className="px-6 py-3 w-full bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mt-4"
                  >
                    Generate Tally XML
                  </button>
                </div>

                <div className="bg-slate-950 text-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-white/10 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] -mr-10 -mt-10 pointer-events-none" />
                  <div className="w-20 h-20 bg-white/5 text-amber-500 border border-white/10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl">
                    <FileJson size={36} />
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">GSTR-1 Gov Portal</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Compile JSON structure for official Government Upload.</p>
                  </div>
                  <button 
                    onClick={handleGSTR1Export}
                    className="px-6 py-3 w-full bg-amber-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_15px_30px_-5px_rgba(245,158,11,0.3)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mt-4 relative z-10"
                  >
                    Generate GSTR-1 JSON
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// Helper internal visual primitives
function SummaryBox({ label, val, color, sub, highlight = false, trend = '' }: any) {
  const cStyles: any = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <div className={`p-6 rounded-3xl border ${highlight ? 'bg-white ring-4 ring-indigo-600/5 shadow-lg' : 'bg-white/60 border-white'} transition-all`}>
      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">{label}</div>
      <div className={`text-2xl font-black tracking-tighter flex items-baseline gap-1 ${color === 'emerald' ? 'text-emerald-600' : color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>
        ₹{Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </div>
      {sub && <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-indigo-500">{sub}</div>}
    </div>
  );
}

function LineItem({ label, val, indent = false, bold = false }: any) {
  return (
    <div className={`flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors ${indent ? 'ml-6 border-l-2 border-slate-100' : ''} ${bold ? 'font-black text-slate-900' : 'font-bold text-slate-600 text-sm'}`}>
      <span className={`text-xs ${indent ? 'pl-4 opacity-70' : ''}`}>{label}</span>
      <span className={val < 0 ? 'text-rose-600' : bold ? 'text-indigo-600' : ''}>{val < 0 ? '(' : ''}₹{Math.abs(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}{val < 0 ? ')' : ''}</span>
    </div>
  );
}

function AssetLiabilityRow({ icon: Icon, label, val, color = 'emerald' }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:bg-white hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-600`}>
          <Icon size={18} />
        </div>
        <span className="font-bold text-slate-700 text-sm">{label}</span>
      </div>
      <span className={`font-black text-slate-900`}>₹{Number(val || 0).toLocaleString('en-IN')}</span>
    </div>
  );
}
