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
import VANI from "./components/VANI/VANI";
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

  const handleVoiceCommand = (cmd: string) => {
    if (cmd.includes("dashboard") || cmd.includes("home")) setActive("dashboard");
    if (cmd.includes("report")) setActive("reports");
    if (cmd.includes("brain") || cmd.includes("dss")) setActive("dss");
    if (cmd.includes("predict") || cmd.includes("simulate")) setActive("prediction");
    if (cmd.includes("scan") || cmd.includes("ocr")) setActive("ocr");
    if (cmd.includes("invoice") || cmd.includes("bill")) setActive("invoices");
    if (cmd.includes("setting")) setActive("settings");
    if (cmd.includes("user")) setActive("users");
    if (cmd.includes("audit") || cmd.includes("history")) setActive("audit");
    
    // Action commands
    if (cmd.includes("logout") || cmd.includes("sign out")) logout();
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
    <div className="flex flex-col h-full py-8">
      {!inDrawer && sidebarOpen && (
        <div className="px-8 mb-12">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 bg-ink text-white flex items-center justify-center font-black text-2xl border-2 border-neon shadow-[4px_4px_0px_var(--color-neon)]">V</div>
            <span className="font-black text-3xl tracking-tighter italic">VYAPARI</span>
          </motion.div>
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
      
      <div className="px-8 mt-auto">
        <button 
          onClick={logout}
          className="w-full py-4 border-2 border-ink font-black text-xs uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_var(--color-ink)] active:shadow-none active:translate-x-1 active:translate-y-1"
        >
          Logout_System
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col selection:bg-neon selection:text-ink">
      {/* Top Nav */}
      <header className="h-20 bg-white/80 backdrop-blur-xl border-b-4 border-ink flex items-center px-6 sm:px-10 sticky top-0 z-[200] gap-4 sm:gap-8 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => isMobile ? setDrawerOpen(o => !o) : setSidebarOpen(o => !o)}
          className="w-10 h-10 border-2 border-ink flex items-center justify-center text-xl hover:bg-neon transition-colors flex-shrink-0 shadow-[2px_2px_0px_var(--color-ink)]"
        >
          {sidebarOpen ? "×" : "☰"}
        </motion.button>

        <div className="flex items-center gap-4 min-w-0">
          <div className="neon-badge">Live_Sync</div>
          <h1 className="text-sm sm:text-lg font-black tracking-[0.1em] truncate italic">
            {moduleTitles[active]}
          </h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
          <motion.button 
            whileHover={{ scale: 1.2, rotate: 15 }}
            className="text-xl relative"
          >
            🔔
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-neon text-white text-[10px] font-black border-2 border-ink flex items-center justify-center">3</span>
          </motion.button>
          
          <div className="flex items-center gap-4 pl-4 sm:pl-8 border-l-2 border-ink/10">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-black uppercase leading-none truncate max-w-[150px]">{user.displayName}</div>
              <div className="text-[9px] text-neon font-black uppercase tracking-widest mt-1">{profile?.role || 'System Admin'}</div>
            </div>
            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-ink overflow-hidden shadow-[4px_4px_0px_var(--color-ink)] flex-shrink-0 bg-white"
            >
              {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-ink text-white flex items-center justify-center font-black text-sm">{user.displayName?.charAt(0)}</div>}
            </motion.div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        {!isMobile && (
          <motion.aside 
            animate={{ width: sidebarOpen ? 300 : 100 }}
            className="bg-white border-r-4 border-ink sticky top-20 h-[calc(100vh-80px)] overflow-hidden flex-shrink-0 z-[100]"
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
                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
        onCommand={handleVoiceCommand} 
      />
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
