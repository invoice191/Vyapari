import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScanBarcode, 
  User, 
  ShoppingCart, 
  Delete, 
  Minus, 
  Plus, 
  PauseCircle, 
  PlayCircle, 
  CreditCard, 
  Banknote, 
  Grid3X3, 
  List, 
  Search, 
  X,
  ChevronDown,
  Calculator,
  Check,
  Trash2,
  Package,
  Clock,
  BadgePercent,
  Zap,
  ArrowRight,
  UserPlus,
  Wallet,
  QrCode
} from 'lucide-react';
import { useGlobalData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function POSCounterMode() {
  const { products, contacts, categories, refresh } = useGlobalData();
  const { business, user, profile } = useAuth();
  
  // CART STATE
  const [cart, setCart] = useState<any[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // CHECKOUT MODAL STATE
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(true);

  // BARCODE SCANNER BUFFER LISTENER
  const barcodeBuffer = useRef("");
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip scanner processing if focus is in any active text/number inputs, EXCEPT the barcode scanner active listener
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        const code = barcodeBuffer.current.trim();
        if (code) {
          processBarcode(code);
        }
        barcodeBuffer.current = "";
      } else if (e.key.length === 1) { // Only record printable chars
        barcodeBuffer.current += e.key;
        
        // Clear buffer if typing is too slow (human typist instead of scanner)
        const timeoutId = (window as any)._scannerTimeout;
        if (timeoutId) clearTimeout(timeoutId);
        
        (window as any)._scannerTimeout = setTimeout(() => {
          barcodeBuffer.current = "";
        }, 150); // 150ms speed gap means it's very likely a hardware scanner
      }
    };

    if (isScannerActive) {
      window.addEventListener('keydown', handleKeyPress);
    }
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [products, isScannerActive]);

  const processBarcode = (code: string) => {
    const found = products.find((p: any) => 
      (p.barcode && p.barcode === code) || 
      (p.sku && p.sku === code) ||
      (p.upc && p.upc === code)
    );

    if (found) {
      addToCart(found);
      toast.success(`Scanned: ${found.name}`);
    } else {
      toast.error(`Barcode/SKU "${code}" not found.`);
    }
  };

  const addToCart = (product: any) => {
    const stock = Number(product.quantity || 0);
    const existing = cart.find(i => i.id === product.id);
    
    if (existing) {
      if (existing.qty >= stock) {
        toast.error(`Insufficient stock for ${product.name} (Available: ${stock})`);
        return;
      }
      setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      if (stock <= 0) {
        toast.error(`Item ${product.name} is out of stock.`);
        return;
      }
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    const targetItem = cart.find(i => i.id === id);
    if (!targetItem) return;

    const stock = Number(targetItem.quantity || 0);
    const nextQty = targetItem.qty + delta;

    if (nextQty > stock) {
      toast.error(`Cannot add more. Limited stock available (${stock})`);
      return;
    }

    setCart(cart.map(i => {
      if (i.id === id) {
        return { ...i, qty: Math.max(0, nextQty) };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  // Dynamic tax calculation helper based on product attributes
  const getTaxRate = (prod: any) => Number(prod.gst_rate || prod.tax_rate || 18);

  const cartSubtotal = cart.reduce((sum, i) => sum + (Number(i.selling_price || 0) * i.qty), 0);
  
  // Real-time calculated tax based on standard inclusive rates typically used in POS retail
  const totalTax = cart.reduce((sum, item) => {
    const rate = getTaxRate(item);
    const price = Number(item.selling_price || 0);
    // Standard inclusive tax math: Price * (Rate / (100 + Rate))
    const itemTax = (price * item.qty) * (rate / (100 + rate));
    return sum + itemTax;
  }, 0);

  const cartTotal = cartSubtotal; // In Vyapari, selling_price usually denotes final inclusive price.

  // Filter products based on Search Query AND Selected Category
  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory ? (p.category_id === selectedCategory || p.category === selectedCategory) : true;
    
    return matchesSearch && matchesCategory;
  });

  // Filter contacts for selection
  const filteredCustomers = contacts.filter((c: any) => 
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch))
  );

  // ACTIONS
  const holdBill = () => {
    if (cart.length === 0) return;
    const held = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      items: [...cart],
      customer: activeCustomer,
      total: cartTotal
    };
    setHeldBills([...heldBills, held]);
    setCart([]);
    setActiveCustomer(null);
    toast.success("Bill saved for later.");
  };

  const resumeBill = (held: any) => {
    if (cart.length > 0) {
      toast.error("Please complete or hold the current cart first.");
      return;
    }
    setCart(held.items);
    setActiveCustomer(held.customer);
    setHeldBills(heldBills.filter(h => h.id !== held.id));
  };

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
  };

  const finalizeSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    const businessId = profile?.business_id || business?.id;
    const userId = user?.id;

    if (!businessId || !userId) {
      toast.error("Authentication Context Lost. Refresh Page.");
      setIsProcessing(false);
      return;
    }

    try {
      // Map current cart state to backend RPC parameters format
      const { data, error } = await supabase.rpc('complete_sale_v4', {
        p_business_id: businessId,
        p_user_id: userId,
        p_contact_id: activeCustomer?.id || null,
        p_invoice_date: new Date().toISOString().split('T')[0],
        p_payment_method: paymentMethod,
        p_notes: `POS Checkout via Counter Mode. User: ${profile?.name || 'Unknown'}`,
        p_internal_notes: `Counter Session Mode Atomic Transaction. Method: ${paymentMethod.toUpperCase()}`,
        p_items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          unit_price: Number(item.selling_price || 0),
          cost_price: Number(item.cost_price || 0),
          tax_rate: getTaxRate(item)
        })),
        p_payment_status: 'paid' // POS settlements are immediately completed
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Database transaction rejected this checkout.");

      toast.success(`Checkout Successful! Reference: ${data.invoice_id?.substring(0,8)}...`);
      
      // Cleanup State
      setCart([]);
      setActiveCustomer(null);
      setIsCheckingOut(false);
      
      // Refresh central storage state immediately (Triggers React context propagation)
      refresh('invoices');
      refresh('products');
      refresh('ledger_entries');

    } catch (err: any) {
      console.error("[POS Error]: ", err);
      toast.error(err.message || "Failed to sync transaction with backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-160px)] w-full bg-[#0b0f19] border border-slate-800/60 rounded-[2rem] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.4)] relative select-none antialiased">
      
      {/* 1. PRODUCT EXPLORER PORTAL */}
      <div className="flex-1 flex flex-col h-full relative bg-[#070913] border-r border-slate-800/40">
        
        {/* AESTHETIC GHOST BACKGROUND */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.04),transparent_40%)] pointer-events-none" />

        {/* SEARCH & VIEW CONTROLLER HEADER */}
        <div className="h-24 px-8 flex items-center gap-4 z-10 border-b border-slate-800/30">
          
          {/* Barcode Scanner Signal Node */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-inner select-none transition-all">
            <div className={`w-3 h-3 rounded-full shadow-lg ${isScannerActive ? 'bg-emerald-500 animate-pulse shadow-emerald-500/40' : 'bg-slate-600'}`} />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Scanner Status</span>
              <span className="text-[11px] font-bold text-white">{isScannerActive ? "WORKING" : "OFF"}</span>
            </div>
            <button 
              onClick={() => setIsScannerActive(!isScannerActive)}
              className={`ml-1.5 p-1.5 rounded-lg transition-colors ${isScannerActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              title={isScannerActive ? "Disable auto listener" : "Enable auto listener"}
            >
              <ScanBarcode size={16} />
            </button>
          </div>

          {/* Smart Elastic Query Input */}
          <div className="relative flex-1 h-14">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400/60 pointer-events-none" />
            <input 
              type="text"
              placeholder="Find items by name, barcode, or code..."
              className="w-full h-full bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-12 text-base font-semibold text-slate-100 placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 transition-all shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button 
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1 bg-slate-800 rounded-lg"
                >
                  <X size={16}/>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          {/* Display Toggle Switch */}
          <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 gap-1 shadow-inner">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Grid3X3 size={18}/>
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List size={18}/>
            </button>
          </div>
        </div>

        {/* REAL-TIME CATEGORY PILL SCROLLER */}
        <div className="h-14 min-h-[3.5rem] bg-slate-950/20 border-b border-slate-800/20 flex items-center px-8 gap-2 overflow-x-auto scrollbar-hide z-10">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-5 h-9 flex items-center justify-center font-bold text-[10px] uppercase tracking-wider rounded-full transition-all whitespace-nowrap shadow-sm border ${!selectedCategory ? 'bg-white text-slate-950 border-white scale-[1.02]' : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'}`}
          >
            All Items
          </button>
          
          {/* Render dynamic categories array if loaded, fallback to product collection logic */}
          {(categories?.length > 0 ? categories : Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)))).map((cat: any) => {
            const catId = cat.id || cat;
            const catName = cat.name || cat;
            const isActive = selectedCategory === catId;
            return (
              <button 
                key={catId} 
                onClick={() => setSelectedCategory(isActive ? null : catId)}
                className={`px-5 h-9 flex items-center justify-center font-bold text-[10px] uppercase tracking-wider rounded-full transition-all whitespace-nowrap border ${isActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'}`}
              >
                {catName}
              </button>
            );
          })}
        </div>

        {/* CORE PRODUCT VIEWER GRID */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/40 relative z-10">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 p-8 text-center"
              >
                <Package size={48} strokeWidth={1.5} className="text-slate-800 animate-pulse"/>
                <p className="text-sm font-bold tracking-wide text-slate-500">No items found.</p>
                <span className="text-xs text-slate-700 uppercase font-black tracking-widest">Try another search or clear filters</span>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
              >
                {filteredProducts.map((prod: any) => {
                  const stock = Number(prod.quantity || 0);
                  const inCart = cart.find(c => c.id === prod.id);
                  const cartQty = inCart?.qty || 0;
                  
                  return (
                    <motion.button
                      key={prod.id}
                      layout
                      whileTap={{ scale: 0.96 }}
                      onClick={() => addToCart(prod)}
                      disabled={stock <= 0}
                      className={`group relative overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-left flex flex-col justify-between aspect-[4/3.2] transition-all shadow-lg hover:bg-slate-900 hover:border-indigo-500/50 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:bg-slate-900/60 disabled:cursor-not-allowed ${cartQty > 0 ? 'ring-2 ring-indigo-500/60 border-transparent' : ''}`}
                    >
                      {/* Corner Badge for Items in Cart */}
                      <AnimatePresence>
                        {cartQty > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1"
                          >
                            <ShoppingCart size={10}/> {cartQty}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Product Identity Section */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[8px] font-black text-indigo-400 tracking-widest uppercase">
                            {prod.sku || 'NO SKU'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-200 line-clamp-2 leading-tight group-hover:text-white uppercase tracking-tight pt-1">
                          {prod.name}
                        </h4>
                      </div>

                      {/* Pricing and Availability Details Footer */}
                      <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-800/40">
                        <div>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Unit Price</div>
                          <div className="text-lg font-black text-white tracking-tight">
                            ₹{Number(prod.selling_price || 0).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className={`text-[9px] font-black px-2 py-1 rounded-lg border shadow-inner ${
                          stock === 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          stock < 10 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {stock === 0 ? 'OUT OF STOCK' : `STK: ${stock}`}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            ) : (
              // COMPACT LIST VIEW
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2.5"
              >
                {filteredProducts.map((prod: any) => {
                  const stock = Number(prod.quantity || 0);
                  const inCart = cart.find(c => c.id === prod.id);
                  return (
                    <motion.div 
                      key={prod.id}
                      layout
                      className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900 transition-all shadow-md"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-bold text-white uppercase truncate">{prod.name}</h4>
                          {inCart && <span className="text-[9px] font-black bg-indigo-600/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1"><Check size={10}/> Added ({inCart.qty})</span>}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{prod.sku || 'NO SKU'} • {prod.category || 'Global Stack'}</span>
                      </div>

                      <div className="w-32 text-right">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Price</span>
                        <span className="text-base font-black text-indigo-400">₹{Number(prod.selling_price || 0).toLocaleString()}</span>
                      </div>

                      <div className="w-28 text-right">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Status</span>
                        <span className={`text-[10px] font-black ${stock > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {stock > 0 ? `${stock} Units Ready` : 'Out Of Stock'}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(prod)}
                        disabled={stock <= 0}
                        className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-2 transition-all"
                      >
                        <Plus size={14}/> Add to Bill
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. RIGHT TERMINAL PANEL: CUSTOMER, QUEUE, AND PAYMENT SYSTEM */}
      <div className="w-full lg:w-[420px] bg-[#090d16] flex flex-col h-full border-l border-slate-800/40 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] relative z-20">
        
        {/* CLIENT ASSOCIATION LAYER */}
        <div className="p-6 border-b border-slate-800/40 bg-slate-950/20 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner relative border ${activeCustomer ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                {activeCustomer ? <User size={22} /> : <UserPlus size={22} />}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Customer</span>
                <h3 className="text-sm font-black text-slate-100 truncate uppercase tracking-tight py-0.5">
                  {activeCustomer?.name || 'Walk-in Customer'}
                </h3>
                {activeCustomer && <span className="text-[10px] text-indigo-400 font-bold">{activeCustomer.phone || 'No phone provided'}</span>}
              </div>
            </div>
            
            <button 
              onClick={() => setIsCustomerDrawerOpen(!isCustomerDrawerOpen)}
              className={`p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all shadow-md ${isCustomerDrawerOpen ? 'ring-2 ring-indigo-500/40' : ''}`}
            >
              <ChevronDown size={16} className={`transition-transform duration-300 ${isCustomerDrawerOpen ? 'rotate-180' : ''}`}/>
            </button>
          </div>

          {/* ELASTIC DROPDOWN DRAWER FOR CUSTOMER QUICK ASSOCIATION */}
          <AnimatePresence>
            {isCustomerDrawerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/60 z-30 flex flex-col space-y-3"
              >
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="Filter registry by name/phone..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-bold outline-none focus:border-indigo-500"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                  {activeCustomer && (
                    <button 
                      onClick={() => { setActiveCustomer(null); setIsCustomerDrawerOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 text-xs font-black uppercase tracking-wider border border-transparent hover:border-rose-500/20 flex items-center justify-between"
                    >
                      Clear Association <X size={14}/>
                    </button>
                  )}
                  
                  {filteredCustomers.slice(0, 15).map((cust: any) => (
                    <button
                      key={cust.id}
                      onClick={() => {
                        setActiveCustomer(cust);
                        setIsCustomerDrawerOpen(false);
                        setCustomerSearch("");
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group flex flex-col"
                    >
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white uppercase">{cust.name}</span>
                      {cust.phone && <span className="text-[9px] text-slate-500">{cust.phone}</span>}
                    </button>
                  ))}

                  {filteredCustomers.length === 0 && (
                    <div className="text-center text-[10px] text-slate-600 py-4 uppercase font-bold">No records in index</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CURRENT CART LISTING */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3 bg-slate-950/20 relative">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-25 p-8 select-none pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-4 shadow-inner">
                <ScanBarcode size={48} strokeWidth={1} className="text-indigo-400" />
              </div>
              <p className="font-black text-xs uppercase tracking-[0.2em] text-white">Cart is Empty</p>
              <p className="text-[10px] text-slate-400 mt-1">Scan or tap items to start billing</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {cart.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className="bg-slate-900/40 border border-slate-800/60 rounded-[1.25rem] p-4 flex items-center gap-4 shadow-sm group hover:border-slate-800 hover:bg-slate-900/80 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-200 truncate uppercase tracking-tight group-hover:text-white">{item.name}</h5>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold">
                      <span className="text-indigo-400">₹{Number(item.selling_price).toLocaleString('en-IN')}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500 text-[9px]">GST {getTaxRate(item)}%</span>
                    </div>
                  </div>
                  
                  {/* Advanced Compact Qty Regulator */}
                  <div className="flex items-center bg-slate-950/60 border border-slate-800 p-1 rounded-xl shadow-inner">
                    <button 
                      onClick={() => updateQty(item.id, -1)} 
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Minus size={12}/>
                    </button>
                    <span className="w-7 text-center font-black text-xs text-white">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item.id, 1)} 
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Plus size={12}/>
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="font-black text-xs text-white tracking-tight">
                      ₹{(Number(item.selling_price) * item.qty).toLocaleString('en-IN')}
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="text-[9px] text-slate-500 hover:text-rose-400 font-bold transition-colors uppercase"
                    >
                      Drop
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* FINAL SETTLEMENT ACTIONS & TOTALIZER */}
        <div className="bg-[#090d16] border-t border-slate-800/60 p-6 space-y-5">
          
          {/* SUMMARY STATS CARD */}
          <div className="bg-slate-950/40 border border-slate-800/40 rounded-2xl p-4 space-y-2 shadow-inner">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500 uppercase tracking-wider">Total Items</span>
              <span className="text-slate-300 font-black">{cart.reduce((s,i)=>s+i.qty, 0)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500 uppercase tracking-wider">Estimated GST Tax</span>
              <span className="text-slate-300 font-black">₹{totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="h-[1px] bg-slate-800/40 my-2" />
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">Total Payable</span>
              <span className="font-black text-3xl text-white tracking-tighter">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* ACTIVE SUSPENSE SLOTS (Mini Hold Queue) */}
          {heldBills.length > 0 && (
            <div className="py-3 px-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 flex-shrink-0 animate-pulse">
                <Clock size={12}/> Saved Bills ({heldBills.length})
              </div>
              <div className="flex gap-2 overflow-x-auto pb-0.5 max-w-full scrollbar-hide">
                {heldBills.map(h => (
                  <button 
                    key={h.id} 
                    onClick={() => resumeBill(h)} 
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-black hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white whitespace-nowrap flex items-center gap-1 shadow-sm transition-all"
                  >
                    #{h.time} <PlayCircle size={10} className="text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TRANSACTIONAL TERMINAL GRID */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button 
              onClick={holdBill} 
              disabled={cart.length === 0}
              className="h-12 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-black text-[10px] uppercase tracking-widest shadow-md transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <PauseCircle size={15}/> Save Bill
            </button>
            <button 
              onClick={() => setCart([])} 
              disabled={cart.length === 0}
              className="h-12 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-rose-500/30 hover:text-rose-400 text-slate-400 font-black text-[10px] uppercase tracking-widest shadow-md transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Trash2 size={15}/> Clear All
            </button>
            
            <button 
              onClick={initiateCheckout}
              disabled={cart.length === 0}
              className="col-span-2 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(79,70,229,0.25)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.35)] active:scale-98 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:-translate-y-0"
            >
              <Zap size={16} /> COLLECT PAYMENT
            </button>
          </div>
        </div>
      </div>

      {/* 3. CHECKOUT SLIDE MODAL OVERLAY */}
      <AnimatePresence>
        {isCheckingOut && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1322] w-full max-w-md border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/80 text-slate-200"
            >
              {/* Modal Header */}
              <div className="px-8 pt-8 pb-6 text-center border-b border-slate-800/40 relative bg-slate-950/20">
                <button onClick={()=>setIsCheckingOut(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-1.5 bg-slate-900 border border-slate-800 rounded-lg"><X size={16}/></button>
                <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2.5 flex items-center justify-center gap-1.5">
                  <Wallet size={12}/> Payment Summary
                </h2>
                <div className="text-4xl font-black tracking-tighter text-white">₹{cartTotal.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1.5">
                  Payee: {activeCustomer?.name || 'RETAIL WALK-IN'}
                </p>
              </div>

              <div className="p-8 space-y-8">
                {/* Mode Tenders */}
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    How will they pay? <ArrowRight size={10}/>
                  </label>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'cash', icon: Banknote, label: 'CASH', color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' },
                      { id: 'upi', icon: QrCode, label: 'UPI QR', color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
                      { id: 'card', icon: CreditCard, label: 'CARD', color: 'text-purple-400 border-purple-500/50 bg-purple-500/10' }
                    ].map(tender => {
                      const Icon = tender.icon;
                      const isActive = paymentMethod === tender.id;
                      return (
                        <button 
                          key={tender.id}
                          type="button"
                          onClick={() => setPaymentMethod(tender.id as any)}
                          className={`p-4.5 flex flex-col items-center gap-2 rounded-2xl border transition-all duration-200 shadow-md py-5 ${isActive ? `${tender.color} ring-2 ring-offset-2 ring-offset-[#0d1322] ring-transparent scale-[1.02]` : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 opacity-70'}`}
                        >
                          <Icon size={24} className={isActive ? '' : 'text-slate-500'} />
                          <span className="font-black text-[10px] uppercase tracking-widest">{tender.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Complete Payment Button */}
                <button 
                  onClick={finalizeSale}
                  disabled={isProcessing}
                  className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-[0.25em] flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.3)] active:scale-98 transition-all gap-2 disabled:opacity-50 disabled:hover:bg-emerald-500"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>FINISH SALE <Check size={16}/></>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
