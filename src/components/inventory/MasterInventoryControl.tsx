import { useState, useEffect } from "react";
import ProductInsights from "./ProductInsights";

import { inventoryService } from "../../services/inventoryService";
import { replenishmentService, ReplenishmentDraft } from "../../services/replenishmentService";
import { Card, SectionHeader, Badge, ActionBtn } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { TrendingUp, Clock, Zap, Ghost, ArrowRightLeft, Info, X, MessageSquare, CheckSquare, Square, DollarSign, TrendingDown, BarChart3, CheckCircle, RefreshCw, Settings2, Search, Box, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { smsService } from "../../services/smsService";
import { useToast } from "../../components/common/Toast";
import { useGlobalData } from "../../context/DataContext";
import { BarChart, Bar, AreaChart, Area, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadPDF } from '../../utils/pdf/downloadPDF';
import { reportExporter } from "../../services/reportExporter";

export default function MasterInventoryControl() {
  const { profile, business } = useAuth();
  const { products, contacts: allContacts, invoices: allInvoices, loading: dataLoading, refresh } = useGlobalData();
  const { toast } = useToast();
  const [intelligence, setIntelligence] = useState<Record<string, ReplenishmentDraft>>({});
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("All");

  const handleDownloadReport = (product: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const prodIntel = intelligence[product.id];
    const productInvoices = (allInvoices || []).filter(inv => inv.items?.some((i: any) => i.id === product.id));
    const topBuyers = (allContacts || []).filter(c => productInvoices.some(inv => inv.contact_id === c.id)).slice(0, 5);
    const margin_val = Math.round(((product.selling_price - product.cost_price) / (product.selling_price || 1)) * 100);

    // UI Color Palette (Mirrored from Executive System)
    const NAVY: [number, number, number] = [30, 42, 94];      // #1e2a5e
    const GRAY_BG: [number, number, number] = [245, 246, 248]; // #f5f6f8
    const BORDER: [number, number, number] = [209, 213, 219]; // #d1d5db
    const SLATE_500: [number, number, number] = [100, 116, 139];
    const INDIGO_LIGHT: [number, number, number] = [240, 242, 248]; // #f0f2f8
    
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const margin = 15;

    // 1. BRANDED HEADER (Mirrored from UI)
    doc.setFontSize(8); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'bold');
    doc.text(`${business?.name?.toUpperCase() || 'VYAPARI RETAIL'} - OFFICIAL PERFORMANCE AUDIT`, w - margin, 12, { align: 'right' });

    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, 18, w - (margin * 2), 35, 1, 1, 'F');
    
    doc.setFontSize(8); doc.setTextColor(255, 255, 255, 0.65); doc.setFont('helvetica', 'bold');
    doc.text(`INVENTORY INTELLIGENCE - ITEM_PERFORMANCE_AUDIT`, margin + 8, 28);
    
    doc.setFontSize(22); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(product.name.toUpperCase(), margin + 8, 40);
    
    doc.setFontSize(9); doc.setTextColor(255, 255, 255, 0.72); doc.setFont('helvetica', 'normal');
    doc.text(`Deep-dive analytics for SKU: ${product.id.slice(0, 8)} | Last synced: ${new Date().toLocaleString()}`, margin + 8, 47);

    // 2. KPI TELEMETRY GRID (3-column)
    let nextY = 65;
    const kpis = [
      { label: "CURRENT STOCK", value: `${getStockQty(product)} Units` },
      { label: "SELLING SPEED", value: `${prodIntel?.velocity_per_day || '0.0'} Units` },
      { label: "PROFIT MARGIN", value: `${margin_val}%` }
    ];

    const boxW = (w - (margin * 2)) / 3;
    kpis.forEach((kpi, i) => {
      const x = margin + i * boxW;
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.1);
      doc.rect(x, nextY, boxW, 20);
      doc.setFontSize(7); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'bold');
      doc.text(kpi.label.toUpperCase(), x + 4, nextY + 6);
      doc.setFontSize(14); doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold');
      doc.text(String(kpi.value), x + 4, nextY + 15);
    });
    nextY += 32;

    // 3. TRANSACTION LEDGER
    doc.setFontSize(8); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'bold');
    doc.text('RECENT SALES HISTORY (TOP 10)', margin, nextY - 4);

    const invoiceData = productInvoices.slice(0, 10).map(inv => [
      `INV-${inv.invoice_number}`,
      new Date(inv.created_at).toLocaleDateString(),
      `INR ${inv.total_amount}`,
      inv.status || 'Paid'
    ]);

    autoTable(doc, {
      startY: nextY,
      head: [['INVOICE #', 'DATE', 'AMOUNT', 'STATUS']],
      body: invoiceData.length > 0 ? invoiceData : [['NO RECENT TRANSACTIONS DETECTED', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: NAVY as any, textColor: [255, 255, 255], fontStyle: 'bold' },
      margin: { left: margin, right: margin }
    });

    nextY = (doc as any).lastAutoTable.finalY + 15;

    // 4. LOYALTY ADVOCATES
    doc.setFontSize(8); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'bold');
    doc.text('TOP CUSTOMERS FOR THIS ITEM', margin, nextY - 4);

    const buyerData = topBuyers.map(c => [
      c.name,
      c.phone || 'N/A',
      'VIP ACCOUNT',
      'HIGH ENGAGEMENT'
    ]);

    autoTable(doc, {
      startY: nextY,
      head: [['NAME', 'CONTACT', 'TIER', 'INSIGHT']],
      body: buyerData.length > 0 ? buyerData : [['NO ADVOCATES DETECTED', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] as any, textColor: [255, 255, 255], fontStyle: 'bold' },
      margin: { left: margin, right: margin }
    });

    nextY = (doc as any).lastAutoTable.finalY + 15;

    // 5. STRATEGIC RECOMMENDATION (UI Box)
    const recText = prodIntel?.is_dead_stock 
      ? "ACTION NEEDED: OLD STOCK DETECTED. We suggest a 15% discount to sell these items quickly and free up your cash."
      : "GOOD STATUS: GROWING WELL. Keep your current stock levels and watch for sudden sales spikes.";
    const recLines = doc.splitTextToSize(recText, w - 50);
    const recHeight = (recLines.length * 5) + 15;

    if (nextY + recHeight > h - 15) {
      doc.addPage();
      nextY = 25;
    }

    doc.setFillColor(...INDIGO_LIGHT);
    doc.rect(margin, nextY, w - (margin * 2), recHeight, 'F');
    doc.setFillColor(...NAVY);
    doc.rect(margin, nextY, 1.5, recHeight, 'F');
    
    doc.setFontSize(8); doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold');
    doc.text('SMART AI ADVICE', margin + 5, nextY + 6);
    
    doc.setFontSize(9); doc.setTextColor(55, 65, 81); doc.setFont('helvetica', 'normal');
    doc.text(recLines, margin + 5, nextY + 13);

    // 6. FOOTER
    doc.setFontSize(7); doc.setTextColor(...SLATE_500); doc.setFont('helvetica', 'normal');
    doc.text(`Vyapari Intelligence Core - Official Performance Audit`, margin, h - 8);
    doc.text(`Generated By Gemini 2.0 Flash Intelligence Core`, w - margin, h - 8, { align: 'right' });

    // Force proper PDF download
    const filename = `${product.name.replace(/[^a-z0-9]/gi, '_')}_Intelligence_Audit.pdf`;
    downloadPDF(doc, filename);
    toast("Intelligence Report Downloaded Successfully", "success");
  };

  const exportStockListPDF = () => {
    if (!products || products.length === 0) {
      toast("No products to export", "error");
      return;
    }

    const totalValue = products.reduce((s, p) => s + (getStockQty(p) * (p.selling_price || 0)), 0);
    const lowStockCount = products.filter(p => getStockQty(p) <= (p.min_stock_level || 5)).length;

    reportExporter.downloadPDF({
      type: 'inventory',
      title: 'Master Inventory Audit',
      businessName: business?.name || 'Vyapari Retail',
      dateRange: { from: new Date().toISOString(), to: new Date().toISOString() },
      rows: filteredProducts.map((p, i) => ({
        ...p,
        sr: i + 1,
        qty_display: `${getStockQty(p)} ${p.unit || 'pcs'}`,
        margin_pct: p.selling_price > 0 ? `${Math.round(((p.selling_price - (p.cost_price || 0)) / p.selling_price) * 100)}%` : 'N/A',
        stock_value: getStockQty(p) * (p.selling_price || 0),
        status: getStockQty(p) <= 0 ? 'OUT' : getStockQty(p) <= (p.min_stock_level || 5) ? 'LOW' : 'GOOD'
      })),
      columns: [
        { key: 'sr', label: '#', type: 'text' },
        { key: 'name', label: 'Item Name', type: 'text' },
        { key: 'sku', label: 'SKU', type: 'text' },
        { key: 'qty_display', label: 'Qty', type: 'text' },
        { key: 'selling_price', label: 'Sell Price', type: 'currency' },
        { key: 'margin_pct', label: 'Profit', type: 'text' },
        { key: 'stock_value', label: 'Value', type: 'currency' },
        { key: 'status', label: 'Status', type: 'text' }
      ],
      generatedBy: profile?.full_name || 'System',
      kpis: [
        { label: 'Total Value', value: `Rs.${(totalValue/1000).toFixed(1)}K` },
        { label: 'Low Stock', value: String(lowStockCount) },
        { label: 'Total SKUs', value: String(products.length) }
      ]
    });
    toast("Inventory Report Downloaded", "success");
  };

  const [search, setSearch] = useState("");

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [promoProduct, setPromoProduct] = useState<any>(null);
  const [frequentBuyers, setFrequentBuyers] = useState<any[]>([]);
  const [promoDiscount, setPromoDiscount] = useState<number>(10);
  const [promoLoading, setPromoLoading] = useState(false);
  const [selectedBuyers, setSelectedBuyers] = useState<Set<string>>(new Set());
  const [sendingPromo, setSendingPromo] = useState(false);
  const [campaignType, setCampaignType] = useState<'flash' | 'loyalty' | 'clearance' | 'restock'>('flash');

  // Product Insights State
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightProduct, setInsightProduct] = useState<any>(null);

  // Global Broadcast State

  // Global Broadcast State
  const [showGlobalBroadcast, setShowGlobalBroadcast] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalFilter, setGlobalFilter] = useState<'all' | 'vip' | 'frequent' | 'new'>('all');
  const [selectedGlobalBuyers, setSelectedGlobalBuyers] = useState<Set<string>>(new Set());
  const [featuredProduct, setFeaturedProduct] = useState<any>(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastChannel, setBroadcastChannel] = useState<'sms' | 'whatsapp'>('whatsapp');
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, 'pending' | 'success' | 'failed'>>({});

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("91")) return `+${cleaned}`;
    return phone.startsWith("+") ? phone : `+${phone}`;
  };

  // Add Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category_id: "",
    selling_price: 0,
    cost_price: 0,
    reorder_point: 10,
    description: "",
    quantity: 0,
    unit: "pcs",
    tax_rate: 18
  });

  // Stock Adjustment State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustNote, setAdjustNote] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleCreateProduct = async () => {
    if (!profile?.business_id) return;
    if (!newProduct.name.trim()) {
      toast("Product name is required", "error");
      return;
    }

    setSavingProduct(true);
    setSaveStatus('saving');
    try {
      let resolvedCategoryId: string | undefined = undefined;
      const catName = newProduct.category_id?.trim();
      if (catName) {
        // Look up category in Supabase
        const { data: existingCat, error: catFetchErr } = await supabase
          .from('categories')
          .select('id')
          .eq('business_id', profile.business_id)
          .ilike('name', catName)
          .maybeSingle();

        if (existingCat?.id) {
          resolvedCategoryId = existingCat.id;
        } else {
          // Dynamic category generation
          const { data: newCat, error: catCreateErr } = await supabase
            .from('categories')
            .insert([{
              business_id: profile.business_id,
              name: catName,
              user_id: profile.id
            }])
            .select('id')
            .single();

          if (!catCreateErr && newCat?.id) {
            resolvedCategoryId = newCat.id;
          }
        }
      }

      await inventoryService.createProduct(profile.business_id, {
        name: newProduct.name,
        sku: newProduct.sku,
        category_id: resolvedCategoryId || undefined,
        selling_price: newProduct.selling_price,
        cost_price: newProduct.cost_price,
        min_stock_level: newProduct.reorder_point,
        description: newProduct.description,
        stock: newProduct.quantity,
        unit: newProduct.unit,
        tax_rate: newProduct.tax_rate
      } as any, profile?.id);

      setSaveStatus('success');
      toast("Product registered successfully in inventory!", "success");
      
      // Delay closing modal so the user can enjoy the premium success animation done!
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setShowAddProductModal(false);
      setNewProduct({
        name: "",
        sku: "",
        category_id: "",
        selling_price: 0,
        cost_price: 0,
        reorder_point: 10,
        description: "",
        quantity: 0,
        unit: "pcs",
        tax_rate: 18
      });
      setSearch("");
      refresh('products');
    } catch (err: any) {
      setSaveStatus('error');
      toast(err.message || "Failed to create product", "error");
      // Keep state for error for 1.5 seconds, then allow retry
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      setSavingProduct(false);
      setSaveStatus('idle');
    }
  };

  const handleQuickRestock = async (product: any, qty: number) => {
    if (!profile?.business_id || !product) return;
    try {
      await inventoryService.updateStock(
        profile.business_id,
        product.id,
        qty,
        'in',
        `Quick restock via Intelligence Terminal`
      );
      toast(`${qty} units added to ${product.name}`, "success");
      refresh('products');
    } catch (err: any) {
      toast(err.message || "Restock failed", "error");
    }
  };

  const handleUpdateProductPrice = async (product: any, newPrice: number) => {
    if (!profile?.business_id || !product) return;
    try {
      await inventoryService.updateProduct(profile.business_id, product.id, {
        selling_price: newPrice
      }, profile.id);
      toast(`Price updated to Rs.${newPrice} for ${product.name}`, "success");
      refresh('products');
    } catch (err: any) {
      toast(err.message || "Price update failed", "error");
    }
  };

  const handleWhatsAppSupplier = (product: any, message: string) => {
    // Attempt to find a supplier contact for this product
    const supplier = allContacts?.find(c => c.type === 'Supplier');
    const phone = supplier?.phone || "";
    const cleanedPhone = phone.replace(/\D/g, "");
    const finalPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
    
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${finalPhone}?text=${encodedMsg}`, '_blank');
  };

  const handlePromoClick = async (product: any) => {
    setPromoProduct(product);
    setPromoLoading(true);
    setSelectedBuyers(new Set());
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('id, quantity, invoices(contact_id, contacts(name, phone))')
        .eq('product_id', product.id);
      
      if (error) throw error;
      
      const buyerMap: Record<string, { name: string; phone: string; count: number; totalQty: number }> = {};
      data?.forEach((item: any) => {
        const inv = item.invoices;
        if (!inv || !inv.contact_id || !inv.contacts) return;
        const contactId = inv.contact_id;
        const cName = inv.contacts.name;
        const cPhone = inv.contacts.phone || "";
        
        if (!buyerMap[contactId]) {
          buyerMap[contactId] = { name: cName, phone: cPhone, count: 0, totalQty: 0 };
        }
        buyerMap[contactId].count += 1;
        buyerMap[contactId].totalQty += item.quantity || 1;
      });

      const sortedBuyers = Object.entries(buyerMap)
        .map(([id, stats]) => ({
          id,
          name: stats.name,
          phone: stats.phone,
          frequency: stats.count,
          totalQty: stats.totalQty,
          score: Math.min(100, stats.count * 15 + stats.totalQty * 5)
        }))
        .sort((a, b) => b.score - a.score);

      setFrequentBuyers(sortedBuyers);
      // Auto-select top buyers by default
      setSelectedBuyers(new Set(sortedBuyers.slice(0, 3).map(b => b.id)));
    } catch (err) {
      console.error("Error fetching frequent buyers:", err);
    } finally {
      setPromoLoading(false);
    }
  };

  const toggleSelectBuyer = (id: string) => {
    setSelectedBuyers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    fetchData();
  }, [profile, products]);

  const handleStockAdjust = async () => {
    if (!profile?.business_id || !adjustProduct) return;
    setIsAdjusting(true);
    try {
      await inventoryService.updateStock(
        profile.business_id,
        adjustProduct.id,
        adjustQty,
        adjustType,
        adjustNote || `Manual stock ${adjustType}`
      );
      toast(`Stock ${adjustType === 'in' ? 'increased' : 'decreased'} successfully`, "success");
      setShowAdjustModal(false);
      setAdjustProduct(null);
      setAdjustQty(1);
      setAdjustNote("");
      refresh('products');
    } catch (err: any) {
      toast(err.message || "Adjustment failed", "error");
    } finally {
      setIsAdjusting(false);
    }
  };

  const fetchData = async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    try {
      const iData = await replenishmentService.getDrafts(profile.business_id);
      
      const intelMap: Record<string, ReplenishmentDraft> = {};
      iData.forEach(item => {
        intelMap[item.product_id] = item;
      });
      setIntelligence(intelMap);
    } catch (err) {
      console.error("Master Inventory Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleSearch = (e: any) => {
      if (e.detail?.query) {
        setSearch(e.detail.query);
        setFilter("All");
      }
    };
    window.addEventListener('app:inventory-search', handleSearch);
    return () => window.removeEventListener('app:inventory-search', handleSearch);
  }, [profile?.business_id]);

  const handleSendOffers = async () => {
    if (!profile?.business_id || !promoProduct || selectedBuyers.size === 0) return;
    setSendingPromo(true);
    let successCount = 0;
    
    try {
      const buyersList = frequentBuyers.filter(b => selectedBuyers.has(b.id));
      
      for (const buyer of buyersList) {
        const message = getPromoMessage(buyer.name);
        try {
          await smsService.sendMessage({
            phone: formatPhone(buyer.phone),
            message,
            type: 'whatsapp',
            referenceId: promoProduct.id,
            referenceType: 'promo'
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to send to ${buyer.name}:`, e);
          // Fallback to manual if needed
        }
      }
      
      toast(`Campaign sent! Reached ${successCount} customers.`, "success");
      setPromoProduct(null);
    } catch (err: any) {
      toast("Campaign execution failed", "error");
    } finally {
      setSendingPromo(false);
    }
  };

  const getPromoMessage = (customerName: string) => {
    const discountedPrice = Math.round((promoProduct.selling_price || 0) * (1 - promoDiscount / 100));
    const bizName = profile?.business_name || "Vyapari Shop";
    
    switch (campaignType) {
      case 'flash':
        return `- FLASH SALE: Hi ${customerName}! Get ${promoDiscount}% OFF on ${promoProduct.name}. Now only Rs.${discountedPrice}. Valid for 24h at ${bizName}. Don't miss out!`;
      case 'loyalty':
        return `-- LOYALTY REWARD: Hi ${customerName}, as a valued customer, here is an exclusive ${promoDiscount}% discount on your favorite ${promoProduct.name}. Claim at ${bizName}!`;
      case 'clearance':
        return `-- CLEARANCE: We're clearing stock! Grab ${promoProduct.name} at a massive discount. Now only Rs.${discountedPrice}. Visit ${bizName} today!`;
      case 'restock':
        return `- BACK IN STOCK: Hi ${customerName}, your favorite ${promoProduct.name} is back! Get ${promoDiscount}% OFF as a restock special. Order now at ${bizName}.`;
      default:
        return `Offer: ${promoDiscount}% OFF on ${promoProduct.name} at ${bizName}!`;
    }
  };

  const handleSendGlobalBroadcast = async () => {
    if (!profile?.business_id || selectedGlobalBuyers.size === 0) return;
    setSendingPromo(true);
    setDeliveryStatus({});
    let successCount = 0;
    
    try {
      const targets = (allContacts || []).filter(c => selectedGlobalBuyers.has(c.id));
      
      for (const target of targets) {
        const msg = broadcastMessage || getGlobalMessage(target.name);
        setDeliveryStatus(prev => ({ ...prev, [target.id]: 'pending' }));
        
        try {
          await smsService.sendMessage({
            phone: formatPhone(target.phone),
            message: msg,
            type: broadcastChannel,
            referenceType: 'promo'
          });
          successCount++;
          setDeliveryStatus(prev => ({ ...prev, [target.id]: 'success' }));
        } catch (e) { 
          console.error(e); 
          setDeliveryStatus(prev => ({ ...prev, [target.id]: 'failed' }));
        }
      }
      
      toast(`Broadcast finished! Successfully sent to ${successCount} customers.`, "success");
    } catch (err: any) {
      toast("Broadcast failed", "error");
    } finally {
      setSendingPromo(false);
    }
  };

  const getGlobalMessage = (customerName: string) => {
    const bizName = profile?.business_name || "Vyapari Shop";
    if (featuredProduct) {
      const discountedPrice = Math.round((featuredProduct.selling_price || 0) * (1 - promoDiscount / 100));
      return `-- SPECIAL ANNOUNCEMENT: Hi ${customerName}! We have a special offer on ${featuredProduct.name} at ${bizName}. Get it for just Rs.${discountedPrice}. Visit us today!`;
    }
    return `-- Greetings from ${bizName}! Hi ${customerName}, we have some exciting new arrivals in stock. Come check them out or order via WhatsApp!`;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const getStockQty = (p: any) => {
    if (p.quantity !== undefined && p.quantity !== null) return Number(p.quantity);
    if (Array.isArray(p.stock)) return p.stock[0]?.quantity || 0;
    if (p.stock && typeof p.stock === 'object') return p.stock.quantity || 0;
    return 0;
  };

  const getMinStock = (p: any) => {
    return p.reorder_point || p.reorder_level || 0;
  };

  const sortedProducts = [...products].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const filteredProducts = sortedProducts.filter(p => {
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    
    if (filter === "Low Stock") return getStockQty(p) <= getMinStock(p);
    if (filter === "Out of Stock") return getStockQty(p) <= 0;
    if (filter === "Old Stock") return intelligence[p.id]?.is_dead_stock;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      {/* Premium Stock Banner */}
      <div className="bg-slate-950 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -ml-32 -mb-32" />
        
        {/* Dot Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect width="100" height="100" fill="url(#dot-grid-dark)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                <Box size={24} />
              </div>
              <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Inventory Live
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">My Stock <span className="text-indigo-500">Tracker</span></h1>
            <p className="text-slate-400 mt-6 text-sm font-medium max-w-lg leading-relaxed uppercase tracking-[0.2em] text-[9px]">
              Complete control over your products, stock speed, and profit tracking.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center min-w-[140px] backdrop-blur-xl">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Value</div>
               <div className="text-2xl font-black text-white">Rs.{(products.reduce((acc, p) => acc + (p.selling_price * getStockQty(p)), 0) / 1000).toFixed(1)}K</div>
            </div>
            <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl text-center min-w-[140px] backdrop-blur-xl">
               <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Items Today</div>
               <div className="text-2xl font-black text-white">{products.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: "Total Items", val: products.length, icon: <TrendingUp size={20} />, color: "text-slate-900" },
          { label: "Finishing Soon", val: Object.values(intelligence).filter(i => i.priority === 'CRITICAL').length, icon: <Zap size={20} />, color: "text-rose-500" },
          { label: "Stock Watch", val: Object.values(intelligence).filter(i => i.priority === 'WATCH').length, icon: <Clock size={20} />, color: "text-amber-500" },
          { label: "Slow Items", val: Object.values(intelligence).filter(i => i.is_dead_stock).length, icon: <Ghost size={20} />, color: "text-indigo-500" }
        ].map(s => (
          <div key={s.label} className="brutal-card bg-white !p-8 group hover:border-neon transition-all">
            <div className="flex justify-between items-center mb-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
              <div className={s.color}>{s.icon}</div>
            </div>
            <div className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="brutal-card bg-white !p-10">
        <div className="space-y-6 mb-10">
          {/* Row 1: Search & Filter Hub */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-100">
            <div className="relative flex-1 max-w-2xl group">
              <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Search size={18} strokeWidth={3} />
              </span>
              <input
                type="text"
                placeholder="SEARCH IN MY STOCK..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl font-black text-xs uppercase tracking-widest outline-none text-slate-800 transition-all placeholder-slate-400 shadow-sm"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
              {["All", "Low Stock", "Out of Stock", "Dead Stock"].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {f === "All" ? "All Items" : f === "Low Stock" ? "Finishing Soon" : f === "Out of Stock" ? "Empty Stock" : "Slow Selling"}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Utilities & Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            <div className="flex flex-wrap gap-2">
               <button 
                 onClick={() => setShowGlobalBroadcast(true)}
                 className="px-5 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
               >
                 <Zap size={14} fill="currentColor" /> Global Broadcast
               </button>
               <button 
                 onClick={() => {
                   if (products.length > 0) {
                     setAdjustProduct(products[0]);
                     setShowAdjustModal(true);
                   } else {
                     toast("No products available to adjust", "error");
                   }
                 }}
                 className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
               >
                 <Settings2 size={14} /> Quick Adjust
               </button>
               <button
                 onClick={exportStockListPDF}
                 className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-2"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 Export Stock List
               </button>
            </div>

            <ActionBtn onClick={() => setShowAddProductModal(true)} className="!px-10 !bg-[#0A84FF] !text-white !rounded-2xl !py-3">
              + Add Product
            </ActionBtn>
          </div>
        </div>

        <div className="overflow-x-auto -mx-10">
          <table className="w-full text-left border-separate border-spacing-y-2 px-10">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4 w-10 text-center">
                  <div 
                    onClick={() => {
                      if (selectedItems.size === paginatedProducts.length) setSelectedItems(new Set());
                      else setSelectedItems(new Set(paginatedProducts.map(p => p.id)));
                    }}
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedItems.size === paginatedProducts.length && paginatedProducts.length > 0 ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/20' : 'border-slate-300 hover:border-indigo-400 bg-white'}`}
                  >
                    {selectedItems.size === paginatedProducts.length && paginatedProducts.length > 0 && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Daily Speed</th>
                <th className="px-6 py-4">Stock Left</th>
                <th className="px-6 py-4">Days Left</th>
                <th className="px-6 py-4">Suggested Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="flex flex-col items-center justify-center space-y-4 py-8 max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">No Items Found</h4>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-relaxed">
                          We couldn't find any products in your inventory matching "{search}". Try searching for something else or register a new product!
                        </p>
                      </div>
                      {search && (
                        <button 
                          onClick={() => setSearch("")}
                          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md active:scale-95"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(p => {
                  const intel = intelligence[p.id];
                  const stockQty = getStockQty(p);
                  return (
                    <motion.tr 
                      key={p.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-all border border-transparent rounded-2xl ${selectedItems.has(p.id) ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'bg-slate-50/50 hover:bg-white'}`}
                    >
                      <td className="px-6 py-6 text-center">
                        <div 
                          onClick={() => toggleSelectItem(p.id)}
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedItems.has(p.id) ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/20' : 'border-slate-300 hover:border-indigo-400 bg-white'}`}
                        >
                          {selectedItems.has(p.id) && <CheckSquare size={12} className="text-white" />}
                        </div>
                      </td>
                      <td className="px-6 py-6 rounded-l-3xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs group-hover:bg-neon transition-colors">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 uppercase tracking-tighter">{p.name}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Item Code: {p.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-black text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          {intel?.velocity_per_day || 0}
                          <TrendingUp size={12} className={Number(intel?.velocity_per_day) > 1 ? 'text-emerald-500' : 'text-slate-300'} />
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-black text-slate-900">{stockQty} <span className="text-[10px] text-slate-300 font-bold">/ {getMinStock(p)}</span></div>
                      </td>
                      <td className="px-6 py-6">
                        <div className={`text-xs font-black ${intel?.days_remaining && intel.days_remaining < 7 ? 'text-rose-500' : 'text-slate-500'}`}>
                          {intel?.days_remaining ? `${intel.days_remaining}D` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-black text-neon">{intel?.eoq_quantity || '-'}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <Badge status={stockQty <= 0 ? "Out of Stock" : stockQty <= getMinStock(p) ? "Low Stock" : "Healthy"} />
                          {intel?.is_dead_stock && <Ghost size={14} className="text-indigo-400" />}
                          {intel?.substitution_id && <ArrowRightLeft size={14} className="text-indigo-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right rounded-r-3xl">
                        <div className="flex justify-end gap-3 transition-all">
                          <button 
                            onClick={() => {
                              setAdjustProduct(p);
                              setShowAdjustModal(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-neon hover:text-slate-900 transition-all shadow-lg shadow-slate-900/20 border border-slate-800"
                            title="Quick Adjust"
                          >
                            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                              <Settings2 size={12} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Adjust</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              setInsightProduct(p);
                              setShowInsightsModal(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100/50"
                          >
                            <div className="w-6 h-6 rounded-lg bg-white/50 flex items-center justify-center">
                              <BarChart3 size={12} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Insights</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-10 py-5 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} Products
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 transition-all flex items-center gap-1 active:scale-95"
                >
                  - Previous
                </button>
                <div className="flex items-center px-3 text-[10px] font-black text-slate-700 font-mono">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 transition-all flex items-center gap-1 active:scale-95"
                >
                  Next -
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar for Bulk Operations */}
      <AnimatePresence>
        {selectedItems.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] min-w-[400px] flex items-center justify-between gap-8 px-8 py-5 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-2">
              <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30">
                {selectedItems.size}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                Items Selected
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-neon hover:text-white transition-all shadow-md active:scale-95 flex items-center gap-2">
                <Zap size={12} /> Bulk Promote
              </button>
              <button className="px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <BarChart3 size={12} /> Data Export
              </button>
              <button 
                onClick={() => setSelectedItems(new Set())}
                className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                title="Cancel Selection"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frequent Buyers Promotional Engine Modal */}
      <AnimatePresence>
        {promoProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setPromoProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/95 border border-slate-200/50 rounded-[2.5rem] p-8 max-w-4xl w-full shadow-2xl shadow-slate-900/10 space-y-6 relative my-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setPromoProduct(null)}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="space-y-2">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Campaign Engine</div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Launch Product Campaign</h3>
                <p className="text-xs font-semibold text-slate-400">Target your most frequent buyers of <span className="font-bold text-slate-800">{promoProduct.name}</span> with a custom offer.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Configuration */}
                <div className="space-y-6">
                  {/* Campaign Selector */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Campaign Strategy</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'flash', label: 'Flash Sale', icon: '-' },
                        { id: 'loyalty', label: 'Loyalty', icon: '--' },
                        { id: 'clearance', label: 'Clearance', icon: '--' },
                        { id: 'restock', label: 'Restock', icon: '-' }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setCampaignType(type.id as any)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all ${
                            campaignType === type.id 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                              : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          <div className="text-lg mb-1">{type.icon}</div>
                          <div className="text-[10px] font-black uppercase tracking-tight">{type.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Set Discount */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Campaign Discount</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">Price: Rs.{promoProduct.selling_price || 0}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={promoDiscount}
                        onChange={e => setPromoDiscount(Math.max(1, parseInt(e.target.value) || 10))}
                        className="w-16 px-2 py-2 rounded-xl border-2 border-slate-200 focus:border-indigo-500 font-black text-center text-xs"
                      />
                      <div className="text-right">
                        <div className="text-[10px] font-black text-indigo-600">Rs.{Math.round((promoProduct.selling_price || 0) * (1 - promoDiscount / 100))}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase">OFFER PRICE</div>
                      </div>
                    </div>
                  </div>

                  {/* List Buyers */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Target Customers ({selectedBuyers.size})</label>
                      <button 
                        onClick={() => {
                          if (selectedBuyers.size === frequentBuyers.length) setSelectedBuyers(new Set());
                          else setSelectedBuyers(new Set(frequentBuyers.map(b => b.id)));
                        }}
                        className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                      >
                        {selectedBuyers.size === frequentBuyers.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    {promoLoading ? (
                      <div className="py-10 text-center text-xs font-black uppercase text-slate-400 animate-pulse">Scanning Purchase History...</div>
                    ) : frequentBuyers.length === 0 ? (
                      <div className="py-10 text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No customers found for this product.</div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {frequentBuyers.map(buyer => (
                          <div 
                            key={buyer.id}
                            onClick={() => toggleSelectBuyer(buyer.id)}
                            className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all group ${
                              selectedBuyers.has(buyer.id) 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                selectedBuyers.has(buyer.id) ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-indigo-50'
                              }`}>
                                {buyer.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-tight">{buyer.name}</div>
                                <div className={`text-[8px] ${selectedBuyers.has(buyer.id) ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  {buyer.frequency} Visits - {buyer.totalQty} Units
                                </div>
                              </div>
                            </div>
                            <div className={`text-[9px] font-black px-2 py-0.5 rounded ${
                              selectedBuyers.has(buyer.id) ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500'
                            }`}>
                              {buyer.score}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Smartphone Preview */}
                <div className="hidden md:flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3">Live Message Preview</label>
                  <div className="flex-1 bg-slate-900 rounded-[3rem] p-4 border-[6px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                    {/* Speaker/Camera Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl z-20" />
                    
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-4 pt-4 pb-2 text-[8px] font-bold text-white/40">
                      <span>9:41</span>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full border border-white/20" />
                        <div className="w-3.5 h-2 bg-white/40 rounded-sm" />
                      </div>
                    </div>

                    {/* Chat Header */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-black text-white">V</div>
                      <div>
                        <div className="text-[9px] font-black text-white uppercase tracking-tight">{profile?.business_name || 'Vyapari'}</div>
                        <div className="text-[7px] text-emerald-400 font-bold">Online</div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 space-y-4 overflow-hidden">
                       <div className="max-w-[85%] bg-indigo-600 rounded-2xl rounded-tl-none p-3 shadow-lg relative">
                         <div className="text-[10px] text-white leading-relaxed font-medium">
                            {getPromoMessage(selectedBuyers.size > 0 ? frequentBuyers.find(b => selectedBuyers.has(b.id))?.name || 'Customer' : 'Customer')}
                         </div>
                         <div className="text-[7px] text-white/50 text-right mt-1 font-bold">10:00 AM</div>
                         {/* Bubble tail */}
                         <div className="absolute top-0 -left-1.5 w-3 h-3 bg-indigo-600" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
                       </div>

                       <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 p-3 rounded-2xl border border-white/5 text-center"
                       >
                         <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Preview Mode</div>
                         <div className="text-[7px] text-slate-500 leading-tight">This is exactly how your campaign will appear on the customer's device.</div>
                       </motion.div>
                    </div>

                    {/* Chat Input Area */}
                    <div className="p-3 bg-white/5 border-t border-white/5 flex gap-2 items-center">
                      <div className="flex-1 h-8 bg-white/10 rounded-full" />
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                        <Zap size={14} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-100 justify-end relative z-10">
                <button
                  onClick={() => setPromoProduct(null)}
                  className="px-6 py-3 border border-slate-200 hover:border-slate-300 bg-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendOffers}
                  disabled={sendingPromo || selectedBuyers.size === 0}
                  className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl active:scale-95"
                >
                  {sendingPromo ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Launching...
                    </>
                  ) : (
                    <>
                      <Zap size={14} fill="currentColor" className="text-neon" /> Launch Campaign
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Add Product Modal with Dynamic Margin Analyzer Screen */}
      <AnimatePresence>
        {showAddProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowAddProductModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white border border-slate-200/80 shadow-[0_24px_70px_rgba(15,23,42,0.15)] rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col text-slate-800 my-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-100 text-slate-900">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[8px] font-black text-[#0A84FF] uppercase tracking-[0.3em]">Inventory Hub</div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-950">Add New Product</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="p-1.5 border border-slate-200 hover:border-[#0A84FF] rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Two-Pane Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 flex-1 overflow-y-auto custom-scrollbar">
                {/* Left Pane: Detailed Vertical Form */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Item Name *</label>
                    <input
                      placeholder="e.g. Basmati Rice Premium"
                      value={newProduct.name}
                      onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">SKU / Barcode</label>
                      <input
                        placeholder="e.g. SKU9982"
                        value={newProduct.sku}
                        onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Category</label>
                      <input
                        placeholder="e.g. Groceries"
                        value={newProduct.category_id}
                        onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Initial Stock *</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newProduct.quantity || ""}
                        onChange={e => setNewProduct(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Unit *</label>
                      <input
                        placeholder="pcs / kgs / ltr"
                        value={newProduct.unit}
                        onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Min Level *</label>
                      <input
                        type="number"
                        placeholder="10"
                        value={newProduct.reorder_point || ""}
                        onChange={e => setNewProduct(p => ({ ...p, reorder_point: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Cost Price *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">Rs.</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={newProduct.cost_price || ""}
                          onChange={e => setNewProduct(p => ({ ...p, cost_price: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white pl-7 pr-3 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Selling Price *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">Rs.</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={newProduct.selling_price || ""}
                          onChange={e => setNewProduct(p => ({ ...p, selling_price: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white pl-7 pr-3 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tax Rate (%)</label>
                      <input
                        type="number"
                        placeholder="18"
                        value={newProduct.tax_rate || ""}
                        onChange={e => setNewProduct(p => ({ ...p, tax_rate: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-bold text-xs uppercase tracking-wider rounded-xl outline-none text-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Add item details, rack location, supplier info..."
                      value={newProduct.description}
                      onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0A84FF] focus:bg-white p-2.5 font-medium text-xs rounded-xl outline-none text-slate-900 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Right Pane: Real-time LED Margin Analyzer Screen */}
                <div className="md:col-span-5 flex flex-col justify-between">
                  {(() => {
                    const profit = newProduct.selling_price - newProduct.cost_price;
                    const marginPct = newProduct.selling_price > 0 ? Math.round((profit / newProduct.selling_price) * 100) : 0;
                    const marginLabel = marginPct >= 20 ? 'healthy' : marginPct > 0 ? 'low' : 'unprofitable';
                    
                    const totalCost = newProduct.cost_price * newProduct.quantity;
                    const totalYield = newProduct.selling_price * newProduct.quantity;
                    const projectedProfit = profit * newProduct.quantity;

                    return (
                      <div className="h-full bg-slate-950 text-white p-5 rounded-2xl flex flex-col justify-between border border-slate-800 shadow-inner relative overflow-hidden font-mono min-h-[320px]">
                        {/* High-tech glow lines */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl" />
                        
                        <div>
                          {/* Live Screen Header */}
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-[#0A84FF] rounded-full animate-ping" /> Real-time DSS Screen
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              marginLabel === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                              marginLabel === 'low' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {marginLabel === 'healthy' ? '- High Yield' : marginLabel === 'low' ? '-- Low Margin' : '-- Unprofitable'}
                            </span>
                          </div>

                          {/* Dynamic LED Number */}
                          <div className="space-y-1 my-2">
                            <div className="text-[8px] text-slate-400 uppercase tracking-wider">Per-Unit Profitability</div>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-3xl font-black tracking-tight ${profit > 0 ? 'text-emerald-400' : profit < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                {profit >= 0 ? `+Rs.${profit.toFixed(2)}` : `-Rs.${Math.abs(profit).toFixed(2)}`}
                              </span>
                              <span className="text-[10px] text-slate-400">/ unit</span>
                            </div>
                          </div>

                          {/* Interactive Progress bar */}
                          <div className="space-y-1 my-3">
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>Profit Margin</span>
                              <span className={profit > 0 ? 'text-emerald-400' : 'text-rose-400'}>{marginPct}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <motion.div
                                animate={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
                                className={`h-full rounded-full ${profit > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              />
                            </div>
                          </div>

                          {/* Asset Ledger Section */}
                          <div className="mt-4 pt-3 border-t border-slate-900 space-y-2">
                            <div className="text-[8px] text-slate-400 uppercase tracking-wider">Initial Valuation Summary</div>
                            
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500">Total Investment:</span>
                              <span className="text-slate-300">Rs.{totalCost.toLocaleString('en-IN')}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500">Gross Asset Yield:</span>
                              <span className="text-slate-300">Rs.{totalYield.toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-900 font-bold">
                              <span className="text-slate-400">Projected Net Profit:</span>
                              <span className={projectedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                Rs.{projectedProfit.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Warning Message */}
                        <div className="mt-5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                          <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                            {profit > 0 ? (
                              `- This asset yields Rs.${profit} per unit. With ${newProduct.quantity} units, you stand to make a premium Rs.${projectedProfit} profit on initial stock. Excellent pricing metrics.`
                            ) : profit < 0 ? (
                              "-- ALERT: Price is below cost! You are generating a loss. Increase the selling price or reduce the purchase cost to avoid deficit."
                            ) : (
                              "- Enter cost and selling price to compute dynamic margin valuation metrics automatically."
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 justify-end">
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  disabled={savingProduct || !newProduct.name || newProduct.selling_price <= 0}
                  className="px-6 py-2 bg-[#0A84FF] hover:bg-[#0070E3] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-[#0A84FF]/20"
                >
                  {savingProduct ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <RefreshCw size={12} className="animate-spin" /> Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 justify-center">
                      <CheckCircle size={12} /> Save Product
                    </span>
                  )}
                </button>
              </div>
              {/* Premium Saving Animation Overlay */}
              <AnimatePresence>
                {savingProduct && (
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
                          {saveStatus === 'success' ? 'Product Registered!' : saveStatus === 'error' ? 'Failed to Save' : 'Syncing with Database'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                          {saveStatus === 'success' 
                            ? `Successfully added to inventory!` 
                            : saveStatus === 'error'
                            ? `Please check your inputs`
                            : `Saving ${newProduct.name || 'Product'}...`}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {showAdjustModal && adjustProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1200] flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => {
              setShowAdjustModal(false);
              setAdjustProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-slate-200/80 shadow-2xl rounded-[2.5rem] p-8 max-w-md w-full space-y-6 relative overflow-hidden my-auto"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16" />
              
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Inventory Hub</div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-950">Adjust Stock</h3>
                </div>
                <button onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustProduct(null);
                }} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative z-10">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Selected Item</div>
                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{adjustProduct.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-600 uppercase">
                    Current: {getStockQty(adjustProduct)} {adjustProduct.unit || 'pcs'}
                  </div>
                  <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-600 uppercase">
                    Min: {getMinStock(adjustProduct)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Adjustment Type</label>
                  <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => setAdjustType('in')}
                      className={`flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${adjustType === 'in' ? 'bg-white text-emerald-600 shadow-md border border-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Add (+)
                    </button>
                    <button 
                      onClick={() => setAdjustType('out')}
                      className={`flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${adjustType === 'out' ? 'bg-white text-rose-600 shadow-md border border-rose-50' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Remove (-)
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={e => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 p-2.5 font-bold text-xs rounded-xl outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Reason / Note</label>
                <input
                  placeholder="e.g. New stock received, Damaged goods..."
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 p-2.5 font-bold text-xs rounded-xl outline-none text-slate-900 transition-all"
                />
              </div>

              <button
                onClick={handleStockAdjust}
                disabled={isAdjusting}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 relative z-10 flex items-center justify-center gap-2 ${
                  adjustType === 'in' ? 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-500' : 'bg-rose-600 shadow-rose-500/20 hover:bg-rose-500'
                }`}
              >
                {isAdjusting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating Inventory...
                  </>
                ) : (
                  <>
                    {adjustType === 'in' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    Confirm {adjustType === 'in' ? 'Addition' : 'Removal'}
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Broadcast Center Modal */}
      <AnimatePresence>
        {showGlobalBroadcast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1200] flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowGlobalBroadcast(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white/95 border border-slate-200/50 rounded-[3rem] p-10 max-w-5xl w-full shadow-2xl space-y-8 relative my-auto"
              onClick={e => e.stopPropagation()}
            >
               <button 
                onClick={() => setShowGlobalBroadcast(false)}
                className="absolute right-8 top-8 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Store-wide Marketing</div>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-slate-950">Broadcast Center</h3>
                  <p className="text-xs font-semibold text-slate-400">Launch a campaign to your entire customer base or specific segments.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Live Pipeline Active</span>
                  </div>
                </div>

                <div className="flex gap-3">
                   <button 
                    onClick={async () => {
                      if (!business?.phone) {
                        toast("Set your business phone in settings first!", "error");
                        return;
                      }
                      try {
                        const msg = broadcastMessage || getGlobalMessage("Shopkeeper");
                        await smsService.sendMessage({
                          phone: business.phone,
                          message: `-- TEST BROADCAST: ${msg}`,
                          type: 'whatsapp'
                        });
                        toast("Test sent to your phone!", "success");
                      } catch (e) {
                        toast("Test failed. Check your Twilio settings.", "error");
                      }
                    }}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                   >
                     <Zap size={12} /> Send Test to Me
                   </button>
                </div>
                
                <div className="flex gap-2">
                   {['all', 'vip', 'frequent', 'new'].map(f => (
                     <button
                      key={f}
                      onClick={() => setGlobalFilter(f as any)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        globalFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                     >
                       {f}
                     </button>
                   ))}
                </div>
                 <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                    <p className="text-[9px] font-bold text-amber-700 leading-tight">
                      -- <span className="uppercase">Notice:</span> If you are using a Trial Account, your customers must first text the Sandbox keyword (e.g. "join sandbox-name") to your Twilio number to receive these messages.
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Contact Selection & Search */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      placeholder="Search customers..."
                      value={globalSearch}
                      onChange={e => setGlobalSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 font-bold text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <span>Customers ({selectedGlobalBuyers.size})</span>
                      <button 
                        onClick={() => {
                          const filtered = (allContacts || []).filter(c => {
                            const matchesSearch = !globalSearch || c.name.toLowerCase().includes(globalSearch.toLowerCase()) || (c.phone && c.phone.includes(globalSearch));
                            if (!matchesSearch) return false;
                            if (globalFilter === 'all') return true;
                            const customerInvoices = (allInvoices || []).filter(inv => inv.contact_id === c.id);
                            const totalSpend = customerInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
                            const frequency = customerInvoices.length;
                            const isNew = new Date(c.created_at).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000);
                            if (globalFilter === 'vip') return totalSpend > 10000 || frequency > 10;
                            if (globalFilter === 'frequent') return frequency > 5;
                            if (globalFilter === 'new') return isNew;
                            return true;
                          });
                          if (selectedGlobalBuyers.size === filtered.length) setSelectedGlobalBuyers(new Set());
                          else setSelectedGlobalBuyers(new Set(filtered.map(c => c.id)));
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        {selectedGlobalBuyers.size === (allContacts?.length || 0) ? 'Deselect All' : 'Select Visible'}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {(allContacts || [])
                        .filter(c => {
                          const matchesSearch = !globalSearch || c.name.toLowerCase().includes(globalSearch.toLowerCase()) || (c.phone && c.phone.includes(globalSearch));
                          if (!matchesSearch) return false;
                          
                          if (globalFilter === 'all') return true;
                          
                          // Calculate stats for filtering
                          const customerInvoices = (allInvoices || []).filter(inv => inv.contact_id === c.id);
                          const totalSpend = customerInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
                          const frequency = customerInvoices.length;
                          const isNew = new Date(c.created_at).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000);

                          if (globalFilter === 'vip') return totalSpend > 10000 || frequency > 10;
                          if (globalFilter === 'frequent') return frequency > 5;
                          if (globalFilter === 'new') return isNew;
                          
                          return true;
                        })
                        .map(customer => (
                          <div 
                            key={customer.id}
                            onClick={() => {
                              const next = new Set(selectedGlobalBuyers);
                              next.has(customer.id) ? next.delete(customer.id) : next.add(customer.id);
                              setSelectedGlobalBuyers(next);
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all ${
                              selectedGlobalBuyers.has(customer.id) 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                                : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-200'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${
                                selectedGlobalBuyers.has(customer.id) ? 'bg-white/20' : 'bg-slate-100'
                              }`}>
                                {customer.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="text-[10px] font-black uppercase tracking-tight truncate">{customer.name}</div>
                               <div className={`text-[8px] font-bold ${selectedGlobalBuyers.has(customer.id) ? 'text-slate-400' : 'text-slate-500'}`}>
                                 {customer.phone || 'No Phone'}
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {deliveryStatus[customer.id] === 'success' && <CheckCircle size={14} className="text-emerald-400" />}
                              {deliveryStatus[customer.id] === 'failed' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const msg = broadcastMessage || getGlobalMessage(customer.name);
                                    window.open(`https://wa.me/${formatPhone(customer.phone).replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, '_blank');
                                  }}
                                  className="text-[9px] font-black text-rose-500 hover:underline flex items-center gap-1"
                                >
                                  Retry WA
                                </button>
                              )}
                              {deliveryStatus[customer.id] === 'pending' && <RefreshCw size={12} className="text-indigo-400 animate-spin" />}
                              {selectedGlobalBuyers.has(customer.id) && !deliveryStatus[customer.id] && <CheckCircle size={14} className="text-neon" />}
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Middle: Campaign Config */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Featured Product (Optional)</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                       <button
                        onClick={() => setFeaturedProduct(null)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${!featuredProduct ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100'}`}
                       >
                         <div className="text-[10px] font-black uppercase">No Featured Product</div>
                         <div className="text-[8px] text-slate-400">General Announcement Only</div>
                       </button>
                       {products.slice(0, 10).map(p => (
                         <button
                          key={p.id}
                          onClick={() => setFeaturedProduct(p)}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${featuredProduct?.id === p.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100'}`}
                         >
                            <div>
                              <div className="text-[10px] font-black uppercase truncate max-w-[150px]">{p.name}</div>
                              <div className="text-[8px] text-slate-400">Rs.{p.selling_price}</div>
                            </div>
                            {featuredProduct?.id === p.id && <Zap size={10} className="text-indigo-600" fill="currentColor" />}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Custom Broadcast Message</label>
                    <textarea
                      rows={5}
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                      placeholder="Type your custom announcement here... (Leave blank for auto-template)"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 font-medium text-xs resize-none"
                    />
                    <div className="text-[8px] font-bold text-slate-400 italic">Variables supported: {'{customerName}'} will be auto-replaced.</div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Delivery Channel</label>
                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                      {[
                        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={12} />, color: 'text-emerald-600' },
                        { id: 'sms', label: 'Regular SMS', icon: <DollarSign size={12} />, color: 'text-indigo-600' }
                      ].map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => setBroadcastChannel(ch.id as any)}
                          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                            broadcastChannel === ch.id 
                              ? 'bg-white shadow-lg border border-slate-200 ' + ch.color 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {ch.icon} {ch.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 italic">SMS is recommended if customers are not receiving WhatsApp messages.</p>
                  </div>
                </div>

                {/* Right: Smartphone Preview */}
                <div className="lg:col-span-4 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-4">Final Broadcast Preview</label>
                  <div className="flex-1 bg-slate-900 rounded-[3.5rem] p-5 border-[8px] border-slate-800 shadow-3xl relative overflow-hidden flex flex-col min-h-[500px]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-800 rounded-b-3xl z-20" />
                    <div className="flex justify-between items-center px-4 pt-6 pb-2 text-[9px] font-bold text-white/30">
                      <span>12:00 PM</span>
                      <div className="flex gap-2">
                        <BarChart3 size={10} />
                        <div className="w-4 h-2 bg-white/20 rounded-sm" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">{profile?.business_name?.charAt(0)}</div>
                      <div>
                        <div className="text-[10px] font-black text-white uppercase tracking-tight">{profile?.business_name || 'My Shop'}</div>
                        <div className="text-[8px] text-emerald-500 font-bold">Broadcasting...</div>
                      </div>
                    </div>

                    <div className="flex-1 p-5 space-y-4">
                       <div className="max-w-[90%] bg-indigo-600 rounded-2xl rounded-tl-none p-4 shadow-xl relative">
                          <div className="text-[11px] text-white leading-relaxed font-medium">
                             {broadcastMessage || getGlobalMessage(selectedGlobalBuyers.size > 0 ? (allContacts || []).find(c => selectedGlobalBuyers.has(c.id))?.name || 'Customer' : 'Customer')}
                          </div>
                          <div className="text-[8px] text-white/40 text-right mt-2">Just now</div>
                          <div className="absolute top-0 -left-2 w-4 h-4 bg-indigo-600" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
                       </div>
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3 items-center">
                      <div className="flex-1 h-10 bg-white/10 rounded-full" />
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Zap size={16} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-slate-100 justify-end">
                <button
                  onClick={() => setShowGlobalBroadcast(false)}
                  className="px-8 py-4 border border-slate-200 hover:border-slate-300 bg-white rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendGlobalBroadcast}
                  disabled={sendingPromo || selectedGlobalBuyers.size === 0}
                  className="px-12 py-4 bg-indigo-600 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-2xl shadow-indigo-500/20 active:scale-95"
                >
                  {sendingPromo ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Launching Broadcast...
                    </>
                  ) : (
                    <>
                      <Zap size={16} fill="currentColor" className="text-neon" /> Launch to {selectedGlobalBuyers.size} Contacts
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Insights Intelligence Terminal */}
      <AnimatePresence>
        {showInsightsModal && insightProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[1300] flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowInsightsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] rounded-[3rem] w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col relative my-auto"
            >
              <ProductInsights 
                product={insightProduct} 
                intelligence={intelligence[insightProduct.id]} 
                onClose={() => setShowInsightsModal(false)} 
                onRestock={(qty) => handleQuickRestock(insightProduct, qty)}
                onUpdatePrice={(price) => handleUpdateProductPrice(insightProduct, price)}
                onWhatsApp={(msg) => handleWhatsAppSupplier(insightProduct, msg)}
                onDownloadReport={() => handleDownloadReport(insightProduct)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

