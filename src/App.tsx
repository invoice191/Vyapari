import { useState, useEffect } from "react";
import { C } from "./constants";
import { useBreakpoint } from "./hooks/useBreakpoint";
import Dashboard from "./components/dashboard/Dashboard";
import Reports from "./components/reports/Reports";
import DSS from "./components/dss/DSS";
import Prediction from "./components/prediction/Prediction";
import OCR from "./components/ocr/OCR";
import Invoices from "./components/invoices/Invoices";
import Settings from "./components/settings/Settings";
import UserManagement from "./components/users/UserManagement";
import AuditLogs from "./components/audit/AuditLogs";
import Background3D from "./components/common/Background3D";
import LandingPage from "./components/LandingPage";
import { motion, AnimatePresence } from "motion/react";
import { FirebaseProvider, useAuth } from "./hooks/useAuth";
import ErrorBoundary from "./components/common/ErrorBoundary";

const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "reports", label: "Reports", icon: "📈" },
  { key: "dss", label: "DSS", icon: "🧠" },
  { key: "prediction", label: "Simulation", icon: "🔮" },
  { key: "ocr", label: "OCR", icon: "📄" },
  { key: "invoices", label: "Invoices", icon: "🧾" },
];

const SYSTEM_MODULES = [
  { key: "settings", label: "Settings", icon: "⚙️" },
  { key: "users", label: "User Management", icon: "🛡️" },
  { key: "audit", label: "Audit Logs", icon: "📋" },
];

function AppContent() {
  const { user, profile, loading, login, logout } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => { setDrawerOpen(false); }, [active]);
  useEffect(() => {
    if (isMobile || isTablet) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile, isTablet]);

  if (loading) {
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

  if (showLanding && !user) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Background3D />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="brutal-card max-w-md w-full z-10 text-center"
        >
          <div className="w-16 h-16 bg-ink text-white flex items-center justify-center font-black text-3xl mx-auto mb-8 border-2 border-neon shadow-[4px_4px_0px_#FF6B35]">
            V
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tighter italic">VYAPARI</h2>
          <p className="text-ink/60 mb-8 font-black text-[10px] uppercase tracking-widest">ADVANCED RETAIL INTELLIGENCE SYSTEM</p>
          <button 
            onClick={login}
            className="brutal-btn w-full flex items-center justify-center gap-3"
          >
            <span>SIGN IN WITH GOOGLE</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const renderModule = () => {
    switch (active) {
      case "dashboard": return <Dashboard />;
      case "reports":   return <Reports />;
      case "dss":       return <DSS />;
      case "prediction":return <Prediction />;
      case "ocr":       return <OCR />;
      case "invoices":  return <Invoices />;
      case "settings":  return <Settings />;
      case "users":     return <UserManagement />;
      case "audit":     return <AuditLogs />;
      default:          return <Dashboard />;
    }
  };

  const moduleTitles: Record<string, string> = {
    dashboard: "Analytics Dashboard", reports: "Reports Engine",
    dss: "Decision Support System", prediction: "Predictive Simulation",
    ocr: "Intelligent OCR", invoices: "Invoice Management",
    settings: "Settings", users: "User Management", audit: "Audit Logs",
  };

  const NavItem = ({ m, small = false }: any) => (
    <motion.div 
      key={m.key}
      onClick={() => { setActive(m.key); if (isMobile) setDrawerOpen(false); }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-4 px-6 py-3 cursor-pointer transition-all duration-200 border-l-4
        ${active === m.key 
          ? "bg-ink text-white border-neon" 
          : "text-ink/60 border-transparent hover:bg-ink/5 hover:text-ink"}
      `}
    >
      <span className={`${small ? 'text-lg' : 'text-xl'} flex-shrink-0`}>{m.icon}</span>
      {(sidebarOpen || drawerOpen) && (
        <span className={`font-bold uppercase tracking-tight ${small ? 'text-xs' : 'text-sm'}`}>
          {m.label}
        </span>
      )}
    </motion.div>
  );

  const SidebarContent = ({ inDrawer = false }: any) => (
    <div className="flex flex-col h-full py-6">
      {!inDrawer && sidebarOpen && (
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink text-white flex items-center justify-center font-black text-xl border border-neon">V</div>
            <span className="font-black text-xl tracking-tighter italic">VYAPARI</span>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 mb-4 text-[10px] font-black text-ink/30 uppercase tracking-[0.2em]">
          {(sidebarOpen || inDrawer) ? "Operations" : ""}
        </div>
        {MODULES.map(m => <NavItem key={m.key} m={m} />)}
        
        <div className="mt-8 pt-8 border-t border-ink/10">
          <div className="px-6 mb-4 text-[10px] font-black text-ink/30 uppercase tracking-[0.2em]">
            {(sidebarOpen || inDrawer) ? "System" : ""}
          </div>
          {SYSTEM_MODULES.map(m => <NavItem key={m.key} m={m} small />)}
        </div>
      </div>
      
      <div className="px-6 mt-auto">
        <button 
          onClick={logout}
          className="w-full py-3 border border-ink font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="h-16 bg-white border-b border-ink flex items-center px-4 sm:px-6 sticky top-0 z-[200] gap-2 sm:gap-4">
        <button
          onClick={() => isMobile ? setDrawerOpen(o => !o) : setSidebarOpen(o => !o)}
          className="text-2xl hover:text-neon transition-colors flex-shrink-0"
        >
          {sidebarOpen ? "◂" : "▸"}
        </button>

        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="text-[8px] sm:text-xs font-black bg-neon text-white px-2 py-0.5 uppercase tracking-widest flex-shrink-0">Live</div>
          <h1 className="text-xs sm:text-sm font-black tracking-widest truncate">
            {moduleTitles[active]}
          </h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <button className="text-lg sm:text-xl relative hover:scale-110 transition-transform">
            🔔
            <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-neon text-white text-[7px] sm:text-[9px] font-black rounded-full flex items-center justify-center">3</span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-6 border-l border-ink/10">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black uppercase leading-none truncate max-w-[80px] md:max-w-[120px]">{user.displayName}</div>
              <div className="text-[8px] text-ink/40 font-bold uppercase tracking-tighter">{profile?.role || 'Admin'}</div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 border border-ink overflow-hidden shadow-[2px_2px_0px_var(--color-ink)] flex-shrink-0">
              {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-ink text-white flex items-center justify-center font-black text-xs">{user.displayName?.charAt(0)}</div>}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        {!isMobile && (
          <motion.aside 
            animate={{ width: sidebarOpen ? 260 : 80 }}
            className="bg-white border-r border-ink sticky top-16 h-[calc(100vh-64px)] overflow-hidden flex-shrink-0"
          >
            <SidebarContent />
          </motion.aside>
        )}

        {/* Drawer for Mobile */}
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
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-[400] border-r-2 border-ink"
              >
                <SidebarContent inDrawer />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 min-w-0 relative">
          <div className="max-w-7xl mx-auto">
            <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-ink pb-6 gap-4">
              <div>
                <div className="text-[8px] sm:text-[10px] font-black text-neon uppercase tracking-[0.3em] mb-2">System.Module / {active}</div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none">{moduleTitles[active]}</h2>
              </div>
              <div className="text-left sm:text-right font-mono text-[8px] sm:text-[10px] text-ink/30 uppercase">
                Terminal_ID: V-BI-092<br />
                Status: Operational_Stable
              </div>
            </header>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "circOut" }}
              >
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
