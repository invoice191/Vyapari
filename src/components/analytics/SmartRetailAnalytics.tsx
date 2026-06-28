import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShoppingCart, Users, Package, Zap, RefreshCw, BarChart2, Grid, ArrowRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, PieChart, Pie, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { runSmartRetailAnalytics, SmartRetailAnalyticsResult, RFMSegment } from '../../services/smartRetailAnalytics';

// ── Tab IDs ──────────────────────────────────────────────────────────────────
type Tab = 'basket' | 'rfm' | 'abcxyz';

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'basket', label: 'Market Basket', icon: ShoppingCart, desc: 'FP-Growth Association Rules' },
  { id: 'rfm',    label: 'RFM Segments',  icon: Users,        desc: '5-Tier Customer Scoring' },
  { id: 'abcxyz', label: 'ABC-XYZ',       icon: Package,      desc: 'Inventory Classification' },
];

// ── RFM segment colors ────────────────────────────────────────────────────────
const SEGMENT_COLORS: Record<string, string> = {
  'Champions': '#10B981', 'Loyal Customers': '#6366F1',
  'Potential Loyalists': '#8B5CF6', 'Recent Customers': '#3B82F6',
  'Promising': '#06B6D4', 'Need Attention': '#F59E0B',
  'About to Sleep': '#F97316', 'At Risk': '#EF4444',
  'Cannot Lose Them': '#DC2626', 'Hibernating': '#6B7280', 'Lost': '#374151',
};

