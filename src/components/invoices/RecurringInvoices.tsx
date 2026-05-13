import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RefreshCw, Package, Play, Pause, Trash2, Clock, CheckCircle2, X, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';
import { useToast } from '../common/Toast';

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Every Week', biweekly: 'Every 2 Weeks',
  monthly: 'Every Month', quarterly: 'Every Quarter',
};

function getNextDate(freq: string): string {
  const d = new Date();
  if (freq === 'weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'biweekly') d.setDate(d.getDate() + 14);
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  else d.setMonth(d.getMonth() + 3);
  return d.toISOString().split('T')[0];
}

interface TemplateItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  unit: string;
}

export default function RecurringInvoices() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const businessId = profile?.business_id ?? '';

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Modal state
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [contactId, setContactId] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'quarterly'>('monthly');
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (businessId) fetchTemplates();
  }, [businessId]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .select('*, contacts(name, phone)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function openModal() {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('contacts').select('id,name,phone').eq('business_id', businessId).order('name').limit(200),
      supabase.from('products').select('id,name,selling_price,gst_rate,unit').eq('business_id', businessId).order('name').limit(200),
    ]);
    setContacts(c || []);
    setProducts(p || []);
    setContactId('');
    setFrequency('monthly');
    setItems([]);
    setShowModal(true);
  }

  function addItem(productId: string) {
    if (!productId) return;
    const p = products.find(x => x.id === productId);
    if (!p) return;
    if (items.find(i => i.product_id === p.id)) {
      toast(`${p.name} already added`, 'info');
      return;
    }
    setItems(prev => [...prev, {
      product_id: p.id,
      product_name: p.name,
      quantity: 1,
      unit_price: p.selling_price,
      tax_rate: p.gst_rate ?? 0,
      unit: p.unit ?? 'pcs',
    }]);
  }

  function updateItem(idx: number, field: keyof TemplateItem, val: any) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }

  async function handleSave() {
    if (!contactId) { toast('Please select a customer', 'warning'); return; }
    if (items.length === 0) { toast('Add at least one product', 'warning'); return; }

    setSaving(true);
    try {
      // Store items as JSONB in the template_items column (works with existing schema)
      // If column doesn't exist yet, we catch the error and advise the user
      const payload: any = {
        business_id: businessId,
        contact_id: contactId,
        frequency,
        next_invoice_date: getNextDate(frequency),
        status: 'active',
        total_created: 0,
        template_items: items,  // stored as JSONB
      };

      const { data, error } = await supabase
        .from('recurring_invoices')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // If template_items column doesn't exist, insert without it and show message
        if (error.message.includes('template_items') || error.code === '42703') {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.template_items;
          const { error: e2 } = await supabase
            .from('recurring_invoices')
            .insert(fallbackPayload);
          if (e2) throw e2;
          toast('Template saved! Note: Run the SQL migration for full item support.', 'success');
        } else {
          throw error;
        }
      } else {
        toast('Recurring template created successfully!', 'success');
      }

      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      toast(err.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('recurring_invoices').update({ status: newStatus }).eq('id', id);
    if (error) return toast(error.message, 'error');
    toast(`Template ${newStatus}`, 'success');
    fetchTemplates();
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this recurring template? This cannot be undone.')) return;
    const { error } = await supabase.from('recurring_invoices').delete().eq('id', id);
    if (error) return toast(error.message, 'error');
    toast('Template deleted', 'success');
    fetchTemplates();
  }

  const estTotal = (t: any) => {
    const tmplItems: TemplateItem[] = t.template_items || [];
    return tmplItems.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  };

  const itemCount = (t: any) => (t.template_items || []).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recurring Invoices</h2>
          <p className="text-slate-500 font-medium mt-1">Automated billing templates for regular customers.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/20 font-black text-xs uppercase tracking-widest"
        >
          <Plus size={16} strokeWidth={3} /> Create Template
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-sm">
          <RefreshCw className="animate-spin mr-3" size={20} /> Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
          <RefreshCw className="text-slate-300 mb-4" size={48} strokeWidth={1.5} />
          <p className="text-slate-600 font-bold text-base">No recurring templates yet.</p>
          <p className="text-slate-400 text-sm mt-1">Automate your billing with a recurring template.</p>
          <button
            onClick={openModal}
            className="mt-5 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
          >
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all relative overflow-hidden"
            >
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => toggleStatus(t.id, t.status)}
                  title={t.status === 'active' ? 'Pause' : 'Activate'}
                  className={`p-2.5 rounded-xl transition-all ${t.status === 'active' ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}`}
                >
                  {t.status === 'active' ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} />}
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-all"
                >
                  <Trash2 size={14} strokeWidth={3} />
                </button>
              </div>

              {/* Avatar + Info */}
              <div className="flex items-center gap-4 mb-6 pr-24">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 ${t.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                  {(t.contacts?.name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-slate-800 font-black text-base truncate">{t.contacts?.name || 'Unknown'}</h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1.5 uppercase tracking-widest font-bold mt-1">
                    <RefreshCw size={11} className={t.status === 'active' ? 'text-indigo-500' : 'text-slate-400'} />
                    {FREQ_LABELS[t.frequency] || t.frequency}
                  </p>
                </div>
              </div>

              {/* Stats rows */}
              <div className="space-y-3 mb-6">
                <StatRow icon={<Package size={13} className="text-slate-400" />} label="Products" value={`${itemCount(t)} items`} />
                <StatRow icon={<Clock size={13} className="text-slate-400" />} label="Next Invoice" value={new Date(t.next_invoice_date).toLocaleDateString('en-IN')} />
                <StatRow icon={<CheckCircle2 size={13} className="text-slate-400" />} label="Total Sent" value={`${t.total_created || 0} invoices`} />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Est. Per Invoice</p>
                  <p className="text-2xl font-black text-indigo-600">{formatCurrency(estTotal(t))}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${t.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {t.status}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* -- Create Template Modal -- */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1300] flex items-start justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-100">
                <div>
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Invoice Suite</p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Create Recurring Template</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700 transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Customer */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer *</label>
                  <select
                    value={contactId}
                    onChange={e => setContactId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white p-3 font-bold text-xs rounded-xl outline-none text-slate-800 transition-all"
                  >
                    <option value="">- Select Customer -</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
                  </select>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Billing Frequency *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['weekly', 'biweekly', 'monthly', 'quarterly'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFrequency(f)}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${frequency === f ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                      >
                        {f === 'biweekly' ? '2-Week' : f}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar size={11} />
                    Next invoice: <span className="font-black text-indigo-600 ml-1">{new Date(getNextDate(frequency)).toLocaleDateString('en-IN')}</span>
                  </p>
                </div>

                {/* Add Products */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Products *</label>
                  <select
                    value=""
                    onChange={e => { addItem(e.target.value); (e.target as HTMLSelectElement).value = ''; }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white p-3 font-bold text-xs rounded-xl outline-none text-slate-800 transition-all"
                  >
                    <option value="">- Select Product to Add -</option>
                    {products
                      .filter(p => !items.find(i => i.product_id === p.id))
                      .map(p => <option key={p.id} value={p.id}>{p.name} (Rs.{p.selling_price})</option>)
                    }
                  </select>
                </div>

                {/* Items Table */}
                {items.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Product', 'Qty', 'Price Rs.', ''].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-2 font-bold text-slate-800 max-w-[130px] truncate">{it.product_name}</td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number" min="1" value={it.quantity}
                                onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                                className="w-14 bg-slate-50 border border-slate-200 focus:border-indigo-400 p-1.5 text-xs font-black text-center outline-none rounded-lg"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number" min="0" value={it.unit_price}
                                onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-20 bg-slate-50 border border-slate-200 focus:border-indigo-400 p-1.5 text-xs font-black text-center outline-none rounded-lg"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 bg-indigo-50/60 border-t border-indigo-100/50 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                      <span className="text-base font-black text-indigo-600">
                        {formatCurrency(items.reduce((s, it) => s + it.quantity * it.unit_price, 0))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !contactId || items.length === 0}
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={3} />}
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">{icon}{label}</span>
      <span className="text-slate-800 font-black bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{value}</span>
    </div>
  );
}
