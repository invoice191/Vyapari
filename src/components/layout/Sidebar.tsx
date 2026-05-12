import React from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  BarChart3, 
  Brain, 
  Zap, 
  FileSearch, 
  Receipt, 
  Box, 
  BookOpen, 
  Landmark, 
  Settings, 
  Users, 
  History,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  active: string;
  setActive: (key: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  logout: () => void;
}

const MODULES = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "inventory", label: "My Stock", icon: Box },
  { key: "invoices", label: "Bills & Orders", icon: Receipt },
  { key: "ocr", label: "What I Bought", icon: FileSearch },
  { key: "contacts", label: "My Customers & Suppliers", icon: Users },
  { key: "ledger", label: "Money In & Out", icon: BookOpen },
  { key: "dss", label: "Smart Tips", icon: Brain },
  { key: "reports", label: "My Reports", icon: BarChart3 },
  { key: "audit", label: "Activity History", icon: History },
];

const SYSTEM_MODULES = [
  { key: "settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  active, 
  setActive, 
  sidebarOpen, 
  setSidebarOpen, 
  isMobile,
  drawerOpen,
  setDrawerOpen,
  logout 
}) => {
  const NavItem = ({ m, small = false }: any) => {
    const Icon = m.icon;
    const isActive = active === m.key;

    return (
      <motion.div 
        key={m.key}
        onClick={() => { setActive(m.key); if (isMobile) setDrawerOpen(false); }}
        whileHover={{ x: sidebarOpen ? 4 : 0, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          group relative flex items-center transition-all duration-300 rounded-2xl mb-1.5 mx-3
          ${sidebarOpen ? 'px-4 py-3.5' : 'justify-center w-12 h-12 mx-auto'}
          ${isActive 
            ? "bg-indigo-600 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)]" 
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"}
        `}
      >
        <Icon size={isActive ? 20 : 19} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'}`} />
        
        <AnimatePresence mode="popLayout">
          {(sidebarOpen || drawerOpen) && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`font-black tracking-tight whitespace-nowrap ml-3 ${small ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-[0.1em]`}
            >
              {m.label}
            </motion.span>
          )}
        </AnimatePresence>

        {isActive && (
          <motion.div 
            layoutId="activeIndicator"
            className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          />
        )}

        {!sidebarOpen && !drawerOpen && !isMobile && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-[500] shadow-xl whitespace-nowrap">
            {m.label}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full glass-premium border-r border-white/20 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden relative z-[100]">
      {/* Structural Glass Overlay */}
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/40 to-transparent" />
      {/* Brand Header */}
      <div className={`px-6 py-10 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
        <motion.div 
          className="flex items-center gap-4 cursor-pointer overflow-hidden"
          layout
        >
          <div className="w-11 h-11 bg-indigo-600 text-white flex items-center justify-center font-black text-2xl rounded-2xl shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] flex-shrink-0 ring-4 ring-indigo-600/10">
            V
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="font-black text-2xl tracking-tighter text-slate-900 whitespace-nowrap"
              >
                VYAPARI
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
        {(sidebarOpen || drawerOpen) && (
          <div className="px-6 mb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Operations
          </div>
        )}
        {MODULES.map(m => <NavItem key={m.key} m={m} />)}
        
        <div className="mt-8 pt-8 border-t border-slate-200/40">
          {(sidebarOpen || drawerOpen) && (
            <div className="px-6 mb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              System
            </div>
          )}
          {SYSTEM_MODULES.map(m => <NavItem key={m.key} m={m} small />)}
        </div>
      </div>
      
      {/* Footer / Toggle */}
      <div className="p-4 mt-auto space-y-4">
        {!isMobile && (
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full py-2 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        )}
        
        <button 
          onClick={logout}
          className={`
            w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all group
            ${sidebarOpen 
              ? "bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200/60" 
              : "justify-center text-slate-400 hover:text-red-600"}
          `}
          title="Logout System"
        >
          <LogOut size={18} />
          {sidebarOpen && <span className="font-bold text-[11px] uppercase tracking-widest">Logout</span>}
        </button>
      </div>
    </div>
  );
};
