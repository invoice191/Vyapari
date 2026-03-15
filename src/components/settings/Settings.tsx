import { useState } from "react";
import { C } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, OrangeBtn, Badge, SectionHeader } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";

export default function Settings() {
  const bp = useBreakpoint();
  const [settingsTab, setSettingsTab] = useState("General");
  const [saved, setSaved] = useState(false);
  const [toggles, setToggles] = useState<any>({
    emailAlerts: true, smsAlerts: false, pushNotif: true,
    lowStock: true, salesDrop: true, newUser: false,
    twoFactor: true, sessionTimeout: true, ipWhitelist: false,
    autoBackup: true, dataExport: true, gdprMode: false,
    darkMode: false, compactView: false, animations: true,
  });

  const toggle = (key: string) => setToggles((p: any) => ({ ...p, [key]: !p[key] }));

  const ToggleSwitch = ({ keyName, label, desc }: any) => (
    <div className="flex justify-between items-center py-6 border-b-2 border-ink/5 last:border-0 group">
      <div>
        <div className="text-sm font-black text-ink uppercase tracking-tight">{label}</div>
        {desc && <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-1">{desc}</div>}
      </div>
      <motion.div
        onClick={() => toggle(keyName)}
        whileTap={{ scale: 0.9 }}
        className={`w-14 h-8 border-4 border-ink cursor-pointer flex items-center p-1 transition-colors ${
          toggles[keyName] ? 'bg-neon' : 'bg-ink/10'
        }`}
      >
        <motion.div 
          animate={{ x: toggles[keyName] ? 24 : 0 }}
          className="w-4 h-4 bg-ink shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
        />
      </motion.div>
    </div>
  );

  const InputField = ({ label, defaultValue, type = "text" }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-ink/40 uppercase tracking-widest block">{label}</label>
      <input 
        type={type} 
        defaultValue={defaultValue} 
        className="w-full bg-ink/5 border-2 border-ink p-3 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10 transition-colors"
      />
    </div>
  );

  const tabs = [
    { key: "General", icon: "🏪" },
    { key: "Notifications", icon: "🔔" },
    { key: "Security", icon: "🔐" },
    { key: "Integrations", icon: "🔗" },
    { key: "Appearance", icon: "🎨" },
    { key: "Billing", icon: "💳" },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-24 right-8 bg-neon border-4 border-ink p-4 font-black text-xs uppercase tracking-widest z-[1000] shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          >
            ✅ SETTINGS_SYNC_SUCCESSFUL
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <div className="brutal-card bg-white p-4 space-y-2 lg:h-fit">
          <div className="text-[10px] font-black text-ink/40 uppercase tracking-[0.3em] mb-4 px-2">SYSTEM_MODULES</div>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {tabs.map(t => (
              <button 
                key={t.key} 
                onClick={() => setSettingsTab(t.key)}
                className={`flex items-center gap-4 px-4 py-3 font-black text-xs uppercase tracking-widest transition-all ${
                  settingsTab === t.key 
                    ? 'bg-ink text-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]' 
                    : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="whitespace-nowrap">{t.key}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={settingsTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {settingsTab === "General" && (
                <div className="brutal-card bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-4 border-ink pb-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight uppercase leading-none italic">Business_Information</h2>
                      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-2">Manage core operational parameters</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label="Business Name" defaultValue="Vyapari Superstore" />
                    <InputField label="GST Number" defaultValue="27AAGCT1234P1Z5" />
                    <InputField label="Business Email" defaultValue="admin@vyapari.in" type="email" />
                    <InputField label="Phone Number" defaultValue="+91 98765 43210" />
                  </div>
                </div>
              )}

              {settingsTab === "Notifications" && (
                <div className="brutal-card bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-4 border-ink pb-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight uppercase leading-none italic">Notification_Matrix</h2>
                      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-2">Configure communication protocols</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <ToggleSwitch keyName="emailAlerts" label="Email Alerts" desc="Receive alerts at admin@vyapari.in" />
                    <ToggleSwitch keyName="smsAlerts" label="SMS Alerts" desc="Receive SMS on +91 98765 43210" />
                    <ToggleSwitch keyName="pushNotif" label="Push Notifications" desc="Browser & mobile app push notifications" />
                  </div>
                </div>
              )}

              {settingsTab !== "General" && settingsTab !== "Notifications" && (
                <div className="brutal-card bg-white min-h-[400px] flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-6 opacity-20 grayscale">🚧</div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">{settingsTab}_MODULE_OFFLINE</h2>
                  <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-4">Development in progress. Deployment scheduled for Q3.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-end gap-4">
            <button className="brutal-btn bg-white text-ink px-8 py-3 text-[10px] font-black uppercase tracking-widest">
              DISCARD_CHANGES
            </button>
            <button 
              onClick={handleSave}
              className="brutal-btn bg-neon text-ink px-8 py-3 text-[10px] font-black uppercase tracking-widest"
            >
              COMMIT_CHANGES
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
