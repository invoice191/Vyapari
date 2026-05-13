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
  LayoutDashboard
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
    <header className="h-18 bg-white/40 backdrop-blur-2xl border-b border-slate-200/40 flex items-center px-6 sm:px-10 sticky top-0 z-[200] gap-4 sm:gap-8 shadow-sm">
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
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Live System</span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
            {activeTitle}
          </h1>
        </div>
      </div>

      {/* Fully Functional Inline Search Bar */}
      <div ref={searchRef} className="hidden lg:flex items-center flex-1 max-w-md mx-auto relative z-[500]">
        <div className="relative w-full group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-indigo-600' : 'text-slate-400'}`} size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearching(true)}
            placeholder="Search commands, products, or customers..." 
            className={`w-full bg-slate-100/50 border border-slate-200/60 pl-12 pr-12 py-2.5 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
              isSearching ? 'bg-white border-indigo-600 ring-4 ring-indigo-600/5 shadow-lg' : 'focus:bg-white focus:border-indigo-600'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm opacity-60 pointer-events-none">
            <Command size={10} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400">K</span>
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
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100/50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-white transition-all">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch:</span>
          <span className="text-[11px] font-bold text-slate-900">HQ Main</span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>

        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block mx-1" />

        {/* VANI Trigger */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new CustomEvent('vani:trigger'))}
          className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all relative group"
        >
          <Mic size={18} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full animate-ping opacity-75" />
          {/* Tooltip */}
          <div className="absolute top-full mt-3 right-0 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap font-bold tracking-wider z-[300]">
            VANI VOICE ASSISTANT
          </div>
        </motion.button>

        {/* Notifications */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setNotificationsOpen(true)}
          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all relative shadow-sm group"
        >
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 10, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3 
            }}
          >
          <Bell size={18} className="group-hover:fill-indigo-50" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse"
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
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 ml-1">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-black text-slate-900 truncate max-w-[120px]">
              {user.user_metadata?.full_name || profile?.full_name || user.email.split('@')[0]}
            </div>
            <div className="text-[9px] text-indigo-600 font-black uppercase tracking-[0.15em] mt-0.5">
              {profile?.role || 'Administrator'}
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 border-2 border-white ring-1 ring-slate-200 rounded-full overflow-hidden shadow-md flex-shrink-0 bg-slate-50 cursor-pointer"
          >
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-xs text-indigo-600">
                {(user.user_metadata?.full_name || profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
};
