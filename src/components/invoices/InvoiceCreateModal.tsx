import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, RefreshCw, Lock, AlertTriangle, CheckCircle, Repeat } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useSmartAutocomplete } from '../../hooks/useSmartAutocomplete';
import { useDuplicateCheck } from '../../hooks/useDuplicateCheck';
import { useInvoiceMargin } from '../../hooks/useInvoiceMargin';
import { usePaymentScore } from '../../hooks/usePaymentScore';
import { useUpsellSuggestions } from '../../hooks/useUpsellSuggestions';
import { ActionBtn } from "../common/UI";
import CustomerCreditCard from './CustomerCreditCard';
import { useToast } from '../common/Toast';

interface Contact { id: string; name: string; phone?: string; gstin?: string; state?: string; payment_terms?: string; credit_score?: number; }
interface LineItem {
  product_id: string; name: string; quantity: number; unit_price: number;
  cost_price: number; tax_rate: number; unit: string; available_stock?: number;
}

interface Props { isOpen: boolean; onClose: () => void; onCreated: () => void; prefill?: any; }

import { useGlobalData } from '../../contexts/DataContext';

export default function InvoiceCreateModal({ isOpen, onClose, onCreated, prefill }: Props) {
  const { profile } = useAuth();
  const { refresh } = useGlobalData();
  const { toast } = useToast();
  const businessId = profile?.business_id ?? '';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'weekly'|'biweekly'|'monthly'|'quarterly'>('monthly');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [dupeChecked, setDupeChecked] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [invoiceSeq, setInvoiceSeq] = useState<{ prefix: string; last_number: number } | null>(null);
  const [stockAlerts, setStockAlerts] = useState<Record<string, string>>({});
  const [managerOverride, setManagerOverride] = useState(false);
  const [showOverridePrompt, setShowOverridePrompt] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');


  // Inline Customer Addition
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', gstin: '', state: '' });
  const [contactSaving, setContactSaving] = useState(false);

  // Inline Product Addition
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', selling_price: 0, cost_price: 0, quantity: 1, tax_rate: 18, unit: 'pcs' });
  const [productSaving, setProductSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const handleQuickAddContact = async () => {
    if (!newContact.name || !newContact.phone || !businessId) return;
    setContactSaving(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          business_id: businessId,
          name: newContact.name.trim(),
          phone: newContact.phone.trim(),
          email: newContact.email.trim() || null,
          state: newContact.state.trim() || null,
          gstin: newContact.gstin.trim() || null,
          credit_score: 750,
          type: 'customer'
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setContacts(prev => [data, ...prev]);
        setSelectedContact(data);
        setShowAddContactForm(false);
        setNewContact({ name: '', phone: '', email: '', gstin: '', state: '' });
      }
    } catch (e: any) {
      toast(e.message || "Failed to add customer", "error");
    } finally {
      setContactSaving(false);
    }
  };

  const handleQuickAddProduct = async () => {
    if (!newProduct.name || !newProduct.selling_price || !businessId) return;
    setProductSaving(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          business_id: businessId,
          name: newProduct.name.trim(),
          selling_price: newProduct.selling_price,
          cost_price: newProduct.cost_price,
          quantity: newProduct.quantity,
          unit: newProduct.unit.trim() || 'pcs',
          gst_rate: newProduct.tax_rate ?? 18
        }])
        .select()
        .single();

      if (error) throw error;

      if (data?.id) {
        // Create stock row
        await supabase.from('stock').insert([{
          product_id: data.id,
          business_id: businessId,
          quantity: newProduct.quantity
        }]);

        // Add to local products state for select dropdown
        setProducts(prev => [data, ...prev]);

        // Auto add to current line items
        setLineItems(prev => [...prev, {
          product_id: data.id,
          name: data.name,
          quantity: 1,
          unit_price: data.selling_price,
          cost_price: data.cost_price ?? 0,
          tax_rate: newProduct.tax_rate ?? 18,
          unit: data.unit ?? 'pcs',
          available_stock: newProduct.quantity,
        }]);

        setShowAddProductForm(false);
        setNewProduct({ name: '', selling_price: 0, cost_price: 0, quantity: 1, tax_rate: 18, unit: 'pcs' });
      }
    } catch (e: any) {
      toast(e.message || "Failed to add product", "error");
    } finally {
      setProductSaving(false);
    }
  };

  const { query: acQuery, setQuery: setAcQuery, results: acResults, loading: acLoading } = useSmartAutocomplete(businessId);
  const { duplicate, check: checkDupe, clear: clearDupe } = useDuplicateCheck();
  const total = lineItems.reduce((s, i) => s + i.quantity * i.unit_price * (1 + i.tax_rate / 100), 0);
  const margin = useInvoiceMargin(lineItems);
  const { score: paymentScore, loading: scoringLoading } = usePaymentScore(selectedContact?.id || '', total);
  const { suggestions: upsellItems } = useUpsellSuggestions(
    selectedContact?.id || '',
    lineItems.map(i => i.product_id).filter(Boolean) as string[]
  );

  // Load business & sequence
  useEffect(() => {
    if (!isOpen || !businessId) return;
    supabase.from('businesses').select('*').eq('id', businessId).single().then(({ data }) => setBusinessData(data));
    supabase.from('invoice_sequences').select('prefix, last_number').eq('business_id', businessId).single()
      .then(({ data }) => setInvoiceSeq(data));
    supabase.from('contacts').select('id,name,phone,gstin,state,payment_terms,credit_score').eq('business_id', businessId)
      .order('name').limit(200).then(({ data }) => setContacts(data ?? []));
    supabase.from('products').select('id,name,selling_price,cost_price,quantity,unit').eq('business_id', businessId)
      .order('name').limit(200).then(({ data }) => setProducts(data ?? []));
  }, [isOpen, businessId]);

  // Prefill from "bill like last time"
  useEffect(() => {
    if (prefill?.items) {
      setLineItems(prefill.items.map((i: any) => ({
        product_id: i.product_id, name: i.product_name ?? i.name,
        quantity: i.quantity, unit_price: i.unit_price,
        cost_price: 0, tax_rate: i.tax_rate ?? 0, unit: i.unit ?? 'pcs',
      })));
    }
    if (prefill?.contact_id) {
      supabase.from('contacts').select('id,name,phone,gstin,state,payment_terms,credit_score')
        .eq('id', prefill.contact_id).single()
        .then(({ data }) => data && setSelectedContact(data));
    }
  }, [prefill]);

  // Duplicate check trigger
  useEffect(() => {
    if (!selectedContact || lineItems.length === 0) { clearDupe(); return; }
    const t = setTimeout(() => {
      checkDupe(businessId, selectedContact.id, total, lineItems.length);
      setDupeChecked(true);
    }, 500);
    return () => clearTimeout(t);
  }, [selectedContact?.id, total, lineItems.length]);

  const addItem = (item: any) => {
    // Real-time stock check
    if (item.quantity <= 0) {
      setStockAlerts(prev => ({ ...prev, [item.product_id]: 'Out of Stock' }));
      if (item.stock_status === 'out_of_stock') {
        toast(`Cannot add ${item.name} — Zero Stock available. Suggest substitute: Similar items in ${item.category || 'Inventory'}`, "warning");
        return;
      }
    }

    setLineItems(prev => [...prev, {
      product_id: item.product_id, name: item.name,
      quantity: 1, unit_price: item.selling_price,
      cost_price: item.cost_price ?? 0, tax_rate: item.tax_rate ?? 0, unit: item.unit ?? 'pcs',
      available_stock: item.quantity,
    }]);
    setAcQuery('');
    setActiveRow(null);
  };

  const updateItem = (idx: number, field: keyof LineItem, val: any) => {
    setLineItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const removeItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const [walkInName, setWalkInName] = useState('');

  const handleSave = async () => {
    if ((!selectedContact && !walkInName) || lineItems.length === 0 || !businessId || !profile?.id) return;
    
    // Task 3: Manager Override for Low Margin
    const MARGIN_THRESHOLD = 10;
    if (margin.marginPct < MARGIN_THRESHOLD && !managerOverride) {
      setShowOverridePrompt(true);
      return;
    }

    // Final stock validation before saving
    const stockErrors = lineItems.filter(it => it.available_stock !== undefined && it.quantity > it.available_stock);
    if (stockErrors.length > 0 && !managerOverride) {
      toast(`Stock shortage for: ${stockErrors.map(e => e.name).join(', ')}. Please adjust quantities or use override.`, "warning");
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    try {
      console.log("[InvoiceCreate] Executing Atomic Sale RPC...");
      
      const { data, error } = await supabase.rpc('complete_sale_v4', {
        p_business_id: businessId,
        p_user_id: profile.id,
        p_contact_id: selectedContact?.id || null,
        p_invoice_date: new Date().toISOString().split('T')[0],
        p_payment_method: 'cash', // Default for now
        p_notes: notes,
        p_internal_notes: internalNotes,
        p_items: lineItems.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          cost_price: it.cost_price,
          tax_rate: it.tax_rate
        })),
        p_payment_status: paymentStatus
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Sale failed at database level");

      console.log("[InvoiceCreate] Sale Successful:", data);

      if (isRecurring) {
        const nextDate = new Date();
        if (recurringInterval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (recurringInterval === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
        else if (recurringInterval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else nextDate.setMonth(nextDate.getMonth() + 3);
        
        await supabase.from('recurring_schedule').insert({
          business_id: businessId,
          template_invoice_id: data.invoice_id,
          interval: recurringInterval,
          next_run_date: nextDate.toISOString().split('T')[0],
        });
      }

      setSaveStatus('success');
      
      // Instant Global Refresh
      refresh('invoices');
      refresh('products');
      refresh('ledger_entries');

      setTimeout(() => {
        onCreated();
        onClose();
        setSaving(false);
        setSaveStatus('idle');
      }, 1500);
    } catch (e: any) {
      console.error("[InvoiceCreate] Error:", e);
      toast(e.message || "Failed to save invoice", "error");
      setSaveStatus('error');
      setTimeout(() => {
        setSaving(false);
        setSaveStatus('idle');
      }, 2000);
    }
  };

  const marginColor = margin.marginLabel === 'healthy' ? 'bg-green-500'
    : margin.marginLabel === 'low' ? 'bg-amber-400' : 'bg-red-500';
  const marginBarW = Math.min(100, Math.max(0, margin.marginPct));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] flex items-start justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white border border-slate-200/80 shadow-[0_24px_70px_rgba(15,23,42,0.15)] rounded-3xl overflow-hidden text-slate-800 my-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-100 text-slate-900">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[8px] font-black text-[#0A84FF] uppercase tracking-[0.3em]">Invoice Suite</div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-950">Create Invoice</h3>
              </div>
              {invoiceSeq && (
                <div className="bg-[#0A84FF]/10 px-2.5 py-0.5 border border-[#0A84FF]/20 rounded-md">
                  <span className="text-[9px] font-black text-[#0A84FF] uppercase">Next: {invoiceSeq.prefix}-{(invoiceSeq.last_number + 1).toString().padStart(4, '0')}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 border border-slate-200 hover:border-[#0A84FF] rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white transition-all">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* Top Selectors (Stacked Vertically) */}
            <div className="flex flex-col gap-3.5">
              {/* Customer Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Customer <span className="text-[#0A84FF]">*</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedContact?.id ?? ''}
                    onChange={e => {
                      const c = contacts.find(c => c.id === e.target.value) ?? null;
                      setSelectedContact(c);
                      clearDupe();
                      setDupeChecked(false);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                  >
                    <option value="">— Select Customer —</option>
                    {contacts.map(c => <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddContactForm(!showAddContactForm);
                      setShowAddProductForm(false);
                    }}
                    className={`px-3 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wider border transition-all flex items-center gap-1 ${showAddContactForm ? 'bg-[#0A84FF] border-[#0A84FF] text-white' : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'}`}
                  >
                    <Plus size={12} /> Add New
                  </button>
                </div>
                {!selectedContact && !showAddContactForm && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                    <input 
                      placeholder="Or Write Customer Name here..." 
                      value={walkInName}
                      onChange={e => setWalkInName(e.target.value)}
                      className="w-full bg-indigo-50/30 border border-indigo-100 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all placeholder:text-slate-400"
                    />
                  </motion.div>
                )}
              </div>

              {/* Product Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Add Item <span className="text-[#0A84FF]">*</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <select
                    value=""
                    onChange={e => {
                      if (!e.target.value) return;
                      const p = products.find(prod => prod.id === e.target.value);
                      if (p) {
                        addItem({
                          product_id: p.id,
                          name: p.name,
                          selling_price: p.selling_price,
                          cost_price: p.cost_price,
                          quantity: p.quantity,
                          unit: p.unit
                        });
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                  >
                    <option value="">— Select Product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} className="bg-white text-slate-900">
                        {p.name} (₹{p.selling_price} | Stock: {p.quantity ?? 0})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProductForm(!showAddProductForm);
                      setShowAddContactForm(false);
                    }}
                    className={`px-3 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wider border transition-all flex items-center gap-1 ${showAddProductForm ? 'bg-[#0A84FF] border-[#0A84FF] text-white' : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'}`}
                  >
                    <Plus size={12} /> Add New
                  </button>
                </div>
              </div>
            </div>

            {/* Inline Add Customer Form */}
            <AnimatePresence>
              {showAddContactForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 my-1">
                    <div className="text-[9px] font-black text-[#0A84FF] uppercase tracking-wider">Quick Register Customer</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Name *" value={newContact.name} onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="Phone (For SMS/WA) *" value={newContact.phone} onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="Email" value={newContact.email} onChange={e => setNewContact(prev => ({ ...prev, email: e.target.value }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="State" value={newContact.state} onChange={e => setNewContact(prev => ({ ...prev, state: e.target.value }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                    </div>
                    <input placeholder="GSTIN (Optional)" value={newContact.gstin} onChange={e => setNewContact(prev => ({ ...prev, gstin: e.target.value }))} className="w-full bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowAddContactForm(false)} className="px-2.5 py-1 rounded text-[9px] font-bold uppercase text-slate-400">Cancel</button>
                      <button type="button" onClick={handleQuickAddContact} disabled={contactSaving || !newContact.name || !newContact.phone} className="px-3 py-1 bg-[#0A84FF] text-white font-bold text-[9px] uppercase rounded transition-all disabled:opacity-50">Save Customer</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline Add Product Form */}
            <AnimatePresence>
              {showAddProductForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 my-1">
                    <div className="text-[9px] font-black text-[#0A84FF] uppercase tracking-wider">Quick Register Product</div>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Product Name *" value={newProduct.name} onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="Price (₹) *" type="number" value={newProduct.selling_price || ''} onChange={e => setNewProduct(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="Cost (₹)" type="number" value={newProduct.cost_price || ''} onChange={e => setNewProduct(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="Stock *" type="number" value={newProduct.quantity || ''} onChange={e => setNewProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="Tax (%)" type="number" value={newProduct.tax_rate || ''} onChange={e => setNewProduct(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 18 }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="Unit" value={newProduct.unit} onChange={e => setNewProduct(prev => ({ ...prev, unit: e.target.value }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowAddProductForm(false)} className="px-2.5 py-1 rounded text-[9px] font-bold uppercase text-slate-400">Cancel</button>
                      <button type="button" onClick={handleQuickAddProduct} disabled={productSaving || !newProduct.name || !newProduct.selling_price || !newProduct.quantity} className="px-3 py-1 bg-[#0A84FF] text-white font-bold text-[9px] uppercase rounded transition-all disabled:opacity-50">Save Product</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Customer Credit Card / Suggestions banner inline (saves space) */}
            {selectedContact && (
              <div className="flex gap-2 items-center text-[10px]">
                <div className="flex-1 bg-slate-50 px-3 py-1.5 border border-slate-100 rounded-lg font-bold text-slate-600">
                  Customer Active Credit Limit Mapping & CLV active.
                </div>
                {paymentScore?.suggestion && (
                  <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg font-black text-indigo-600 uppercase">
                    AI: {paymentScore.suggestion}
                  </div>
                )}
              </div>
            )}

            {/* Duplicate Warning */}
            <AnimatePresence>
              {duplicate && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${duplicate.similarity_score >= 80 ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                    <AlertTriangle size={14} className={duplicate.similarity_score >= 80 ? 'text-red-500' : 'text-amber-500'} />
                    <span className="font-bold">Duplicate Match (₹{duplicate.total_amount?.toLocaleString('en-IN')}) {Math.round((Date.now() - new Date(duplicate.created_at).getTime()) / 60000)} min ago.</span>
                    <button onClick={clearDupe} className="ml-auto text-[9px] font-black uppercase underline">Dismiss</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Line Items Table */}
            {lineItems.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-48 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                      {['Item', 'Qty', 'Price', 'Tax %', 'Total', 'Margin', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-[9px] font-black uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => {
                      const rowTotal = item.quantity * item.unit_price * (1 + item.tax_rate / 100);
                      const marginPct = item.cost_price > 0
                        ? Math.round(((item.unit_price - item.cost_price) / item.unit_price) * 1000) / 10
                        : null;
                      const isBelowCost = marginPct !== null && marginPct < 0;
                      const isLowMargin = marginPct !== null && marginPct >= 0 && marginPct < 10;
                      return (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-all">
                          <td className="px-3 py-1.5 font-bold uppercase text-slate-900 max-w-[150px] truncate">{item.name}</td>
                          <td className="px-2 py-1">
                            <input type="number" min="0.01" step="0.01"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-14 bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-1 text-xs font-black text-center outline-none rounded-md text-slate-900"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input type="number" min="0" step="0.01"
                              value={item.unit_price}
                              onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-20 bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-1 text-xs font-black text-center outline-none rounded-md text-slate-900"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input type="number" min="0" max="28"
                              value={item.tax_rate}
                              onChange={e => updateItem(idx, 'tax_rate', parseFloat(e.target.value) || 0)}
                              className="w-10 bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-1 text-[10px] font-black text-center outline-none rounded-md text-slate-900"
                            />
                          </td>
                          <td className="px-3 py-1.5 font-black text-slate-900">₹{rowTotal.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</td>
                          <td className="px-2 py-1">
                            {marginPct !== null && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                isBelowCost ? 'bg-red-50 text-red-600 border-red-100' :
                                isLowMargin ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-green-50 text-green-600 border-green-100'
                              }`}>
                                {marginPct}%
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1">
                            <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom: Deal Health & Invoice Total (Stacked Vertically) */}
            <div className="flex flex-col gap-3">
              {/* Deal Health Analysis */}
              {lineItems.length > 0 ? (
                <div className={`border p-3 rounded-xl transition-all duration-300 flex flex-col justify-center ${
                  margin.marginLabel === 'healthy' ? 'border-green-100 bg-green-50/30' :
                  margin.marginLabel === 'low' ? 'border-amber-100 bg-amber-50/30' : 'border-red-100 bg-red-50/30'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Deal Health</span>
                    <span className={`text-[10px] font-black ${margin.marginLabel === 'healthy' ? 'text-green-600' : margin.marginLabel === 'low' ? 'text-amber-600' : 'text-red-600'}`}>
                      {margin.marginPct}% Margin
                    </span>
                  </div>
                  <div className="text-xs font-black uppercase text-slate-900">
                    {margin.marginLabel === 'healthy' ? '✓ Premium Deal Approved' : margin.marginLabel === 'low' ? '⚠️ Standard Profit Deal' : '⛔ High Risk Deal'}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 p-3 rounded-xl flex items-center justify-center text-xs text-slate-400 font-bold">
                  No line items added yet.
                </div>
              )}

              {/* Invoice Total */}
              <div className="bg-slate-900 border border-slate-800 p-3 flex justify-between items-center rounded-xl shadow">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total</div>
                <div className="text-xl font-black text-[#0A84FF]">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            {/* Notes Section (Stacked Vertically) */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider block mb-1">Customer Notes</label>
                <textarea rows={1} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Notes shown on PDF..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2 text-xs font-medium outline-none rounded-xl text-slate-900 transition-all resize-none shadow-sm"
                />
              </div>
              <div className="border-l-2 border-[#0A84FF] pl-2">
                <label className="text-[9px] font-black uppercase text-[#0A84FF] tracking-wider block mb-1 flex items-center gap-1">
                  <Lock size={9} /> Private Note
                </label>
                <textarea rows={1} value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
                  maxLength={500}
                  placeholder="Internal team note..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2 text-xs font-medium outline-none rounded-xl text-slate-900 transition-all resize-none shadow-sm"
                />
              </div>
            </div>

            {/* Recurring Toggle (More Compact) */}
            <div className="border border-slate-200 p-3 bg-slate-50/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat size={14} className={isRecurring ? 'text-[#0A84FF]' : 'text-slate-400'} />
                <span className="text-xs font-black uppercase tracking-tight text-slate-600">Make Recurring Invoice</span>
              </div>
              <div className="flex items-center gap-3">
                <AnimatePresence>
                  {isRecurring && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex gap-1.5">
                      {(['weekly', 'monthly'] as const).map(iv => (
                        <button key={iv} onClick={() => setRecurringInterval(iv)}
                          className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider border rounded-md transition-all ${
                            recurringInterval === iv ? 'bg-[#0A84FF] text-white border-[#0A84FF]' : 'bg-white text-slate-500 border-slate-200'
                          }`}
                        >
                          {iv}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-10 h-5 border rounded-full transition-all relative ${isRecurring ? 'bg-[#0A84FF] border-[#0A84FF]' : 'bg-slate-200 border-slate-300'}`}
                >
                  <motion.div
                    animate={{ x: isRecurring ? 20 : 2 }}
                    className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>

            {/* Payment Status Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`py-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentStatus === 'paid' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 grayscale opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStatus === 'paid' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <CheckCircle size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Mark as Paid</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('unpaid')}
                className={`py-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentStatus === 'unpaid' 
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 grayscale opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStatus === 'unpaid' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <AlertTriangle size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Mark as Unpaid</span>
              </button>
            </div>

            {/* Actions (Tighter padding) */}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-all">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedContact || lineItems.length === 0}
                className="flex-grow py-2.5 bg-[#0A84FF] hover:bg-[#0070E3] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-[#0A84FF]/20"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5 justify-center"><RefreshCw size={12} className="animate-spin" /> Saving...</span>
                ) : (
                  <span className="flex items-center gap-1.5 justify-center">
                    <CheckCircle size={12} /> Save Invoice
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Premium Saving Animation Overlay */}
          <AnimatePresence>
            {saving && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-[1200] flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 15 }}
                  className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-6"
                >
                  <div className="relative flex items-center justify-center">
                    {saveStatus === 'success' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                      >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    ) : saveStatus === 'error' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20"
                      >
                        <X className="text-white" size={32} />
                      </motion.div>
                    ) : (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute w-20 h-20 bg-[#0A84FF]/20 rounded-full"
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                          className="w-14 h-14 border-4 border-[#0A84FF] border-t-transparent rounded-full relative z-10 shadow-md"
                        />
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                      {saveStatus === 'success' ? 'Invoice Registered!' : saveStatus === 'error' ? 'Failed to Save' : 'Syncing with Database'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                      {saveStatus === 'success' 
                        ? `Invoice generated successfully!` 
                        : saveStatus === 'error'
                        ? `Please check your inputs`
                        : `Generating Invoice...`}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
