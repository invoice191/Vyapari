import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, RefreshCw, Lock, AlertTriangle, CheckCircle, Repeat, Zap, ShieldCheck, 
  Camera, Upload, Image as ImageIcon 
} from 'lucide-react';
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

import { useGlobalData } from '../../context/DataContext';

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
  const [vpodImage, setVpodImage] = useState<File | null>(null);
  const [vpodPreview, setVpodPreview] = useState<string | null>(null);
  const [uploadingVpod, setUploadingVpod] = useState(false);
  const [dupeChecked, setDupeChecked] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [invoiceSeq, setInvoiceSeq] = useState<{ prefix: string; last_number: number } | null>(null);
  const [stockAlerts, setStockAlerts] = useState<Record<string, string>>({});
  const [managerOverride, setManagerOverride] = useState(false);
  const [showOverridePrompt, setShowOverridePrompt] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [aiDiscountApplied, setAiDiscountApplied] = useState(false);


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

  const handleVpodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVpodImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVpodPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadVpod = async (invoiceNo: string) => {
    if (!vpodImage) return null;
    setUploadingVpod(true);
    try {
      const fileExt = vpodImage.name.split('.').pop();
      const fileName = `${businessId}/${invoiceNo}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('vpod-proofs')
        .upload(fileName, vpodImage);

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('vpod-proofs')
        .getPublicUrl(data.path);
        
      return publicUrl;
    } catch (err) {
      console.error("vPOD Upload Failed:", err);
      return null;
    } finally {
      setUploadingVpod(false);
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

  // Reset Payment Status if risk is too high
  useEffect(() => {
    if (paymentScore?.risk_level === 'high' && !managerOverride) {
      setPaymentStatus('paid'); // Force upfront payment
    }
  }, [paymentScore?.risk_level, managerOverride]);

  const applyDynamicDiscount = () => {
    if (aiDiscountApplied || total === 0) return;
    
    // AI determines the exact discount needed to secure cash flow today
    const dynamicRate = paymentScore?.risk_level === 'high' ? 4.5 : 2.0; 
    const discountAmount = -(total * (dynamicRate / 100));
    
    setLineItems(prev => [...prev, {
      product_id: 'dynamic-discount', // Pseudo ID
      name: `⚡ AI Early-Payment Discount (${dynamicRate}%)`,
      quantity: 1,
      unit_price: discountAmount,
      cost_price: 0,
      tax_rate: 0, // Discounts usually don't have tax in this simple model, or are post-tax
      unit: 'discount'
    }]);
    setAiDiscountApplied(true);
    setPaymentStatus('paid'); // Securing the cash
    toast(`Dynamic Early-Payment Discount of ${dynamicRate}% applied to secure immediate cash flow.`, "success");
  };

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
        toast(`Cannot add ${item.name} - Zero Stock available. Suggest substitute: Similar items in ${item.category || 'Inventory'}`, "warning");
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
      // 1. Upload vPOD if exists
      let uploadedVpodUrl = null;
      if (vpodImage) {
        uploadedVpodUrl = await uploadVpod(`TEMP_${Date.now()}`);
      }

      const { data, error } = await supabase.rpc('complete_sale_v5', {
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
        p_payment_status: paymentStatus,
        p_vpod_url: uploadedVpodUrl,
        p_customer_name: walkInName || selectedContact?.name || null
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
                    <option value="">- Select Customer -</option>
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
                    <option value="">- Select Product -</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} className="bg-white text-slate-900">
                        {p.name} (Rs.{p.selling_price} | Stock: {p.quantity ?? 0})
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
                      <input placeholder="Price (Rs.) *" type="number" value={newProduct.selling_price || ''} onChange={e => setNewProduct(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
                      <input placeholder="Cost (Rs.)" type="number" value={newProduct.cost_price || ''} onChange={e => setNewProduct(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))} className="bg-white border border-slate-200 focus:border-[#0A84FF] p-2 rounded-lg text-xs outline-none text-slate-900" />
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
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center text-[10px]">
                  <div className="flex-1 bg-slate-50 px-3 py-1.5 border border-slate-100 rounded-lg font-bold text-slate-600 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-indigo-500" />
                    Customer Active Credit Limit Mapping & CLV active.
                  </div>
                  {paymentScore?.suggestion && (
                    <div className={`px-3 py-1.5 rounded-lg font-black uppercase flex items-center gap-2 ${
                      paymentScore.risk_level === 'high' ? 'bg-red-50 border border-red-200 text-red-600' :
                      paymentScore.risk_level === 'medium' ? 'bg-amber-50 border border-amber-200 text-amber-600' :
                      'bg-emerald-50 border border-emerald-200 text-emerald-600'
                    }`}>
                      <AlertTriangle size={14} /> AI Risk: {paymentScore.risk_level}
                    </div>
                  )}
                </div>
                {paymentScore?.risk_level === 'high' && !managerOverride && (
                  <div className="bg-red-50 border border-red-100 p-2.5 rounded-lg text-[10px] font-black text-red-600 uppercase flex items-center gap-2 animate-pulse">
                    <Lock size={12} /> Credit Restricted: 100% Upfront Payment Required due to high default risk.
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
                    <span className="font-bold">Duplicate Match (Rs.{duplicate.total_amount?.toLocaleString('en-IN')}) {Math.round((Date.now() - new Date(duplicate.created_at).getTime()) / 60000)} min ago.</span>
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
                          <td className="px-3 py-1.5 font-black text-slate-900">Rs.{rowTotal.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</td>
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

            {/* Upsell Suggestions */}
            {upsellItems.length > 0 && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-wider">
                  <Plus size={10} /> Smart Suggestions
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {upsellItems.map((item: any) => (
                    <button 
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="flex-shrink-0 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    >
                      {item.name} <span className="text-indigo-500">Rs.{item.selling_price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom: Deal Health & Invoice Total (Stacked Vertically) */}
            <div className="flex flex-col gap-3">
              {/* Credit Limit Warning */}
              {selectedContact && (selectedContact as any).credit_limit && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${(selectedContact as any).current_outstanding + total > (selectedContact as any).credit_limit ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                  <AlertTriangle size={14} className={(selectedContact as any).current_outstanding + total > (selectedContact as any).credit_limit ? 'text-red-500' : 'text-emerald-500'} />
                  <div className="flex-1">
                    <div className="font-bold uppercase text-[9px]">Credit Integrity</div>
                    <div className="text-[10px]">
                      Limit: Rs.{(selectedContact as any).credit_limit?.toLocaleString()} | 
                      Used: Rs.{((selectedContact as any).current_outstanding || 0 + total).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

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
                    {margin.marginLabel === 'healthy' ? '- Premium Deal Approved' : margin.marginLabel === 'low' ? '-- Standard Profit Deal' : '- High Risk Deal'}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 p-3 rounded-xl flex items-center justify-center text-xs text-slate-400 font-bold">
                  No line items added yet.
                </div>
              )}

              {/* Dynamic Discount Trigger */}
              {total > 0 && !aiDiscountApplied && paymentScore && (
                <button 
                  onClick={applyDynamicDiscount}
                  className="w-full p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl flex items-center justify-between group hover:from-indigo-100 hover:to-blue-100 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-md">
                      <Zap size={12} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                      Generate Dynamic Cash-Flow Discount
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase">Click to Apply</span>
                </button>
              )}

              {/* Invoice Total & GST Breakdown */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">Subtotal</div>
                  <div className="text-sm font-bold text-slate-300">Rs.{lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0).toLocaleString('en-IN')}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex justify-between">
                    <span>CGST ({lineItems.length > 0 ? lineItems[0].tax_rate / 2 : 9}%)</span>
                    <span className="text-slate-400">Rs.{(total - lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)) / 2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({lineItems.length > 0 ? lineItems[0].tax_rate / 2 : 9}%)</span>
                    <span className="text-slate-400">Rs.{(total - lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)) / 2}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white">Grand Total</div>
                  <div className="text-2xl font-black text-[#0A84FF] tracking-tighter">Rs.{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                </div>
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
                onClick={() => {
                  if (paymentScore?.risk_level === 'high' && !managerOverride) {
                    toast("Credit is locked for this customer. Manager override required.", "error");
                    return;
                  }
                  setPaymentStatus('unpaid');
                }}
                disabled={paymentScore?.risk_level === 'high' && !managerOverride}
                className={`py-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentStatus === 'unpaid' 
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 grayscale opacity-60'
                } ${paymentScore?.risk_level === 'high' && !managerOverride ? 'cursor-not-allowed opacity-30' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStatus === 'unpaid' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {paymentScore?.risk_level === 'high' && !managerOverride ? <Lock size={18} /> : <AlertTriangle size={18} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Mark as Unpaid</span>
              </button>
            </div>
            {/* vPOD - Visual Proof of Delivery */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <Camera size={12} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Proof of Delivery (vPOD)</span>
                </div>
                {vpodPreview && (
                  <button onClick={() => { setVpodImage(null); setVpodPreview(null); }} className="text-[9px] font-bold text-rose-500 uppercase">Clear</button>
                )}
              </div>
              
              {!vpodPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Snap photo of delivery</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleVpodChange} capture="environment" />
                </label>
              ) : (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={vpodPreview} alt="vPOD" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                    <ImageIcon className="text-white" size={24} />
                  </div>
                </div>
              )}
            </div>

            {/* Actions (Tighter padding) */}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-all">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (!selectedContact && !walkInName.trim()) || lineItems.length === 0}
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
