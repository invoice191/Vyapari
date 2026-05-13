import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, CreditCard, Bell, Palette, Mic, Database, 
  Shield, Key, AlertTriangle, Save, RotateCcw, 
  CheckCircle2, Wifi, WifiOff, Layout, Smartphone, Search
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDataRefresh } from '../../../context/DataProvider';
import { useToast } from '../../common/Toast';

// Panel Imports
import { ProfileSettings } from './panels/ProfileSettings';
import { BillingSettings } from './panels/BillingSettings';
import { NotificationSettings } from './panels/NotificationSettings';
import { AppearanceSettings } from './panels/AppearanceSettings';
import { VANISettings } from './panels/VANISettings';
import { DataSyncSettings } from './panels/DataSyncSettings';
import { SecuritySettings } from './panels/SecuritySettings';
import { APISettings } from './panels/APISettings';
import { DangerZone } from './panels/DangerZone';

type PanelID = 'Profile' | 'Billing' | 'Notifications' | 'Appearance' | 'VANI' | 'DataSync' | 'Security' | 'API' | 'Danger';

interface NavGroup {
  label: string;
  items: { id: PanelID; label: string; icon: any }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Account',
    items: [
      { id: 'Profile', label: 'Business Profile', icon: Building2 },
      { id: 'Billing', label: 'Billing & Plan', icon: CreditCard },
      { id: 'Notifications', label: 'Notifications', icon: Bell },
    ]
  },
  {
    label: 'Platform',
    items: [
      { id: 'Appearance', label: 'Appearance', icon: Palette },
      { id: 'VANI', label: 'VANI / Voice', icon: Mic },
      { id: 'DataSync', label: 'Data & Sync', icon: Database },
    ]
  },
  {
    label: 'Security',
    items: [
      { id: 'Security', label: 'Security & Auth', icon: Shield },
      { id: 'API', label: 'API Keys', icon: Key },
      { id: 'Danger', label: 'Danger Zone', icon: AlertTriangle },
    ]
  }
];

export default function Settings() {
  const { business, loading, updateBusiness } = useAuth();
  const { lastUpdate } = useDataRefresh();
  const { toast: showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activePanel, setActivePanel] = useState<PanelID>('Profile');
  const [localBusiness, setLocalBusiness] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredNavGroups = useMemo(() => {
    if (!searchQuery) return navGroups;
    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => group.items.length > 0);
  }, [searchQuery]);

  // Initialize local state
  useEffect(() => {
    if (business && !localBusiness) {
      setLocalBusiness({ ...business });
    }
  }, [business]);

  const handleUpdateLocal = (key: string, val: any) => {
    setLocalBusiness((prev: any) => ({ ...prev, [key]: val }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!localBusiness) return;
    setSaving(true);
    try {
      await updateBusiness(localBusiness);
      setIsDirty(false);
      showToast('NEURAL CONFIGURATION SYNCHRONIZED', 'success');
    } catch (err) {
      showToast('SYNCHRONIZATION FAILURE', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setLocalBusiness({ ...business });
    setIsDirty(false);
  };

  if (loading || !localBusiness) return (
    <div className="flex items-center justify-center h-full bg-[#0F172A]">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full"
      />
    </div>
  );

  return (
    <div className="flex h-full bg-[#0F172A] font-sans text-slate-300 overflow-hidden relative">
      {/* Sidebar */}
      <aside className="w-[280px] border-r border-white/5 bg-black/20 flex flex-col pt-12 pb-8">
        <div className="px-8 mb-8">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase font-display italic">Neural<span className="text-neon">_Vault</span></h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">System v4.0 Active</span>
          </div>
        </div>

        {/* Settings Search */}
        <div className="px-6 mb-8">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-neon transition-colors" />
            <input 
              type="text" 
              placeholder="Find a setting..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest text-white outline-none focus:border-neon focus:ring-4 focus:ring-neon/5 transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-10 overflow-y-auto custom-scrollbar">
          {filteredNavGroups.map(group => (
            <div key={group.label} className="space-y-4">
              <div className="px-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">{group.label}</div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActivePanel(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative ${
                      activePanel === item.id 
                        ? 'bg-brand/10 text-white shadow-lg shadow-brand/5' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                    }`}
                  >
                    <item.icon size={18} className={activePanel === item.id ? 'text-neon' : 'group-hover:text-slate-300'} />
                    <span className="text-[11px] font-bold uppercase tracking-tight">{item.label}</span>
                    {activePanel === item.id && (
                      <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-neon rounded-r-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredNavGroups.length === 0 && (
            <div className="px-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">No matches found</div>
          )}
        </nav>

        <div className="px-8 mt-auto pt-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black text-slate-500 uppercase">Sync Status</span>
            {lastUpdate ? <Wifi size={12} className="text-neon" /> : <WifiOff size={12} className="text-red-500" />}
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="text-[9px] font-black text-white uppercase tracking-widest mb-1">Last Update</div>
            <div className="font-mono text-[10px] text-slate-500">
              {lastUpdate && Object.keys(lastUpdate).length > 0 
                ? new Date(Math.max(...Object.values(lastUpdate) as number[])).toLocaleTimeString() 
                : 'SYNCHRONIZING...'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-20 border-b border-white/5 px-12 flex items-center justify-between bg-black/10 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Module / Settings /</div>
            <div className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{activePanel}</div>
          </div>

          <AnimatePresence>
            {isDirty && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-4"
              >
                <button 
                  onClick={handleDiscard}
                  className="px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2"
                >
                  <RotateCcw size={12} />
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-2 bg-brand text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neon hover:text-slate-900 transition-all flex items-center gap-3 shadow-xl shadow-brand/20 disabled:opacity-50"
                >
                  {saving ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full" />
                  ) : (
                    <Save size={12} />
                  )}
                  Save Configuration
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-12 scrollbar-thin scrollbar-thumb-white/10">
          <div className="max-w-4xl mx-auto pb-24">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {activePanel === 'Profile' && <ProfileSettings data={localBusiness} onChange={handleUpdateLocal} />}
              {activePanel === 'Billing' && <BillingSettings plan={localBusiness.plan || 'Free'} />}
              {activePanel === 'Notifications' && <NotificationSettings data={localBusiness} onChange={handleUpdateLocal} />}
              {activePanel === 'Appearance' && <AppearanceSettings data={localBusiness} onChange={handleUpdateLocal} />}
              {activePanel === 'VANI' && <VANISettings data={localBusiness} onChange={handleUpdateLocal} />}
              {activePanel === 'DataSync' && <DataSyncSettings data={localBusiness} onChange={handleUpdateLocal} />}
              {activePanel === 'Security' && <SecuritySettings data={localBusiness} onChange={handleUpdateLocal} />}
              {activePanel === 'API' && <APISettings data={localBusiness} onChange={handleUpdateLocal} />}
              {activePanel === 'Danger' && <DangerZone />}
            </motion.div>
          </div>
        </div>
      </main>



      {/* Decorative Gradient Blurs */}
      <div className="absolute -top-64 -right-64 w-[600px] h-[600px] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-neon/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
