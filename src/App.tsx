import { useState, useEffect } from "react";
import { C } from "./lib/constants";
import { useBreakpoint } from "./hooks/useBreakpoint";
import Dashboard from "./components/dashboard/Dashboard";
import Reports from "./modules/Reports";
import DSS from "./components/dss/DSS";
import Prediction from "./components/prediction/Prediction";
import OCR from "./components/ocr/OCR";
import Invoices from "./components/invoices/Invoices";
import Inventory from "./components/inventory/Inventory";
import Ledger from "./components/ledger/Ledger";
import AuditLogs from "./components/audit/AuditLogs";
import Settings from "./components/modules/Settings/Settings";
import AutoPilot from "./components/automation/AutoPilot";
import TeamHub from "./components/team/TeamHub";
import ForcePasswordChange from "./components/auth/ForcePasswordChange";
import ContactsList from "./components/contacts/ContactsList";
import CommandCenter from "./modules/CommandCenter";
import BankersView from "./modules/BankersView";
import PurchaseHub from "./components/purchases/PurchaseHub";
import AccountingHub from "./components/accounting/AccountingHub";
import POSCounterMode from "./components/pos/CounterMode";
import Background3D from "./components/common/Background3D";
import GatewayLanding from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PaymentPortal from "./pages/PaymentPortal";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./components/onboarding/Onboarding";
import InvoiceAIConsole from "./components/invoices/InvoiceAIConsole";
import { MeshInbox } from "./components/invoices/MeshInbox";
import { SmartRetailAnalytics } from "./components/analytics/SmartRetailAnalytics";

import { VANIPanel } from "./components/VANI";
import { Routes, Route, Navigate } from "react-router-dom";
import CommandPalette from "./components/common/CommandPalette";
import { motion, AnimatePresence } from "motion/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ModuleErrorBoundary } from "./components/ModuleErrorBoundary";
import { useRealtime } from "./hooks/useRealtime";
import { useAutomationDaemon } from "./hooks/useAutomationDaemon";
import { RoleGuard } from "./components/common/RoleGuard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { Sidebar } from "./components/layout/Sidebar";
import { Navbar } from "./components/layout/Navbar";
import { LayoutDashboard, Receipt, Box, Users, BookOpen, MoreHorizontal, X, Zap } from "lucide-react";

const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "--" },
  { key: "command", label: "Home", icon: "--" },
  { key: "reports", label: "Reports", icon: "--" },
  { key: "dss", label: "Business Tips", icon: "--" },
  { key: "prediction", label: "Business Testing", icon: "--" },
  { key: "ocr", label: "Snap a Photo", icon: "--" },
  { key: "invoices", label: "Invoices", icon: "--" },
  { key: "inventory", label: "Inventory", icon: "--" },
  { key: "ledger", label: "Accounting", icon: "--" },
  { key: "banker", label: "Bankers View", icon: "--" },
];

const SYSTEM_MODULES = [
  { key: "settings", label: "Settings", icon: "--" },
  { key: "users", label: "Staff", icon: "---" },
  { key: "audit", label: "System Logs", icon: "--" },
];

