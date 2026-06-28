import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  DollarSign,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';

export default function InvoiceAnalytics() {
  const { business } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*, contacts(name)')
        .eq('business_id', business?.id);

      if (error) throw error;

      // Process KPIs
      const now = new Date();
      const thisMonth = invoices.filter(inv => new Date(inv.created_at).getMonth() === now.getMonth());
      const totalInvoiced = thisMonth.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
      const totalCollected = thisMonth.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
      const outstanding = invoices.reduce((sum, inv) => sum + Number(inv.amount_remaining || 0), 0);
      const overdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.amount_remaining || 0), 0);
      
      // Status Distribution
      const statusCounts = invoices.reduce((acc: any, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {});

      const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Revenue by Day
      const dailyRevenue = invoices.reduce((acc: any, inv) => {
        const date = new Date(inv.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + Number(inv.total_amount);
        return acc;
      }, {});

      const lineData = Object.entries(dailyRevenue).map(([name, value]) => ({ name, value })).slice(-7);

      // Top Customers Logic
      const customerTotals: Record<string, {name: string, total: number}> = {};
      invoices.forEach(inv => {
        const contactName = inv.contacts?.name || 'Unknown';
        if (!customerTotals[contactName]) {
          customerTotals[contactName] = { name: contactName, total: 0 };
        }
        customerTotals[contactName].total += Number(inv.total_amount);
      });
      const topCustomers = Object.values(customerTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(c => ({ contacts: { name: c.name }, total_amount: c.total }));

      // AR Aging Logic
      const arAging = { current: 0, late: 0, veryLate: 0, critical: 0 };
      const nowTime = now.getTime();
      invoices.filter(inv => inv.status !== 'paid' && Number(inv.amount_remaining) > 0).forEach(inv => {
        const invoiceTime = new Date(inv.created_at).getTime();
        const daysOld = Math.floor((nowTime - invoiceTime) / (1000 * 3600 * 24));
        const rem = Number(inv.amount_remaining);
        if (daysOld <= 30) arAging.current += rem;
        else if (daysOld <= 60) arAging.late += rem;
        else if (daysOld <= 90) arAging.veryLate += rem;
        else arAging.critical += rem;
      });

      setStats({
        totalInvoiced,
        totalCollected,
        collectionRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
        outstanding,
        overdue,
        pieData,
        lineData,
        topCustomers,
        arAging
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="h-96 flex items-center justify-center">Loading Analytics...</div>;

  const COLORS = ['#818CF8', '#34D399', '#F87171', '#FBBF24', '#A78BFA', '#E879F9'];

  return (
    <div className="space-y-6">
      {/* -- KPI GRID -- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Invoiced This Month" 
          value={formatCurrency(stats.totalInvoiced)} 
          icon={<DollarSign className="text-indigo-600" />}
          trend="+12%"
          trendUp={true}
        />
        <KpiCard 
          title="Collection Rate" 
          value={`${stats.collectionRate.toFixed(1)}%`} 
          icon={<CheckCircle className="text-emerald-600" />}
          trend="+5%"
          trendUp={true}
        />
        <KpiCard 
          title="Outstanding" 
          value={formatCurrency(stats.outstanding)} 
          icon={<Clock className="text-amber-500" />}
          trend="-2%"
          trendUp={false}
        />
        <KpiCard 
          title="Overdue Amount" 
          value={formatCurrency(stats.overdue)} 
          icon={<AlertCircle className="text-red-500" />}
          trend="+8%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* -- REVENUE TREND -- */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* -- STATUS DISTRIBUTION -- */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Invoice Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* -- AR AGING & TOP CUSTOMERS -- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">AR Aging Summary</h3>
          <div className="space-y-6">
            {stats.arAging && (() => {
              const total = stats.arAging.current + stats.arAging.late + stats.arAging.veryLate + stats.arAging.critical || 1;
              return (
                <>
                  <AgingBar label="Current (0-30)" amount={stats.arAging.current} color="bg-indigo-500" percent={(stats.arAging.current / total) * 100} />
                  <AgingBar label="Late (31-60)" amount={stats.arAging.late} color="bg-amber-500" percent={(stats.arAging.late / total) * 100} />
                  <AgingBar label="Very Late (61-90)" amount={stats.arAging.veryLate} color="bg-orange-500" percent={(stats.arAging.veryLate / total) * 100} />
                  <AgingBar label="Critical (90+)" amount={stats.arAging.critical} color="bg-red-500" percent={(stats.arAging.critical / total) * 100} />
                </>
              );
            })()}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Top Customers by Volume</h3>
          <div className="space-y-3">
            {stats.topCustomers.map((cust: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                    {cust.contacts.name[0]}
                  </div>
                  <div>
                    <p className="text-slate-800 font-bold">{cust.contacts.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Avg. Pay: 12 days</p>
                  </div>
                </div>
                <p className="text-indigo-600 font-black">{formatCurrency(cust.total_amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, trend, trendUp }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 transition-colors">{icon}</div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
      <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
    </div>
  );
}

function AgingBar({ label, amount, color, percent }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-600 uppercase tracking-widest">{label}</span>
        <span className="font-black text-slate-800">{formatCurrency(amount)}</span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
