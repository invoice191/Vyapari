import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  BarChart3, 
  Brain, 
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
  ChevronRight,
  ShoppingCart,
  Calculator
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

// Categorized module taxonomy for standard ERP hierarchy
const MODULE_GROUPS = [
  {
    title: "Core Operations",
    items: [
      { key: "dashboard", label: "Executive Desk", icon: LayoutDashboard },
      { key: "pos", label: "Point of Sale", icon: Calculator },
    ]
  },
  {
    title: "Supply & Stock",
    items: [
      { key: "inventory", label: "Stock Ledger", icon: Box },
      { key: "purchases", label: "Procurement", icon: ShoppingCart },
    ]
  },
  {
    title: "Financial Center",
    items: [
      { key: "invoices", label: "Sales & Billing", icon: Receipt },
      { key: "ledger", label: "General Ledger", icon: BookOpen },
      { key: "ocr", label: "Expense OCR", icon: FileSearch },
    ]
  },
  {
    title: "Intelligence & CRM",
    items: [
      { key: "contacts", label: "CRM Contacts", icon: Users },
      { key: "dss", label: "Neural AI Hub", icon: Brain },
      { key: "reports", label: "Metric Analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Compliance",
    items: [
      { key: "accounting", label: "Financial Audit", icon: Landmark },
      { key: "audit", label: "Access Logs", icon: History },
    ]
  }
];

const FOOTER_MODULES = [
  { key: "settings", label: "Configurations", icon: Settings },
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
        whileHover={{ x: sidebarOpen ? 4 : 0, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={`
          group relative flex items-center transition-all duration-200 rounded-xl mb-1 mx-3 cursor-pointer
          ${sidebarOpen ? 'px-4 py-2.5' : 'justify-center w-11 h-11 mx-auto'}
          ${isActive 
            ? "bg-indigo-600 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] border border-indigo-500/20" 
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"}
        `}
      >
        <Icon size={isActive ? 18 : 17} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'}`} />
        
        <AnimatePresence mode="popLayout">
          {(sidebarOpen || drawerOpen) && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`font-bold whitespace-nowrap ml-3 ${small ? 'text-[10px]' : 'text-[11px]'} uppercase tracking-[0.08em]`}
            >
              {m.label}
            </motion.span>
          )}
        </AnimatePresence>

        {isActive && (
          <motion.div 
            layoutId="activeIndicator"
            className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)]"
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          />
        )}

        {!sidebarOpen && !drawerOpen && !isMobile && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-8px] group-hover:translate-x-0 z-[500] shadow-xl border border-slate-800 whitespace-nowrap">
            {m.label}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full glass-premium border-r border-slate-200/50 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.03)] overflow-hidden relative z-[100]">
      {/* Backdrop overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Header & Branding Block */}
      <div className={`px-6 py-8 flex items-center border-b border-slate-200/20 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
        <motion.div 
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
          layout
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl rounded-xl shadow-lg flex-shrink-0 border border-indigo-500/30 ring-4 ring-indigo-500/5">
            V
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="font-black text-base tracking-[0.15em] text-slate-800 uppercase leading-tight">
                  Vyapari
                </span>
                <span className="font-bold text-[8px] tracking-[0.25em] text-indigo-500 uppercase mt-0.5">
                  ERP SUITE v10.0
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Scrollable Enterprise Taxonomy Nav */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar space-y-6">
        {MODULE_GROUPS.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            {(sidebarOpen || drawerOpen) && (
              <div className="px-7 mb-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span>{group.title}</span>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200/60 to-transparent" />
              </div>
            )}
            {group.items.map(m => <NavItem key={m.key} m={m} />)}
          </div>
        ))}
      </div>
      
      {/* Footer Control Panel */}
      <div className="mt-auto border-t border-slate-200/30 bg-slate-50/40 p-4 space-y-3">
        {/* Settings Configurations */}
        {FOOTER_MODULES.map(m => <NavItem key={m.key} m={m} small />)}

        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/40">
          <button 
            onClick={logout}
            className={`
              flex items-center gap-2.5 py-2.5 rounded-lg transition-all duration-200 group
              ${sidebarOpen 
                ? "flex-1 px-3 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/60 shadow-sm" 
                : "justify-center w-10 h-10 text-slate-400 hover:text-rose-600"}
            `}
            title="Logout Session"
          >
            <LogOut size={15} />
            {sidebarOpen && <span className="font-bold text-[10px] uppercase tracking-widest">Logout</span>}
          </button>

          {!isMobile && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 bg-white border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
              title={sidebarOpen ? "Collapse" : "Expand"}
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