function App() {
  const { user, profile, business, loading, signIn: login, signOut: logout, fetchProfileAndBusiness, needsPasswordChange } = useAuth();
  useRealtime();
  useAutomationDaemon(60); // Runs every 60 minutes
  const [showLanding, setShowLanding] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isVaniActive, setIsVaniActive] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [active]);
  useEffect(() => {
    if (isMobile || isTablet) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile, isTablet]);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail?.module) {
        setActive(e.detail.module.toLowerCase());
      }
    };
    window.addEventListener('app:navigate', handleNavigate);
    return () => window.removeEventListener('app:navigate', handleNavigate);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("[Vyapari] Auth session fetch timeout. Forcing loading to false.");
        setAuthTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !authTimeout) {
    return (
      <div className="h-screen flex items-center justify-center bg-paper">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
          className="text-4xl"
        >
          --
        </motion.div>
      </div>
    );
  }

  const isPayRoute = window.location.pathname.startsWith('/pay');

  if (isPayRoute) {
    return (
      <Routes>
        <Route path="/pay" element={<PaymentPortal />} />
        <Route path="*" element={<Navigate to="/pay" replace />} />
      </Routes>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<GatewayLanding />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Onboarding Guard
  if (business && !business.onboarding_completed) {
    return <Onboarding onComplete={() => fetchProfileAndBusiness(user.id)} />;
  }



  const renderModule = () => {
    switch (active) {
      case "dashboard": return <ModuleErrorBoundary moduleName="Home"><Dashboard /></ModuleErrorBoundary>;
      case "autopilot": return <ModuleErrorBoundary moduleName="Auto-Pilot"><AutoPilot /></ModuleErrorBoundary>;
      case "command":   return <ModuleErrorBoundary moduleName="Home"><RoleGuard module="Command Center"><CommandCenter /></RoleGuard></ModuleErrorBoundary>;
      case "reports":   return <ModuleErrorBoundary moduleName="My Reports"><RoleGuard module="Reports"><Reports /></RoleGuard></ModuleErrorBoundary>;
      case "dss":       return <ModuleErrorBoundary moduleName="Smart Tips"><RoleGuard module="DSS"><DSS /></RoleGuard></ModuleErrorBoundary>;
      case "prediction":return <ModuleErrorBoundary moduleName="What-If Calculator"><RoleGuard module="Simulation"><Prediction /></RoleGuard></ModuleErrorBoundary>;
      case "ocr":       return <ModuleErrorBoundary moduleName="What I Bought"><OCR /></ModuleErrorBoundary>;
      case "invoices":  return <ModuleErrorBoundary moduleName="Bills & Orders"><Invoices /></ModuleErrorBoundary>;
      case "invoice_ai": return <ModuleErrorBoundary moduleName="Smart Billing Assistant"><InvoiceAIConsole /></ModuleErrorBoundary>;
      case "pos":       return <ModuleErrorBoundary moduleName="POS Counter Mode"><POSCounterMode /></ModuleErrorBoundary>;
      case "inventory": return <ModuleErrorBoundary moduleName="My Stock"><Inventory /></ModuleErrorBoundary>;
      case "purchases": return <ModuleErrorBoundary moduleName="Vendor Orders"><PurchaseHub /></ModuleErrorBoundary>;
      case "contacts":  return <ModuleErrorBoundary moduleName="My Customers & Suppliers"><ContactsList /></ModuleErrorBoundary>;
      case "ledger":    return <ModuleErrorBoundary moduleName="Money History"><Ledger /></ModuleErrorBoundary>;
      case "accounting": return <ModuleErrorBoundary moduleName="Accountant View"><AccountingHub /></ModuleErrorBoundary>;
      case "banker":    return <ModuleErrorBoundary moduleName="Loan Readiness Report"><RoleGuard module="Bankers View"><BankersView /></RoleGuard></ModuleErrorBoundary>;
      case "settings":  return <ModuleErrorBoundary moduleName="Settings"><Settings /></ModuleErrorBoundary>;
      case "users":     return <ModuleErrorBoundary moduleName="My Team"><RoleGuard module="Settings"><TeamHub /></RoleGuard></ModuleErrorBoundary>;
      case "audit":     return <ModuleErrorBoundary moduleName="Activity History"><RoleGuard module="Settings"><AuditLogs /></RoleGuard></ModuleErrorBoundary>;
      case "smart_analytics": return <ModuleErrorBoundary moduleName="Smart Retail Analytics"><SmartRetailAnalytics /></ModuleErrorBoundary>;
      case "mesh":      return <ModuleErrorBoundary moduleName="Mesh Inbox"><MeshInbox businessId={profile?.business_id || ""} /></ModuleErrorBoundary>;
      default:          return <ModuleErrorBoundary moduleName="Home"><Dashboard /></ModuleErrorBoundary>;
    }
  };

  const moduleTitles: Record<string, string> = {
    dashboard: "Home", autopilot: "Auto Reminders", command: "Business Overview", reports: "Reports",
    dss: "Business Tips", prediction: "Business Testing",
    ocr: "Snap a Photo", invoices: "Bills & Orders",
    inventory: "My Stock", contacts: "Customers & Suppliers", ledger: "Money History", banker: "Loan Ready Check",
    invoice_ai: "Smart Billing Assistant",
    settings: "Settings", users: "My Team", audit: "Activity Log",
    smart_analytics: "Smart Retail Analytics",
  };



  const BOTTOM_NAV = [
    { key: "dashboard", label: "Home", icon: LayoutDashboard },
    { key: "inventory", label: "Stock", icon: Box },
    { key: "pos", label: "Quick POS", icon: Zap },
    { key: "contacts", label: "Clients", icon: Users },
    { key: "invoices", label: "Bills", icon: Receipt },
  ];

  return (
    <div className="h-screen flex flex-col selection:bg-neon selection:text-ink relative overflow-hidden">
      {/* 3D Visual Experience */}
      <Background3D />
      
      {/* Security Intercept for new staff */}
      {needsPasswordChange && <ForcePasswordChange />}

      <Navbar 
        activeTitle={moduleTitles[active]} 
        user={user} 
        profile={profile} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        isMobile={isMobile}
        setActive={setActive}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — always visible, spring-animated width */}
        {!isMobile && !isTablet && (
          <motion.aside 
            animate={{ width: sidebarOpen ? 280 : 72 }}
            transition={{ type: "spring", stiffness: 280, damping: 32, mass: 1 }}
            className="h-full flex-shrink-0 z-[100] will-change-[width]"
          >
            <Sidebar 
              active={active}
              setActive={setActive}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              isMobile={false}
              drawerOpen={false}
              setDrawerOpen={() => {}}
              logout={logout}
            />
          </motion.aside>
        )}

        {/* Tablet: icon-only fixed sidebar, never collapses */}
        {isTablet && (
          <aside className="h-full w-[72px] flex-shrink-0 z-[100]">
            <Sidebar 
              active={active}
              setActive={setActive}
              sidebarOpen={false}
              setSidebarOpen={() => {}}
              isMobile={false}
              drawerOpen={false}
              setDrawerOpen={() => {}}
              logout={logout}
            />
          </aside>
        )}

        {/* Mobile: slide-in drawer overlay */}
        <AnimatePresence>
          {isMobile && drawerOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)} 
                className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[300]"
              />
              <motion.div 
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 320, damping: 35 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] z-[400]"
              >
                <Sidebar 
                  active={active}
                  setActive={setActive}
                  sidebarOpen={true}
                  setSidebarOpen={() => {}}
                  isMobile={true}
                  drawerOpen={drawerOpen}
                  setDrawerOpen={setDrawerOpen}
                  logout={logout}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className={`flex-1 min-w-0 relative overflow-y-auto h-full custom-scrollbar ${
          isMobile ? 'p-3 pb-24' : isTablet ? 'p-5 sm:p-6' : 'p-6 sm:p-10'
        }`}>
          <div className="max-w-[1600px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
              >
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-[350] bg-white/95 backdrop-blur-2xl border-t border-slate-200/60 px-2 pb-safe" style={{boxShadow:'0 -4px 24px -8px rgba(15,23,42,0.12)'}}>
          <div className="flex items-center justify-around py-2">
            {BOTTOM_NAV.map(({ key, label, icon: Icon }) => {
              const isActive = active === key;
              const isPOS = key === 'pos';
              if (isPOS) {
                return (
                  <button
                    key={key}
                    onClick={() => { setActive(key); setDrawerOpen(false); }}
                    className="flex flex-col items-center gap-1 -mt-4 relative z-10 min-w-[56px]"
                  >
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
                        isActive 
                          ? 'bg-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.4)] scale-105' 
                          : 'bg-indigo-600 shadow-[0_4px_12px_rgba(99,102,241,0.4)] hover:bg-indigo-500 active:scale-95'
                      }`}
                    >
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${
                      isActive ? 'text-amber-600 font-black' : 'text-indigo-600'
                    }`}>{label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  onClick={() => { setActive(key); setDrawerOpen(false); }}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[52px] ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-slate-400 active:scale-95'
                  }`}
                >
                  <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-indigo-100 shadow-sm' : ''
                  }`}>
                    <Icon size={isActive ? 20 : 19} strokeWidth={isActive ? 2.5 : 1.8} />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}>{label}</span>
                </button>
              );
            })}

            {/* More button that opens the drawer */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[52px] ${
                drawerOpen ? 'text-indigo-600' : 'text-slate-400 active:scale-95'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${drawerOpen ? 'bg-indigo-100' : ''}`}>
                {drawerOpen
                  ? <X size={20} strokeWidth={2.5} />
                  : <MoreHorizontal size={19} strokeWidth={1.8} />}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                {drawerOpen ? 'Close' : 'More'}
              </span>
            </button>
          </div>
        </nav>
      )}

      {/* VANI Assistant Overlay */}
      <VANIPanel />

      {/* Global Command Palette (-K) */}
      <CommandPalette 
        active={active} 
        onSelect={setActive} 
      />
    </div>
  );
}

import { DataProvider as GlobalDataProvider } from "./context/DataContext";
import { DataProvider as SyncProvider } from "./context/DataProvider";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SyncProvider>
            <GlobalDataProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </GlobalDataProvider>
          </SyncProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
