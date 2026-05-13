import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, User, Phone, MapPin, FileText, MessageSquare, UserCheck, UserPlus, RefreshCw, X } from "lucide-react";
import { useGlobalData } from "../../context/DataContext";
import { Card, SectionHeader, ActionBtn as Button, KPICard, SkeletonCard } from "../common/UI";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../common/Toast";
import CustomerDetail from "./CustomerDetail";


export default function ContactsList() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { contacts, invoices, ledger, refresh, loading } = useGlobalData();
  const [savingContact, setSavingContact] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"All" | "customer" | "supplier">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    type: "customer",
    gstin: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
  });
  const [selectedContact, setSelectedContact] = useState<any>(null);


  const filtered = (contacts || [])
    .filter((c) => {
      const matchesSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.gstin?.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "All" || c.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedContacts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalCustomers = (contacts || []).filter((c) => c.type === "customer").length;
  const totalSuppliers = (contacts || []).filter((c) => c.type === "supplier").length;

  const cashLiquidity = (ledger || []).reduce((acc, l) => acc + (l.type === 'income' ? (l.amount || 0) : -(l.amount || 0)), 0);
  const pendingReceivables = (invoices || []).filter(i => i.status === 'pending').reduce((acc, i) => acc + (i.total_amount || 0), 0);

  const formatK = (val: number) => {
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    if (absVal >= 1000) {
      return `${isNeg ? '-' : ''}Rs.${(absVal / 1000).toFixed(1)}K`;
    }
    return `${isNeg ? '-' : ''}Rs.${absVal.toLocaleString()}`;
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.business_id || !newContact.name) return;

    setSavingContact(true);
    setSaveStatus('saving');

    try {
      const { error } = await supabase
        .from("contacts")
        .insert([
          {
            ...newContact,
            business_id: profile.business_id,
            user_id: profile.id,
          },
        ]);

      if (error) {
        setSaveStatus('error');
        setTimeout(() => setSavingContact(false), 1500);
        throw error;
      }

      setSaveStatus('success');
      toast(`${newContact.type === 'customer' ? 'Customer' : 'Supplier'} registered!`, "success");
      
      refresh('contacts');

      setTimeout(async () => {
        await refresh("contacts");
        setShowAddModal(false);
        setSavingContact(false);
        setSaveStatus('idle');
        setNewContact({ 
          name: "", phone: "", email: "", type: "customer", 
          gstin: "", address: "", city: "", state: "Maharashtra", pincode: "" 
        });
      }, 1500);
    } catch (err) {
      console.error("Error adding contact:", err);
      setSaveStatus('error');
      setTimeout(() => setSavingContact(false), 1500);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const msg = `Namaste ${name}! Hope your business is running great. Thank you for being a valued partner of ours. - ${profile?.full_name || "Our Shop"}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleNewInvoice = (contact: any) => {
    const navEvent = new CustomEvent('app:navigate', {
      detail: {
        module: 'invoices',
        props: {
          mode: 'create',
          prefill: { contact_id: contact.id }
        }
      }
    });
    window.dispatchEvent(navEvent);
    setSelectedContact(null);
  };

  useEffect(() => {
    const handleOpenContact = (e: any) => {
      if (e.detail?.contactId) {
        const c = contacts?.find((contact: any) => contact.id === e.detail.contactId);
        if (c) setSelectedContact(c);
      }
    };
    window.addEventListener('app:contact-detail', handleOpenContact);
    return () => window.removeEventListener('app:contact-detail', handleOpenContact);
  }, [contacts]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 p-8">
      {/* Executive Financial Hub Banner */}
      <div className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-10 shadow-2xl border border-white/5">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]"></div>
        
        <div className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Relationship Live</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">
              Partners & <br className="hidden md:block xl:hidden" /> <span className="text-indigo-500">Connections</span>
            </h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider max-w-md leading-relaxed">
              Complete oversight of your ecosystem. Manage high-value clients and key suppliers from a single command center.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:w-auto">
            <div className="px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex-1 min-w-[140px]">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Customers</div>
              <div className="text-xl font-black text-white leading-none mb-1">{totalCustomers}</div>
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Active</span>
            </div>
            <div className="px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex-1 min-w-[140px]">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Suppliers</div>
              <div className="text-xl font-black text-white leading-none mb-1">{totalSuppliers}</div>
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Partners</span>
            </div>
            <div className="px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex-1 min-w-[140px]">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Cash Liquidity</div>
              <div className="text-xl font-black text-white leading-none mb-1">{formatK(cashLiquidity)}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">- 12.5%</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex-1 min-w-[140px]">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Pending</div>
              <div className="text-xl font-black text-white leading-none mb-1">{formatK(pendingReceivables)}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-rose-400">- 3.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Executive Control Bar */}
      <div className="space-y-6">
        {/* Row 1: High-Fidelity Search */}
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-lg group-focus-within:bg-indigo-600 transition-colors">
              <Search size={18} />
            </div>
          </div>
          <input 
            type="text" 
            placeholder="Search partners by name, phone, or location..."
            className="w-full bg-white border-2 border-slate-100 focus:border-indigo-500 p-6 pl-20 rounded-[2rem] text-sm font-bold outline-none transition-all shadow-sm placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Row 2: Unified Utilities */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 p-4 rounded-[2.5rem] border border-slate-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            {["All", "customer", "supplier"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterType === t
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-900/20"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t === "All" ? "All Contacts" : t === "customer" ? "Customers" : "Suppliers"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
            >
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center group-hover:rotate-90 transition-transform">
                <Plus size={14} />
              </div>
              Onboard Partner
            </button>
          </div>
        </div>
      </div>

        {/* Contacts Table Container */}
        <div className="bg-white/40 border border-slate-200/40 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-4 min-w-[800px]">
              <thead>
                <tr>
                  <th className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left w-[30%]">Partner Identity</th>
                  <th className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left w-[10%]">Role</th>
                  <th className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left w-[15%]">Direct Contact</th>
                  <th className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left hidden xl:table-cell w-[15%]">Tax Details</th>
                  <th className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left hidden lg:table-cell w-[15%]">Location</th>
                  <th className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right w-[15%]">Tactical Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8">
                      <SkeletonCard />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center font-bold text-slate-400 text-sm italic">
                      "No connections found in current quadrant."
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedContact(c)}
                    >

                      <td className="px-5 py-6 bg-white border border-slate-100 rounded-l-3xl shadow-sm group-hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-base shadow-lg group-hover:bg-indigo-600 transition-colors">
                            {c.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{c.name}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID: {c.id.slice(0, 6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-6 bg-white border-y border-slate-100 shadow-sm transition-colors">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${
                            c.type === "customer"
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}
                        >
                          {c.type === "customer" ? "Retail" : "Partner"}
                        </span>
                      </td>
                      <td className="px-5 py-6 bg-white border-y border-slate-100 shadow-sm transition-colors">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            {c.phone ? (
                              <>
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                {c.phone}
                              </>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">Offline</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-6 bg-white border-y border-slate-100 shadow-sm transition-colors hidden xl:table-cell">
                        <div className="flex flex-col">
                          <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{c.gstin || "N/A"}</div>
                          <span className="text-[9px] font-bold text-slate-400">GST</span>
                        </div>
                      </td>
                      <td className="px-5 py-6 bg-white border-y border-slate-100 shadow-sm transition-colors hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          {c.city && <span className="text-slate-900 line-clamp-1">{c.city},</span>}
                          {c.state || "-"}
                        </div>
                      </td>
                      <td className="px-5 py-6 bg-white border border-slate-100 rounded-r-3xl shadow-sm transition-colors">
                        <div className="flex gap-2 items-center justify-end">
                          {c.phone && (
                            <button
                              onClick={() => openWhatsApp(c.phone, c.name)}
                              className="group/btn flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-emerald-500 text-slate-600 hover:text-white rounded-xl border border-slate-200/60 hover:border-emerald-400 transition-all active:scale-95 shadow-sm"
                            >
                              <div className="w-7 h-7 rounded-lg bg-white group-hover/btn:bg-white/20 flex items-center justify-center text-emerald-600 group-hover/btn:text-white transition-colors shadow-sm">
                                <MessageSquare size={14} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">Connect</span>
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContact(c);
                            }}
                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <FileText size={16} />
                          </button>

                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>        {totalPages > 1 && (
            <div className="flex justify-between items-center px-10 py-5 mt-4 bg-white/40 border border-slate-200/40 rounded-[2rem] backdrop-blur-3xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} Contacts
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

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-start justify-center p-6 overflow-y-auto"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Add Customer or Supplier</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Save their details to write bills faster</p>

              <form onSubmit={handleAddContact} className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Full Name</label>
                  <input
                    required
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="Enter full name..."
                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Phone Number</label>
                    <input
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="Enter phone..."
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email Address</label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="Enter email..."
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Contact Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["customer", "supplier"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewContact({ ...newContact, type: t })}
                        className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                          newContact.type === t
                            ? "bg-slate-900 text-neon border-slate-900 shadow-xl"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        }`}
                      >
                        {t === "customer" ? "Customer" : "Supplier"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Street Address</label>
                  <input
                    value={newContact.address}
                    onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                    placeholder="Enter building, street, area..."
                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">City</label>
                    <input
                      value={newContact.city}
                      onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                      placeholder="City"
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Pincode</label>
                    <input
                      value={newContact.pincode}
                      onChange={(e) => setNewContact({ ...newContact, pincode: e.target.value })}
                      placeholder="Pincode"
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">State</label>
                    <select
                      value={newContact.state}
                      onChange={(e) => setNewContact({ ...newContact, state: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">GSTIN (Optional)</label>
                    <input
                      value={newContact.gstin}
                      onChange={(e) => setNewContact({ ...newContact, gstin: e.target.value })}
                      placeholder="GST number..."
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 border-2 border-slate-100 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neon hover:text-slate-900 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Save Contact
                  </button>
                </div>
              </form>

              {/* Premium Saving Animation Overlay */}
              <AnimatePresence>
                {savingContact && (
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
                          {saveStatus === 'success' ? 'Contact Saved!' : saveStatus === 'error' ? 'Failed to Save' : 'Syncing with Database'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                          {saveStatus === 'success' 
                            ? `Successfully added to contact list!` 
                            : saveStatus === 'error'
                            ? `Please check your inputs`
                            : `Saving ${newContact.name || 'Contact'}...`}
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

      <AnimatePresence>
        {selectedContact && (
          <CustomerDetail 
            contact={selectedContact} 
            onClose={() => setSelectedContact(null)}
            onNewInvoice={handleNewInvoice}
          />
        )}
      </AnimatePresence>
    </motion.div>

  );
}
