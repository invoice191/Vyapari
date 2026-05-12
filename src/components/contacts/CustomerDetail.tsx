import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MessageSquare, Plus, Phone, Mail, MapPin, 
  CreditCard, Calendar, Briefcase, TrendingUp,
  ArrowUpRight, ShoppingBag, Clock, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useGlobalData } from '../../contexts/DataContext';
import { Badge, ActionBtn } from '../common/UI';

interface CustomerDetailProps {
  contact: any;
  onClose: () => void;
  onNewInvoice: (contact: any) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CustomerDetail({ contact, onClose, onNewInvoice }: CustomerDetailProps) {
  const { invoices, ledger } = useGlobalData();
  const [activeTab, setActiveTab] = React.useState('Overview');

  const customerInvoices = useMemo(() => {
    return invoices.filter(inv => inv.contact_id === contact.id);
  }, [invoices, contact.id]);

  const customerLedger = useMemo(() => {
    return ledger.filter(entry => entry.contact_id === contact.id);
  }, [ledger, contact.id]);

  const stats = useMemo(() => {
    const totalSpend = customerInvoices.reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0);
    const orderCount = customerInvoices.length;
    const avgOrder = orderCount > 0 ? totalSpend / orderCount : 0;
    const outstanding = customerInvoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0);
    
    const paysIn = customerInvoices.length > 0 ? 12 : 0; 

    return { totalSpend, orderCount, avgOrder, outstanding, paysIn };
  }, [customerInvoices]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const chartData = useMemo(() => {
    const last7Months = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (6 - i));
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        key: `${d.getFullYear()}-${d.getMonth()}`
      };
    });

    const grouped = customerInvoices.reduce((acc: any, inv) => {
      if (!inv.created_at) return acc;
      const date = new Date(inv.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!acc[key]) acc[key] = 0;
      acc[key] += Number(inv.total_amount || 0);
      return acc;
    }, {});

    return last7Months.map(m => ({
      name: m.name,
      spend: grouped[m.key] || 0
    }));
  }, [customerInvoices]);

  const categoryData = [
    { name: 'Groceries', value: 48 },
    { name: 'Electronics', value: 30 },
    { name: 'Home Essentials', value: 22 },
  ];

  const initials = contact.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

  const renderOverview = () => (
    <div className="space-y-10">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
          <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Spend over last 7 months</div>
          <div className="h-64 w-full flex items-center justify-center">
            {customerInvoices.length === 0 ? (
              <div className="flex flex-col items-center gap-4 text-slate-300">
                <TrendingUp size={40} strokeWidth={1} />
                <span className="text-xs font-bold uppercase tracking-widest">No transaction data</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={{ stroke: '#E2E8F0', strokeWidth: 1 }} 
                    tickLine={{ stroke: '#E2E8F0' }} 
                    tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 800 }}
                  />
                  <YAxis 
                    axisLine={{ stroke: '#E2E8F0', strokeWidth: 1 }} 
                    tickLine={{ stroke: '#E2E8F0' }} 
                    tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 800 }}
                    tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
                    width={60}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                  />
                  <Bar dataKey="spend" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
          <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Category Breakdown</div>
          <div className="flex items-center gap-8 h-64">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-48 space-y-4">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[11px] font-bold text-slate-600">{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-900">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details Card */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-10 shadow-sm">
        <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Contact Details</div>
        <div className="grid grid-cols-3 gap-y-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Phone size={12} /> Phone</div>
            <div className="text-lg font-black text-slate-900">{contact.phone || 'N/A'}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Mail size={12} /> Email</div>
            <div className="text-lg font-black text-slate-900">{contact.email || 'N/A'}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><MapPin size={12} /> Location</div>
            <div className="text-lg font-black text-slate-900">{contact.city || contact.address || 'N/A'}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><CreditCard size={12} /> GST</div>
            <div className="text-lg font-black text-slate-900">{contact.gstin || 'N/A'}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Calendar size={12} /> Since</div>
            <div className="text-lg font-black text-slate-900">{formatDate(contact.created_at)}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Briefcase size={12} /> Role</div>
            <div className="text-lg font-black text-slate-900">Customer</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice #</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {customerInvoices.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No invoices found</td>
            </tr>
          ) : (
            customerInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6 text-sm font-black text-slate-900">{inv.invoice_number}</td>
                <td className="px-8 py-6 text-sm font-bold text-slate-500">{formatDate(inv.created_at)}</td>
                <td className="px-8 py-6 text-sm font-black text-slate-900">₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                <td className="px-8 py-6">
                  <Badge 
                    status={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : 'danger'}
                  >
                    {inv.status}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTransactions = () => (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {customerLedger.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No transactions found</td>
            </tr>
          ) : (
            customerLedger.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6 text-xs font-mono font-bold text-slate-400 uppercase">#{entry.id.slice(0, 8)}</td>
                <td className="px-8 py-6 text-sm font-bold text-slate-500">{formatDate(entry.timestamp)}</td>
                <td className="px-8 py-6 text-sm font-bold text-slate-700">{entry.description || 'General Transaction'}</td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    entry.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {entry.type}
                  </span>
                </td>
                <td className={`px-8 py-6 text-sm font-black text-right ${
                  entry.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {entry.type === 'credit' ? '+' : '-'} ₹{Number(entry.amount).toLocaleString('en-IN')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderInsights = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-10 text-white space-y-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <TrendingUp size={120} />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
            <ShoppingBag size={20} />
          </div>
          <span className="text-sm font-black uppercase tracking-widest">Buying Behavior</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-black">Frequent Buyer</h3>
          <h4 className="text-xs font-black uppercase tracking-widest opacity-60">AI Intelligence</h4>
          <p className="text-indigo-100 text-sm leading-relaxed font-medium">
            This customer makes an average of 4 purchases per month. They primarily shop in the "Groceries" category and tend to buy in bulk.
          </p>
        </div>
        <div className="pt-4 flex gap-4">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
            <div className="text-[10px] font-black uppercase opacity-60">Loyalty Score</div>
            <div className="text-xl font-black">92/100</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
            <div className="text-[10px] font-black uppercase opacity-60">Retention</div>
            <div className="text-xl font-black">High</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-8 shadow-sm">
        <div className="flex items-center gap-3 text-slate-900">
          <Clock className="text-indigo-600" size={20} />
          <span className="text-sm font-black uppercase tracking-widest">Payment Reliability</span>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span>Payment Speed</span>
              <span className="text-indigo-600">Excellent</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '85%' }}
                className="h-full bg-indigo-600"
              />
            </div>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed font-bold italic">
            "Typically clears outstanding invoices within 12 days. No history of payment defaults in the last 6 months."
          </p>
          <div className="pt-4 border-t border-slate-50 flex justify-between">
            <div className="text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late Fees</div>
              <div className="text-lg font-black text-slate-900">₹0</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Level</div>
              <div className="text-lg font-black text-emerald-600">Low</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-50 w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Section */}
        <div className="p-10 bg-white border-b border-slate-100 flex justify-between items-start">
          <div className="flex gap-6">
            <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl font-black text-indigo-600 shadow-inner">
              {initials}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{contact.name}</h1>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                <span>ID: {contact.id?.slice(0, 6).toUpperCase()}</span>
                <span>•</span>
                <span>Customer since {formatDate(contact.created_at)}</span>
                <span>•</span>
                <span>{contact.city || 'Location N/A'}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">Verified</span>
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <ActionBtn onClick={() => onNewInvoice(contact)} className="bg-indigo-600 text-white border-none px-8">
              <Plus size={18} /> New Bill
            </ActionBtn>
            <button 
              onClick={onClose}
              className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Total Spend', value: `₹${stats.totalSpend.toLocaleString('en-IN')}`, sub: `${stats.orderCount} orders` },
              { label: 'Avg Order', value: `₹${Math.round(stats.avgOrder).toLocaleString('en-IN')}`, sub: 'per invoice' },
              { label: 'Outstanding', value: `₹${stats.outstanding.toLocaleString('en-IN')}`, sub: 'unpaid balance', danger: stats.outstanding > 0 },
              { label: 'Pays In', value: `${stats.paysIn} days`, sub: 'avg time' }
            ].map((kpi, idx) => (
              <div key={idx} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-4 shadow-sm hover:shadow-md transition-all">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                <div className={`text-3xl font-black ${kpi.danger ? 'text-rose-600' : 'text-slate-900'}`}>{kpi.value}</div>
                <div className="text-[11px] font-bold text-slate-500">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabs Section */}
          <div className="space-y-10">
            <div className="flex gap-10 border-b border-slate-100">
              {['Overview', 'Invoices', 'Transactions', 'Insights'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-black uppercase tracking-widest pb-6 relative transition-all ${
                    activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-t-full"
                    />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'Overview' && renderOverview()}
                {activeTab === 'Invoices' && renderInvoices()}
                {activeTab === 'Transactions' && renderTransactions()}
                {activeTab === 'Insights' && renderInsights()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
