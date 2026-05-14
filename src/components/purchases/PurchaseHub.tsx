import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Package,
  User,
  FileText,
  IndianRupee,
  Sparkles
} from 'lucide-react';
import { useGlobalData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { purchaseService } from '../../services/purchaseService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Placeholder child views for full implementation next
const PurchaseOrderList = ({ orders, loading, onCreateNew, onVendorClick, onOrderClick }: any) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter((o: any) => 
    o.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (s: string) => {
    switch(s?.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'received': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Orders', val: orders.filter((o: any) => o.status === 'pending').length, icon: Clock, color: 'amber' },
          { label: 'Fulfilled (30d)', val: orders.filter((o: any) => o.status === 'received').length, icon: CheckCircle2, color: 'emerald' },
          { label: 'Monthly Spend', val: 'INR ' + orders.reduce((s: any, o: any) => s + Number(o.total_amount || 0), 0).toLocaleString(), icon: IndianRupee, color: 'indigo' },
          { label: 'Avg. Lead Time', val: '3.2 Days', icon: Calendar, color: 'blue' },
        ].map((st, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white/40 shadow-sm group hover:shadow-xl transition-all"
          >
            <div className={`w-10 h-10 rounded-2xl bg-${st.color}-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <st.icon size={20} className={`text-${st.color}-600`} />
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900">{st.val}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{st.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search/Actions Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search PO number, Vendor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <Filter size={14} /> Filters
          </button>
          <button 
            onClick={onCreateNew}
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_25px_-5px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> New Purchase Order
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Summoning Logistical Data...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Purchase Orders Found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">We couldn't find any orders matching your criteria.</p>
            <button 
              onClick={onCreateNew}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg inline-flex items-center gap-2"
            >
              <Plus size={14} /> Create New Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">PO Detail</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Vendor</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Expected</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Total Amt</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any, idx: number) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onOrderClick(order)}
                    className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-50 last:border-none cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm">{order.po_number || 'Draft PO'}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{format(new Date(order.created_at), 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 cursor-pointer" onClick={(e) => { e.stopPropagation(); onVendorClick(order.supplier); }}>
                      <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl transition-colors">
                        <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 text-[10px] font-black">
                          {order.supplier?.name?.charAt(0) || 'V'}
                        </div>
                        <div className="font-bold text-slate-700 text-sm hover:text-indigo-600 transition-colors">{order.supplier?.name || 'Unknown Vendor'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                        <Calendar size={14} className="text-slate-400" />
                        {order.expected_delivery ? format(new Date(order.expected_delivery), 'MMM dd, yyyy') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="font-black text-slate-900 text-sm">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// COMPONENT: CreatePurchaseOrder Modal/Slide-over
const CreatePurchaseOrder = ({ isOpen, onClose, onSuccess, prefill }: any) => {
  const { contacts, products } = useGlobalData();
  const { business, user } = useAuth();
  const [formData, setFormData] = useState({
    supplierId: '',
    poNumber: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
    expectedDelivery: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    notes: ''
  });

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (prefill && isOpen) {
      setFormData(prev => ({
        ...prev,
        supplierId: prefill.supplier_id || '',
      }));
      if (prefill.items) {
        setItems(prefill.items.map((i: any) => ({
          productId: i.product_id || '',
          quantity: i.quantity || 1,
          unitCost: i.unit_cost || 0
        })));
      }
    }
  }, [prefill, isOpen]);
  const [loading, setLoading] = useState(false);

  const suppliers = contacts.filter((c: any) => c.type === 'supplier' || c.type === 'both');

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitCost: 0 }]);
  };

  const updateItem = (idx: number, key: string, val: any) => {
    const copy = [...items];
    copy[idx][key] = val;
    // Auto fill unit cost if product chosen
    if (key === 'productId' && val) {
      const prod = products.find((p: any) => p.id === val);
      if (prod) copy[idx].unitCost = prod.cost_price || 0;
    }
    setItems(copy);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) return toast.error("Please select a supplier");
    if (items.length === 0) return toast.error("Add at least one item");
    
    setLoading(true);
    try {
      await purchaseService.createPurchaseOrder(business.id, user.id, {
        supplierId: formData.supplierId,
        poNumber: formData.poNumber,
        expectedDelivery: formData.expectedDelivery,
        notes: formData.notes,
        items: items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost)
        }))
      });
      toast.success("Purchase Order Dispatched successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Logistical Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-50 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white flex flex-col my-auto"
      >
        <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">NEW PURCHASE ORDER</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Initiate procurement deployment</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center font-bold text-slate-400 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* Meta info row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="font-black text-[10px] uppercase tracking-widest text-slate-500 block ml-1">Select Supplier</label>
              <select 
                required
                value={formData.supplierId}
                onChange={e => setFormData({...formData, supplierId: e.target.value})}
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none transition-all"
              >
                <option value="">Select Vendor...</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-black text-[10px] uppercase tracking-widest text-slate-500 block ml-1">PO Number</label>
              <input 
                type="text" 
                required
                value={formData.poNumber}
                onChange={e => setFormData({...formData, poNumber: e.target.value})}
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="font-black text-[10px] uppercase tracking-widest text-slate-500 block ml-1">Expected Arrival</label>
              <input 
                type="date" 
                required
                value={formData.expectedDelivery}
                onChange={e => setFormData({...formData, expectedDelivery: e.target.value})}
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Line Items Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
              <span className="font-black text-[10px] uppercase tracking-widest text-slate-900 flex items-center gap-2"><Package size={14}/> Ordered Material</span>
              <button type="button" onClick={addItem} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">+ Add SKU</button>
            </div>
            
            <div className="p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold text-sm italic border-2 border-dashed border-slate-200 rounded-2xl">No items staged for order.</div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="col-span-5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Product</label>
                      <select 
                        required
                        value={item.productId}
                        onChange={e => updateItem(idx, 'productId', e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                      >
                        <option value="">Select SKU...</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Qty</label>
                      <input 
                        type="number" 
                        min="1"
                        required
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit Cost (INR)</label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        required
                        value={item.unitCost}
                        onChange={e => updateItem(idx, 'unitCost', Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-right"
                      />
                    </div>
                    <div className="col-span-2 flex flex-col items-end gap-1">
                      <span className="text-[9px] font-black text-slate-400">Subtotal</span>
                      <div className="flex items-center gap-2 w-full justify-end">
                        <div className="font-black text-slate-900 text-sm">₹{(item.quantity * item.unitCost).toLocaleString()}</div>
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1">✕</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                <span className="font-black text-xs uppercase tracking-widest opacity-60">Estimated Gross Total</span>
                <span className="text-2xl font-black">₹{items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div>
            <label className="font-black text-[10px] uppercase tracking-widest text-slate-500 block ml-1 mb-2">Administrative Notes</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Specify delivery protocol, pack sizes, etc..."
              rows={3}
              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Abort Mission
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(79,70,229,0.6)] disabled:opacity-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Broadcasting Orders..." : "CONFIRM & SEND ORDER"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// COMPONENT: PurchaseOrderDetailModal
const PurchaseOrderDetailModal = ({ order, isOpen, onClose, onStatusUpdate }: any) => {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus: 'pending' | 'sent' | 'received' | 'cancelled') => {
    setUpdating(true);
    try {
      await purchaseService.updatePOStatus(order.id, newStatus);
      toast.success(`Order status escalated to ${newStatus.toUpperCase()}!`);
      onStatusUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(`System Error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200/50 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white relative">
          <button onClick={onClose} className="absolute right-8 top-8 text-white/60 hover:text-white transition-colors font-black">✕</button>
          <div className="flex items-center gap-3 mb-2 opacity-60">
            <FileText size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">LOGISTICS VERIFICATION</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight uppercase">{order.po_number || 'DRAFT PO'}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
              Status: {order.status}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
              Exp. Delivery: {order.expected_delivery ? format(new Date(order.expected_delivery), 'MMM dd, yyyy') : 'N/A'}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Vendor & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">SUPPLIER DETAILS</span>
              <div className="font-black text-lg text-slate-900">{order.supplier?.name || 'Unknown Supplier'}</div>
              <div className="text-slate-600 font-bold text-xs mt-1">{order.supplier?.email || 'No Email Linked'}</div>
              <div className="text-slate-600 font-bold text-xs mt-0.5">{order.supplier?.phone || 'No Phone Linked'}</div>
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex flex-col justify-center">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">GROSS VALUATION</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">ITEMIZED MANIFEST</span>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
              {order.items?.length > 0 ? order.items.map((it: any, idx: number) => (
                <div key={it.id || idx} className="flex justify-between items-center border border-slate-100 p-4 rounded-2xl hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="font-black text-slate-900 text-sm">{it.product?.name || 'Product Stream'}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-1">QTY: {it.quantity} @ ₹{Number(it.unit_cost || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="font-black text-slate-900">₹{(Number(it.quantity || 0) * Number(it.unit_cost || 0)).toLocaleString('en-IN')}</div>
                </div>
              )) : (
                <div className="text-slate-400 italic text-xs">No items registered in manifest.</div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          {order.notes && (
            <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1 mb-1">
                <AlertTriangle size={12} /> Logistics Memo
              </span>
              <p className="text-slate-700 text-xs font-medium">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">STATE CONTROLS</span>
            <div className="grid grid-cols-3 gap-3">
              <button 
                disabled={updating || order.status === 'sent'}
                onClick={() => handleStatusChange('sent')}
                className="py-3.5 border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Clock size={14} /> Dispatch PO
              </button>
              <button 
                disabled={updating || order.status === 'received'}
                onClick={() => handleStatusChange('received')}
                className="py-3.5 border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} /> Receive Goods
              </button>
              <button 
                disabled={updating || order.status === 'cancelled'}
                onClick={() => handleStatusChange('cancelled')}
                className="py-3.5 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
              >
                ✕ Retract Order
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// MAIN COMPONENT DEFAULT EXPORT
export default function PurchaseHub() {
  const { business } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [prefill, setPrefill] = useState<any>(null);

  useEffect(() => {
    const handleGlobalNav = (e: any) => {
      if (e.detail?.module === 'purchases' && e.detail?.props) {
        const { mode, prefill } = e.detail.props;
        if (mode === 'create') {
          setPrefill(prefill);
          setIsCreating(true);
        }
      }
    };
    window.addEventListener('app:navigate', handleGlobalNav);
    return () => window.removeEventListener('app:navigate', handleGlobalNav);
  }, []);

  const fetchData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const data = await purchaseService.getPurchaseOrders(business.id);
      setOrders(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync logical stream from Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [business]);

  const tabs = [
    { id: 'orders', label: 'Purchase Orders', icon: ShoppingBag },
    { id: 'vendors', label: 'Vendor Performance', icon: Star },
    { id: 'analytics', label: 'Price Benchmarking', icon: TrendingUp }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Procurement Hub</h1>
          </div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest pl-13 opacity-80">Source strategic assets with precision Intelligence</p>
        </motion.div>
      </div>

      {/* Custom Styled Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0.5 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-4 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Icon size={14} strokeWidth={isActive ? 3 : 2} />
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.8)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Routing Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'orders' && (
            <PurchaseOrderList 
              orders={orders} 
              loading={loading} 
              onCreateNew={() => setIsCreating(true)} 
              onVendorClick={(supplier: any) => {
                setSelectedVendorId(supplier.id);
                setActiveTab('vendors');
              }}
              onOrderClick={(order: any) => setSelectedOrder(order)}
            />
          )}
          {activeTab === 'vendors' && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg p-8">
              {selectedVendorId ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black">
                      V
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase">Vendor Profile & Intelligence</h3>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">ID: {selectedVendorId.split('-')[0]}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <CheckCircle2 size={16} />
                        <span className="font-black text-[10px] uppercase tracking-widest">Fulfillment Rate</span>
                      </div>
                      <div className="text-3xl font-black text-emerald-700">98.2%</div>
                      <div className="text-[10px] font-bold text-emerald-600/70 mt-2 uppercase">Top Tier Reliability</div>
                    </div>
                    <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-2 text-amber-600 mb-2">
                        <Clock size={16} />
                        <span className="font-black text-[10px] uppercase tracking-widest">Avg Lead Time</span>
                      </div>
                      <div className="text-3xl font-black text-amber-700">3.4 Days</div>
                      <div className="text-[10px] font-bold text-amber-600/70 mt-2 uppercase">Consistent delivery</div>
                    </div>
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <Star size={16} />
                        <span className="font-black text-[10px] uppercase tracking-widest">Vani Score</span>
                      </div>
                      <div className="text-3xl font-black text-indigo-700">A+</div>
                      <div className="text-[10px] font-bold text-indigo-600/70 mt-2 uppercase">Preferred Supplier</div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="font-black text-sm text-slate-900 uppercase tracking-widest mb-4">Price Variance History</h4>
                    <div className="h-48 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                      <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Rendering intelligence chart...</span>
                    </div>
                  </div>

                  <button onClick={() => setSelectedVendorId(null)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800">
                    ← Back to General Overview
                  </button>
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-amber-50 text-amber-400 rounded-3xl flex items-center justify-center mb-2 animate-pulse">
                    <User size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select a Vendor to Inspect</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest max-w-sm">Click on any vendor from the Purchase Orders list to view their dedicated performance and intelligence metrics.</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Price Benchmarking</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Cross-vendor Arbitrage Analysis</p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} /> AI Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-2xl p-6 hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-black text-sm text-slate-900">MacBook Pro M3</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">SKU: APP-MBP-M3</div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest">12% Variance</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold items-center">
                      <span className="text-slate-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> TechCorp India</span>
                      <span className="text-slate-900">₹1,45,000</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold items-center">
                      <span className="text-slate-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Global IT Suppliers</span>
                      <span className="text-slate-900">₹1,58,000</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 italic">Vani Engine recommends shifting allocation to TechCorp India to capture ₹13,000 arbitrage per unit.</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-6 hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-black text-sm text-slate-900">Logitech MX Master 3S</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">SKU: LOG-MXM-3S</div>
                    </div>
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest">Stable</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold items-center">
                      <span className="text-slate-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> OfficeMax Supplies</span>
                      <span className="text-slate-900">₹8,400</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold items-center">
                      <span className="text-slate-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300"></div> TechCorp India</span>
                      <span className="text-slate-900">₹8,550</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 italic">Pricing is consistent across your supply chain. No immediate action required.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isCreating && (
          <CreatePurchaseOrder 
            isOpen={isCreating} 
            onClose={() => { setIsCreating(false); setPrefill(null); }} 
            onSuccess={fetchData}
            prefill={prefill}
          />
        )}
        {selectedOrder && (
          <PurchaseOrderDetailModal 
            order={selectedOrder}
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
