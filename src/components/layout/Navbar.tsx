import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Bell, 
  Mic, 
  Menu, 
  X, 
  ChevronDown,
  Activity,
  Command,
  ArrowRight,
  Box,
  Users,
  LayoutDashboard,
  Shield
} from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { useGlobalData } from "../../context/DataContext";

interface NavbarProps {
  activeTitle: string;
  user: any;
  profile: any;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  isMobile: boolean;
  setActive: (module: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTitle, 
  user, 
  profile, 
  sidebarOpen, 
  setSidebarOpen, 
  drawerOpen,
  setDrawerOpen,
  isMobile,
  setActive
}) => {
  const { products = [], contacts = [] } = useGlobalData();
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  // Search Logic
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const modules = [
    { key: "dashboard", label: "Home Dashboard", icon: LayoutDashboard, desc: "Analytics overview" },
    { key: "inventory", label: "My Stock", icon: Box, desc: "Product catalog & quantity" },
    { key: "contacts", label: "Customers & Suppliers", icon: Users, desc: "Manage relationships" },
  ];

  const searchResults = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { modules, products: [], contacts: [] };
    
    return {
      modules: modules.filter(m => m.label.toLowerCase().includes(q)),
      products: products.filter((p: any) => p.name.toLowerCase().includes(q)).slice(0, 4),
      contacts: contacts.filter((c: any) => c.name.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 4)
    };
  }, [searchQuery, products, contacts]);

  const hasResults = searchResults.modules.length > 0 || searchResults.products.length > 0 || searchResults.contacts.length > 0;

  React.useEffect(() => {
    const handleCount = (e: any) => setUnreadCount(e.detail.count);
    window.addEventListener('notifications:count', handleCount);
    return () => window.removeEventListener('notifications:count', handleCount);
  }, []);
  return (
    <header className="h-16 bg-white/60 backdrop-blur-3xl border-b border-slate-200/50 flex items-center px-4 sm:px-8 sticky top-0 z-[200] gap-4 sm:gap-6" style={{boxShadow:'0 1px 0 rgba(0,0,0,0.04), 0 4px 16px -8px rgba(15,23,42,0.08)'}}>
      {/* Mobile Menu Toggle / Breadcrumb */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {isMobile && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="w-10 h-10 flex items-center justify-center text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        )}
        
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest hidden sm:inline">Live</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/80">
              <Shield size={9} className="text-slate-400" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Secured</span>
            </div>
          </div>
          <h1 className="text-[15px] font-bold text-slate-900 tracking-tight whitespace-nowrap leading-tight">
            {activeTitle}
          </h1>
        </div>
      </div>

      {/* Fully Functional Inline Search Bar */}
      <div ref={searchRef} className="hidden lg:flex items-center flex-1 max-w-sm mx-auto relative z-[500]">
        <div className="relative w-full">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isSearching ? 'text-indigo-500' : 'text-slate-400'}`} size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearching(true)}
            placeholder="Search anything..."
            className={`w-full bg-slate-100/70 border pl-10 pr-20 py-2 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 ${
              isSearching
                ? 'bg-white border-indigo-400 ring-4 ring-indigo-500/8 shadow-md'
                : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-100'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded-md opacity-50 pointer-events-none">
            <Command size={9} className="text-slate-400" />
            <span className="text-[9px] font-bold text-slate-400">K</span>
          </div>
        </div>

        <AnimatePresence>
          {isSearching && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
            >
              <div className="max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
                {/* Quick Modules */}
                {searchResults.modules.length > 0 && (
                  <div className="mb-3 last:mb-0">
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                      <span>Shortcuts</span>
                      <span className="opacity-40 italic">GO TO</span>
                    </div>
                    {searchResults.modules.map((m) => (
                      <div 
                        key={m.key}
                        onClick={() => { setActive(m.key); setIsSearching(false); setSearchQuery(""); }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm">
                          <m.icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{m.label}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.desc}</div>
                        </div>
                        <ArrowRight size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Products Section */}
                {searchResults.products.length > 0 && (
                  <div className="mb-3 last:mb-0">
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 mt-2 pt-4 flex justify-between">
                      <span>Products</span>
                      <span className="opacity-40 italic">QUICK_ACTIONS</span>
                    </div>
                    {searchResults.products.map((p: any) => (
                      <div 
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                      >
                        <div 
                          onClick={() => { setActive("inventory"); window.dispatchEvent(new CustomEvent('app:inventory-search', { detail: { query: p.name } })); setIsSearching(false); setSearchQuery(""); }}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm"
                        >
                          <Box size={18} />
                        </div>
                        <div 
                          onClick={() => { setActive("inventory"); window.dispatchEvent(new CustomEvent('app:inventory-search', { detail: { query: p.name } })); setIsSearching(false); setSearchQuery(""); }}
                          className="flex-1"
                        >
                          <div className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rs.{p.selling_price} - STOCK: {p.quantity}</div>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             title="Create Bill with this Item"
                             onClick={(e) => {
                               e.stopPropagation();
                               setActive("invoices");
                               window.dispatchEvent(new CustomEvent('app:navigate', { 
                                 detail: { module: 'invoices', props: { mode: 'create', prefill: { items: [{ ...p, qty: 1 }] } } } 
                               }));
                               setIsSearching(false); setSearchQuery("");
                             }}
                             className="p-2 bg-white text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                           >
                             <ArrowRight size={14} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contacts Section */}
                {searchResults.contacts.length > 0 && (
                  <div className="mb-3 last:mb-0">
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 mt-2 pt-4 flex justify-between">
                      <span>Connections</span>
                      <span className="opacity-40 italic">CONNECT_HUB</span>
                    </div>
                    {searchResults.contacts.map((c: any) => (
                      <div 
                        key={c.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-colors group"
                      >
                        <div 
                          onClick={() => { setActive("contacts"); window.dispatchEvent(new CustomEvent('app:contact-detail', { detail: { contactId: c.id } })); setIsSearching(false); setSearchQuery(""); }}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm"
                        >
                          <Users size={18} />
                        </div>
                        <div 
                          onClick={() => { setActive("contacts"); window.dispatchEvent(new CustomEvent('app:contact-detail', { detail: { contactId: c.id } })); setIsSearching(false); setSearchQuery(""); }}
                          className="flex-1"
                        >
                          <div className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{c.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{c.phone || 'No Phone Registered'}</div>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             title="Create New Bill"
                             onClick={(e) => {
                               e.stopPropagation();
                               setActive("invoices");
                               window.dispatchEvent(new CustomEvent('app:navigate', { 
                                 detail: { module: 'invoices', props: { mode: 'create', prefill: { contact_id: c.id } } } 
                               }));
                               setIsSearching(false); setSearchQuery("");
                             }}
                             className="p-2 bg-white text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                           >
                             <ArrowRight size={14} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!hasResults && (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                      <Search size={24} />
                    </div>
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No matching signals found</div>
                    <div className="text-[9px] font-bold text-slate-300 uppercase mt-1">Try searching for products, people or modules</div>
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0 ml-auto">
        {/* Branch Selector */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/60 border border-slate-200/60 rounded-lg cursor-pointer hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-semibold text-slate-700">HQ Main</span>
          <ChevronDown size={11} className="text-slate-400" />
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* VANI Trigger */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => window.dispatchEvent(new CustomEvent('vani:trigger'))}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-white group"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            boxShadow: '0 4px 14px -4px rgba(99,102,241,0.55), 0 1px 0 rgba(255,255,255,0.15) inset'
          }}
        >
          <Mic size={15} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-300 rounded-full border-2 border-white animate-ping opacity-70" />
          <div className="absolute top-full mt-2 right-0 bg-slate-900 text-white text-[9px] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap font-semibold tracking-wide z-[300]">
            Voice Assistant
          </div>
        </motion.button>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setNotificationsOpen(true)}
          className="relative w-9 h-9 bg-white border border-slate-200/80 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all group"
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 4 }}
          >
            <Bell size={16} />
          </motion.div>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[8px] font-bold rounded-full border-2 border-white flex items-center justify-center"
              style={{boxShadow:'0 0 8px rgba(244,63,94,0.5)'}}
            >
              {unreadCount}
            </motion.span>
          )}
        </motion.button>
        
        <NotificationCenter 
          isOpen={notificationsOpen} 
          onClose={() => setNotificationsOpen(false)} 
        />
        
        {/* Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/70">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[110px] leading-tight">
              {user.user_metadata?.full_name || profile?.full_name || user.email.split('@')[0]}
            </span>
            <span className="text-[9px] font-semibold text-indigo-500 uppercase tracking-[0.12em] mt-0.5">
              {profile?.role || 'Admin'}
            </span>
          </div>
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer ring-2 ring-white shadow-md"
            style={{boxShadow:'0 0 0 2px rgba(99,102,241,0.2), 0 2px 8px rgba(15,23,42,0.12)'}}
          >
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[11px] text-white"
                   style={{background:'linear-gradient(135deg,#6366F1,#4F46E5)'}}>
                {(user.user_metadata?.full_name || profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
};
