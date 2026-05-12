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
import UserManagement from "./components/users/UserManagement";
import ContactsList from "./components/contacts/ContactsList";
import CommandCenter from "./modules/CommandCenter";
import BankersView from "./modules/BankersView";
import Background3D from "./components/common/Background3D";
import GatewayLanding from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PaymentPortal from "./pages/PaymentPortal";
import Onboarding from "./components/onboarding/Onboarding";

import VANI from "./components/VANI/VANI";
import { Routes, Route, Navigate } from "react-router-dom";
import CommandPalette from "./components/common/CommandPalette";
import { motion, AnimatePresence } from "motion/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ModuleErrorBoundary } from "./components/ModuleErrorBoundary";
import { useRealtime } from "./hooks/useRealtime";
import { vaniService } from "./services/vaniService";
import { vaniExecutor } from "./services/vaniExecutor";
import { RoleGuard } from "./components/common/RoleGuard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { Sidebar } from "./components/layout/Sidebar";
import { Navbar } from "./components/layout/Navbar";

const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "command", label: "Command Center", icon: "🎮" },
  { key: "reports", label: "Reports", icon: "📈" },
  { key: "dss", label: "DSS", icon: "🧠" },
  { key: "prediction", label: "Simulation", icon: "🔮" },
  { key: "ocr", label: "OCR", icon: "📄" },
  { key: "invoices", label: "Invoices", icon: "🧾" },
  { key: "inventory", label: "Inventory", icon: "📦" },
  { key: "ledger", label: "Financial Ledger", icon: "📒" },
  { key: "banker", label: "Bankers View", icon: "🏦" },
];

const SYSTEM_MODULES = [
  { key: "settings", label: "Settings", icon: "⚙️" },
  { key: "users", label: "User Management", icon: "🛡️" },
  { key: "audit", label: "Audit Logs", icon: "📋" },
];

function App() {
  const { user, profile, business, loading, signIn: login, signOut: logout, fetchProfileAndBusiness } = useAuth();
  useRealtime();
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
          ⚙️
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
      case "command":   return <ModuleErrorBoundary moduleName="Home"><RoleGuard module="Command Center"><CommandCenter /></RoleGuard></ModuleErrorBoundary>;
      case "reports":   return <ModuleErrorBoundary moduleName="My Reports"><RoleGuard module="Reports"><Reports /></RoleGuard></ModuleErrorBoundary>;
      case "dss":       return <ModuleErrorBoundary moduleName="Smart Tips"><RoleGuard module="DSS"><DSS /></RoleGuard></ModuleErrorBoundary>;
      case "prediction":return <ModuleErrorBoundary moduleName="What-If Calculator"><RoleGuard module="Simulation"><Prediction /></RoleGuard></ModuleErrorBoundary>;
      case "ocr":       return <ModuleErrorBoundary moduleName="What I Bought"><OCR /></ModuleErrorBoundary>;
      case "invoices":  return <ModuleErrorBoundary moduleName="Bills & Orders"><Invoices /></ModuleErrorBoundary>;
      case "inventory": return <ModuleErrorBoundary moduleName="My Stock"><Inventory /></ModuleErrorBoundary>;
      case "contacts":  return <ModuleErrorBoundary moduleName="My Customers & Suppliers"><ContactsList /></ModuleErrorBoundary>;
      case "ledger":    return <ModuleErrorBoundary moduleName="Money In & Out"><Ledger /></ModuleErrorBoundary>;
      case "banker":    return <ModuleErrorBoundary moduleName="Loan Readiness Report"><RoleGuard module="Bankers View"><BankersView /></RoleGuard></ModuleErrorBoundary>;
      case "settings":  return <ModuleErrorBoundary moduleName="Settings"><Settings /></ModuleErrorBoundary>;
      case "users":     return <ModuleErrorBoundary moduleName="Users"><RoleGuard module="Settings"><UserManagement /></RoleGuard></ModuleErrorBoundary>;
      case "audit":     return <ModuleErrorBoundary moduleName="Activity History"><RoleGuard module="Settings"><AuditLogs /></RoleGuard></ModuleErrorBoundary>;
      default:          return <ModuleErrorBoundary moduleName="Home"><Dashboard /></ModuleErrorBoundary>;
    }
  };

  const moduleTitles: Record<string, string> = {
    dashboard: "Home", command: "Home Dashboard", reports: "My Reports",
    dss: "Smart Tips", prediction: "What-If Calculator",
    ocr: "What I Bought", invoices: "Bills & Orders",
    inventory: "My Stock", contacts: "My Customers & Suppliers", ledger: "Money In & Out", banker: "Loan Readiness Report",
    settings: "Settings", users: "User Management", audit: "Activity History",
  };



  return (
    <div className="min-h-screen flex flex-col selection:bg-neon selection:text-ink relative">
      {/* 3D Visual Experience */}
      <Background3D />
      


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

      <div className="flex flex-1">
        {!isMobile && (
          <motion.aside 
            animate={{ width: sidebarOpen ? 280 : 80 }}
            transition={{ type: "spring", stiffness: 280, damping: 32, mass: 1 }}
            className="sticky top-16 h-[calc(100vh-64px)] flex-shrink-0 z-[100] will-change-[width]"
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

        <main className="flex-1 p-6 sm:p-10 min-w-0 relative">
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

      {/* VANI Assistant Overlay */}
      <VANI 
        activeModule={active} 
        onCommand={setActive} 
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPalette 
        active={active} 
        onSelect={setActive} 
      />
    </div>
  );
}

import { DataProvider as GlobalDataProvider } from "./contexts/DataContext";
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
