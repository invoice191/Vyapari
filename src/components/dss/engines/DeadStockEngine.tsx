import React, { useState, useEffect } from 'react';
import { Package, Trash2, ArrowRight, Zap, Info, Lightbulb, ShoppingCart, RefreshCw, AlertTriangle, TrendingDown, Target, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../../../lib/supabase';

export const DeadStockEngine: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeadStock();
  }, []);

  const fetchDeadStock = async () => {
    setLoading(true);
    // Fetch products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .gt('quantity', 0)
      .limit(50);
      
    // Fetch invoice items to find the last sold date for each product
    const { data: invoiceItems } = await supabase
      .from('invoice_items')
      .select('product_id, created_at, quantity')
      .order('created_at', { ascending: false });

    const lastSoldMap: Record<string, Date> = {};
    if (invoiceItems) {
      invoiceItems.forEach(item => {
        if (!lastSoldMap[item.product_id]) {
          lastSoldMap[item.product_id] = new Date(item.created_at);
        }
      });
    }

    const now = new Date();
    const processed = (products || []).map(p => {
       const lastActiveDate = lastSoldMap[p.id] || new Date(p.created_at || now);
       const daysIdle = Math.max(0, Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24)));
       
       return {
         name: p.name,
         qty: p.quantity,
         value: (Number(p.quantity) || 0) * (Number(p.cost_price) || Number(p.selling_price) || 0),
         days: daysIdle,
         status: daysIdle > 60 ? 'High Risk' : 'Slow'
       };
    }).sort((a, b) => b.value - a.value).filter(p => p.days > 15).slice(0, 20);

    setData(processed);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Dead Stock Analysis</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Identification of slow-moving inventory and capital recovery strategies.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-[#1E293B]/50 border border-slate-800 px-6 py-3 rounded-2xl text-center shadow-lg">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Trapped Capital</span>
             <span className="text-xl font-bold text-rose-400">
               Rs.{data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
             </span>
           </div>
        </div>
      </div>

      {/* Strategic Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-3xl space-y-4">
           <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle size={18} />
              <h4 className="text-xs font-bold uppercase tracking-widest">Inventory Warning</h4>
           </div>
           <p className="text-sm text-slate-400 leading-relaxed">
             You have <span className="text-white font-bold">{data.filter(i => i.days > 60).length} items</span> that haven't moved in over 60 days. This inventory is consuming storage and blocking capital.
           </p>
        </div>
        <div className="bg-indigo-500/5 border border-indigo-500/20 p-8 rounded-3xl space-y-4">
           <div className="flex items-center gap-2 text-indigo-400">
              <RefreshCw size={18} />
              <h4 className="text-xs font-bold uppercase tracking-widest">Recovery Strategy</h4>
           </div>
           <p className="text-sm text-slate-400 leading-relaxed">
             Executing a <span className="text-white font-bold">15% Clearance Bundle</span> for top-sitting items could recover Rs.{Math.round(data.reduce((acc, curr) => acc + curr.value, 0) * 0.4).toLocaleString()} in cash within 7 days.
           </p>
        </div>
      </div>

      {/* Clean Data Table */}
      <div className="bg-[#1E293B]/30 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
        
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800">
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sitting Product</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Quantity</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Stale Value</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Days Idle</th>
              <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((item, i) => (
              <tr key={i} className="group hover:bg-slate-800/30 transition-all">
                <td className="p-6">
                  <span className="font-bold text-white text-sm">{item.name}</span>
                  <div className="mt-1">
                     <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${item.status === 'High Risk' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {item.status}
                     </span>
                  </div>
                </td>
                <td className="p-6 text-right text-sm text-slate-300 font-medium">{item.qty}</td>
                <td className="p-6 text-right font-bold text-rose-400">Rs.{item.value.toLocaleString()}</td>
                <td className="p-6 text-right">
                  <span className="text-sm font-bold text-slate-400">{item.days}d</span>
                </td>
                <td className="p-6 text-right">
                  <button className="bg-slate-800 text-slate-400 p-2 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-md">
                     <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