const ABC_COLORS = { A: '#10B981', B: '#6366F1', C: '#6B7280' };
const XYZ_COLORS = { X: '#10B981', Y: '#F59E0B', Z: '#EF4444' };

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const SmartRetailAnalytics: React.FC = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('basket');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SmartRetailAnalyticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!profile?.business_id) return;
    setLoading(true); setError(null);
    try {
      const bId = profile.business_id;

      // Fetch invoices with items
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, contact_id, total_amount, created_at, invoice_items(quantity, products(id, name, selling_price))')
        .eq('business_id', bId)
        .eq('type', 'sale')
        .order('created_at', { ascending: false })
        .limit(500);

      // Fetch contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('business_id', bId)
        .eq('type', 'customer');

      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, selling_price')
        .eq('business_id', bId)
        .eq('is_active', true);

      const safeInvoices = invoices || [];
      const safeContacts = contacts || [];
      const safeProducts = products || [];

      // ── Build transactions for FP-Growth ───────────────────────────────────
      const transactions = safeInvoices.map(inv => ({
        id: inv.id,
        contactId: inv.contact_id,
        items: ((inv.invoice_items as any[]) || [])
          .map((ii: any) => ii.products?.name)
          .filter(Boolean) as string[],
        total: Number(inv.total_amount) || 0,
        date: new Date(inv.created_at),
      }));

      // ── Build customers for RFM ────────────────────────────────────────────
      const customers = safeContacts.map(c => ({
        contactId: c.id,
        name: c.name || 'Unknown',
        phone: c.phone || '',
        invoices: safeInvoices
          .filter(i => i.contact_id === c.id)
          .map(i => ({ total: Number(i.total_amount) || 0, date: new Date(i.created_at) })),
      }));

      // ── Build inventory for ABC-XYZ ────────────────────────────────────────
      // Bucket invoices into 90 daily slots
      const now = Date.now();
      const DAYS = 90;
      const inventory = safeProducts.map(p => {
        const dailySales = Array(DAYS).fill(0);
        for (const inv of safeInvoices) {
          const dayIdx = Math.floor((now - new Date(inv.created_at).getTime()) / 86400000);
          if (dayIdx < 0 || dayIdx >= DAYS) continue;
          const items = (inv.invoice_items as any[]) || [];
          for (const ii of items) {
            if (ii.products?.id === p.id) {
              dailySales[dayIdx] += Number(ii.quantity) || 1;
            }
          }
        }
        return {
          productId: p.id,
          productName: p.name || 'Unknown',
          dailySales,
          revenuePerUnit: Number(p.selling_price) || 0,
        };
      });

      const res = runSmartRetailAnalytics({ transactions, customers, inventory });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (profile?.business_id) run(); }, [profile?.business_id]);

  // ── Summary cards ─────────────────────────────────────────────────────────
  const summaryCards = result ? [
    { label: 'Transactions', value: result.totalTransactions, icon: BarChart2, color: '#6366F1' },
    { label: 'Customers', value: result.totalCustomers, icon: Users, color: '#10B981' },
    { label: 'Products', value: result.totalProducts, icon: Package, color: '#F59E0B' },
    { label: 'Association Rules', value: result.associationRules.length, icon: Zap, color: '#EC4899' },
  ] : [];

  // ── RFM pie data ──────────────────────────────────────────────────────────
  const rfmPieData = result
    ? Object.entries(result.rfmSummary)
        .filter(([, count]) => count > 0)
        .map(([seg, count]) => ({ name: seg, value: count, fill: SEGMENT_COLORS[seg] || '#6B7280' }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="text-indigo-400" size={28} />
            Smart Retail Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">FP-Growth · RFM Scoring · ABC-XYZ Matrix</p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {loading ? 'Computing…' : 'Run Analysis'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Summary Cards */}
      {result && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(c => (
            <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.color + '22' }}>
                <c.icon size={20} style={{ color: c.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{c.value}</div>
                <div className="text-xs text-slate-500 font-medium">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-indigo-400" />
          <p className="text-slate-400 text-sm font-medium">Running algorithms on your store data…</p>
        </div>
      )}

      {/* ── Tab: Market Basket (FP-Growth) ─────────────────────────────────── */}
      {!loading && result && tab === 'basket' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Association Rules */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Top Association Rules</h3>
              <p className="text-xs text-slate-500 mb-4">Products frequently bought together (by Lift)</p>
              {result.topBundles.length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center">Not enough transaction data for rules.<br/>Min 5% support required.</p>
              ) : (
                <div className="space-y-3">
                  {result.topBundles.slice(0, 8).map((rule, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-white flex-wrap">
                          <span className="bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-lg font-medium truncate max-w-[120px]">
                            {rule.antecedent.join(' + ')}
                          </span>
                          <ArrowRight size={12} className="text-slate-500 shrink-0" />
                          <span className="bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded-lg font-medium truncate max-w-[120px]">
                            {rule.consequent.join(' + ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-amber-400">Lift {rule.lift.toFixed(2)}×</div>
                        <div className="text-[10px] text-slate-500">Conf {(rule.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Support Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Frequent Itemsets by Support</h3>
              <p className="text-xs text-slate-500 mb-4">Top single products by transaction frequency</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={result.frequentItemsets
                    .filter(is => is.items.length === 1)
                    .sort((a, b) => b.support - a.support)
                    .slice(0, 8)
                    .map(is => ({ name: is.items[0].substring(0, 14), support: +(is.support * 100).toFixed(1) }))}
                  margin={{ top: 5, right: 10, left: -20, bottom: 40 }}
                >
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12 }}
                    formatter={(v: any) => [`${v}%`, 'Support']}
                  />
                  <Bar dataKey="support" radius={[6, 6, 0, 0]}>
                    {result.frequentItemsets.filter(is => is.items.length === 1).slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={`hsl(${220 + i * 15}, 70%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: RFM ───────────────────────────────────────────────────────── */}
      {!loading && result && tab === 'rfm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Customer Segment Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={rfmPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {rfmPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* RFM Score Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Top Customers by RFM Score</h3>
              <div className="space-y-2 overflow-y-auto max-h-[280px]">
                {result.rfmResults
                  .sort((a, b) => b.rfmTotal - a.rfmTotal)
                  .slice(0, 10)
                  .map((c, i) => (
                    <div key={c.contactId} className="flex items-center gap-3 bg-slate-800/40 px-3 py-2 rounded-xl">
                      <span className="text-xs text-slate-500 w-5 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-500">{c.segment}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {(['rScore', 'fScore', 'mScore'] as const).map(k => (
                          <span key={k} className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: `hsl(${(c[k] - 1) * 30}, 70%, 40%)` }}>
                            {c[k]}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-indigo-400 shrink-0">{c.rfmTotal}/15</span>
                    </div>
                  ))}
                {result.rfmResults.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-8">No customer data available.</p>
                )}
              </div>
            </div>
          </div>

          {/* RFM Legend */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Segment Action Guide</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { seg: 'Champions', action: 'Reward & upsell. They love you!' },
                { seg: 'At Risk', action: 'Send win-back offers immediately.' },
                { seg: 'Loyal Customers', action: 'Offer loyalty program enrollment.' },
                { seg: 'Lost', action: 'Run deep discount re-engagement.' },
              ].map(({ seg, action }) => (
                <div key={seg} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEGMENT_COLORS[seg] }} />
                    <span className="text-xs font-bold text-white">{seg}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: ABC-XYZ ───────────────────────────────────────────────────── */}
      {!loading && result && tab === 'abcxyz' && (
        <div className="space-y-6">
          {/* Summary pills */}
          <div className="flex flex-wrap gap-3">
            {(['A', 'B', 'C'] as const).map(cls => (
              <div key={cls} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                <div className="w-3 h-3 rounded-full" style={{ background: ABC_COLORS[cls] }} />
                <span className="text-sm font-bold text-white">Class {cls}</span>
                <span className="text-sm text-slate-400">{result.abcSummary[cls]} products</span>
              </div>
            ))}
            {(['X', 'Y', 'Z'] as const).map(cls => (
              <div key={cls} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                <div className="w-3 h-3 rounded-full" style={{ background: XYZ_COLORS[cls] }} />
                <span className="text-sm font-bold text-white">Class {cls}</span>
                <span className="text-sm text-slate-400">{result.xyzSummary[cls]} products</span>
              </div>
            ))}
          </div>

          {/* Product table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/60 border-b border-slate-700">
                    {['Product', 'Revenue', 'Avg Daily Sales', 'CV', 'ABC', 'XYZ', 'Matrix', 'Recommendation'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {result.abcXYZResults
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 20)
                    .map(p => (
                      <tr key={p.productId} className="hover:bg-slate-800/30 transition-all">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-white truncate block max-w-[160px]">{p.productName}</span>
                          <span className={`text-[10px] font-bold ${p.urgency === 'critical' ? 'text-red-400' : p.urgency === 'medium' ? 'text-amber-400' : 'text-slate-500'}`}>
                            {p.urgency.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-400">₹{p.totalRevenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{p.avgDailySales.toFixed(1)} units/day</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{p.coefficientOfVariation.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: ABC_COLORS[p.abcClass] + '22', color: ABC_COLORS[p.abcClass] }}>
                            {p.abcClass}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: XYZ_COLORS[p.xyzClass] + '22', color: XYZ_COLORS[p.xyzClass] }}>
                            {p.xyzClass}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-700 text-white">{p.matrix}</span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-400 max-w-[200px]">{p.recommendation}</td>
                      </tr>
                    ))}
                  {result.abcXYZResults.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-xs">No inventory data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 flex flex-col items-center gap-4">
          <Grid size={40} className="text-slate-600" />
          <p className="text-slate-400 text-sm font-medium">Click "Run Analysis" to compute all 3 algorithms</p>
        </div>
      )}
    </div>
  );
};
