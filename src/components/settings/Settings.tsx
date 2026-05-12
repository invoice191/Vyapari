import { useState, useEffect } from "react";
import { C } from "../../lib/constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, SectionHeader, Badge, ActionBtn, KPICard } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Building2, Bell, Shield, Share2, Palette, CreditCard, 
  Settings2, Save, RotateCcw, CheckCircle2, AlertTriangle, 
  Mail, MessageSquare, BellRing, Smartphone, TrendingDown, 
  Lock, Key, Globe, Eye, Zap, Layers, FileText, Download,
  CloudLightning, ExternalLink, Cpu, MapPin
} from "lucide-react";
import { PinModal } from "../common/PinModal";
import { auditService } from "../../services/auditService";
import { smsService } from "../../services/smsService";
import { useToast } from "../../components/common/Toast";
import AutomationRules from "./AutomationRules";
import TelegramSettings from "./TelegramSettings";


const FACTORY_DEFAULTS = {
  notifications: true,
  email_alerts: true,
  whatsapp_updates: true,
  vani_voice: true,
  biometric_lock: false,
  auto_backup: true,
  dark_mode: true,
  compact_view: false,
  multi_currency: false,
  tax_mode: 'GST',
  language: 'en',
  businessName: "Vyapari Superstore",
  gstNumber: "27AAGCT1234P1Z5",
  businessEmail: "admin@vyapari.in",
  phoneNumber: "+91 98765 43210"
};

export default function Settings() {
  const { toast } = useToast();
  const bp = useBreakpoint();
  const { business, profile } = useAuth();
  const [settingsTab, setSettingsTab] = useState("General");
  const [saved, setSaved] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Core settings state
  const [bizInfo, setBizInfo] = useState({
    name: FACTORY_DEFAULTS.businessName,
    gst: FACTORY_DEFAULTS.gstNumber,
    email: FACTORY_DEFAULTS.businessEmail,
    phone: FACTORY_DEFAULTS.phoneNumber,
    invoice_prefix: "INV",
    logo_url: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  const [toggles, setToggles] = useState<any>({
    email_alerts: FACTORY_DEFAULTS.email_alerts,
    sms_alerts: FACTORY_DEFAULTS.whatsapp_updates,
    push_notif: FACTORY_DEFAULTS.notifications,
    low_stock: true,
    sales_drop: true,
    new_user: true,
    two_factor: false,
    session_timeout: '1h',
    ip_whitelist: '',
    auto_backup: FACTORY_DEFAULTS.auto_backup,
    data_export: true,
    gdpr_mode: false,
    dark_mode: FACTORY_DEFAULTS.dark_mode,
    compact_view: FACTORY_DEFAULTS.compact_view,
    animations: true,
    theme: 'Modern Executive'
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  const [apiKeys, setApiKeys] = useState<any>({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioFromPhone: "",
    twilioMessagingSid: "",
    stripePublishableKey: "",
    stripeSecretKey: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    upiId: ""
  });

  // Load settings from business metadata if available
  useEffect(() => {
    if (business) {
      setToggles((prev: any) => ({
        ...prev,
        ...business.settings
      }));
      setApiKeys({
        twilioAccountSid: business.settings?.twilioAccountSid || "",
        twilioAuthToken: business.settings?.twilioAuthToken || "",
        twilioFromPhone: business.settings?.twilioFromPhone || "",
        twilioMessagingSid: business.settings?.twilioMessagingSid || "",
        stripePublishableKey: business.settings?.stripePublishableKey || "",
        stripeSecretKey: business.settings?.stripeSecretKey || "",
        razorpayKeyId: business.settings?.razorpayKeyId || "",
        razorpayKeySecret: business.settings?.razorpayKeySecret || "",
        upiId: business.settings?.upiId || ""
      });
      setBizInfo({
        name: business.name || FACTORY_DEFAULTS.businessName,
        gst: business.gstin || FACTORY_DEFAULTS.gstNumber,
        email: business.email || FACTORY_DEFAULTS.businessEmail,
        phone: business.phone || FACTORY_DEFAULTS.phoneNumber,
        invoice_prefix: business.invoice_prefix || "INV",
        logo_url: business.logo_url || "",
        address: business.address || "",
        city: business.city || "",
        state: business.state || "",
        pincode: business.pincode || ""
      });
    }
  }, [business]);

  const validateGST = (gst: string) => {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gst);
  };

  const handleSaveAttempt = () => {
    // 1. Validate GST
    if (bizInfo.gst && !validateGST(bizInfo.gst)) {
      toast("Invalid GST format. Must be 15-character alphanumeric.", "error");
      return;
    }

    // 2. Prepare data
    const dataToSave = {
      name: bizInfo.name,
      gstin: bizInfo.gst,
      email: bizInfo.email,
      phone: bizInfo.phone,
      invoice_prefix: bizInfo.invoice_prefix,
      logo_url: bizInfo.logo_url,
      address: bizInfo.address,
      city: bizInfo.city,
      state: bizInfo.state,
      pincode: bizInfo.pincode,
      settings: { ...business.settings, ...toggles, ...apiKeys }
    };

    setPendingSaveData(dataToSave);
    setShowPinModal(true);
  };

  const handleSaveConfirmed = async (pin: string) => {
    // In a real app, verify the PIN against the business table
    if (business?.owner_pin && pin !== business.owner_pin) {
      toast("Incorrect Owner PIN.", "error");
      return;
    }

    try {
      if (business?.id && pendingSaveData) {
        // Check for duplicate prefix (hypothetical logic for this module)
        if (pendingSaveData.invoice_prefix !== business.invoice_prefix) {
          const { data: duplicate } = await supabase
            .from('businesses')
            .select('id')
            .eq('invoice_prefix', pendingSaveData.invoice_prefix)
            .neq('id', business.id)
            .single();
          
          if (duplicate) {
            toast("This invoice prefix is already in use by another series.", "warning");
            return;
          }
        }

        const { error } = await supabase
          .from('businesses')
          .update(pendingSaveData)
          .eq('id', business.id);

        if (error) throw error;

        await auditService.logAction({
          business_id: business.id,
          user_id: profile?.id || 'unknown',
          action: 'SETTINGS_UPDATED',
          module: 'Settings',
          metadata: { 
            before: { name: business.name, gstin: business.gstin, prefix: business.invoice_prefix },
            after: pendingSaveData
          }
        });
      }
      setSaved(true);
      setShowPinModal(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Save settings error:", e);
    }
  };

  const toggle = (key: string) => setToggles((p: any) => ({ ...p, [key]: !p[key] }));

  const [testLoading, setTestLoading] = useState(false);
  const handleTestMessage = async () => {
    if (!bizInfo.phone) {
      toast("Please set a business phone number first.", "warning");
      return;
    }
    setTestLoading(true);
    try {
      await smsService.sendMessage({
        phone: bizInfo.phone,
        message: `Vyapari Enterprise Alert: This is a diagnostic test of your messaging pipeline. If you are reading this, your system is production-ready! 🚀`,
        type: 'sms'
      });
      toast("Test signal dispatched successfully.", "success");
    } catch (err) {
      toast("Message dispatch failed. Check Twilio logs.", "error");
      console.error(err);
    } finally {
      setTestLoading(false);
    }
  };

  const ToggleSwitch = ({ keyName, label, desc, icon: Icon }: any) => (
    <div className="flex justify-between items-center py-8 border-b border-slate-100 last:border-0 group">
      <div className="flex gap-4">
        {Icon && <div className="mt-1 text-slate-400 group-hover:text-neon transition-colors"><Icon size={18} /></div>}
        <div>
          <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{label}</div>
          {desc && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{desc}</div>}
        </div>
      </div>
      <motion.div
        onClick={() => toggle(keyName)}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-7 rounded-full cursor-pointer flex items-center p-1 transition-all duration-500 ${
          toggles[keyName] ? 'bg-neon shadow-lg shadow-neon/30' : 'bg-slate-200'
        }`}
      >
        <motion.div 
          animate={{ x: toggles[keyName] ? 28 : 0 }}
          className="w-5 h-5 bg-white rounded-full shadow-md"
        />
      </motion.div>
    </div>
  );

  const InputField = ({ label, value, onChange, type = "text", icon: Icon }: any) => (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block pl-1">{label}</label>
      <div className="relative group">
        {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors"><Icon size={16} /></div>}
        <input 
          type={type} 
          value={value} 
          onChange={onChange}
          className={`w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 ${Icon ? 'pl-12' : ''} font-bold text-sm outline-none focus:border-neon focus:ring-4 focus:ring-neon/10 transition-all`}
        />
      </div>
    </div>
  );

  const tabs = [
    { key: "General", label: "Core Profile", icon: <Building2 size={18}/> },
    { key: "Notifications", label: "Signal Matrix", icon: <Bell size={18}/> },
    { key: "Security", label: "Vault Security", icon: <Shield size={18}/> },
    { key: "Integrations", label: "Neural Links", icon: <Share2 size={18}/> },
    { key: "Appearance", label: "Visual Engine", icon: <Palette size={18}/> },
    { key: "Billing", label: "Ledger Plan", icon: <CreditCard size={18}/> },
    { key: "Automation", label: "RPA Engine", icon: <Cpu size={18}/> },
  ];

  const handleReset = () => {
    if (!confirm("Are you sure you want to restore all settings to factory defaults?")) return;

    setBizInfo({
      name: FACTORY_DEFAULTS.businessName,
      gst: FACTORY_DEFAULTS.gstNumber,
      email: FACTORY_DEFAULTS.businessEmail,
      phone: FACTORY_DEFAULTS.phoneNumber,
      invoice_prefix: "INV",
      logo_url: "",
      address: "",
      city: "",
      state: "",
      pincode: ""
    });

    setToggles({
      email_alerts: FACTORY_DEFAULTS.email_alerts,
      sms_alerts: FACTORY_DEFAULTS.whatsapp_updates,
      push_notif: FACTORY_DEFAULTS.notifications,
      low_stock: true,
      sales_drop: true,
      new_user: true,
      two_factor: false,
      session_timeout: '1h',
      ip_whitelist: '',
      auto_backup: FACTORY_DEFAULTS.auto_backup,
      data_export: true,
      gdpr_mode: false,
      dark_mode: FACTORY_DEFAULTS.dark_mode,
      compact_view: FACTORY_DEFAULTS.compact_view,
      animations: true,
      theme: 'Modern Executive'
    });

    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const [integrations, setIntegrations] = useState<any>({
    QuickBooks: { connected: true, loading: false },
    Stripe: { connected: false, loading: false },
    Tally: { connected: false, loading: false }
  });

  const handleToggleIntegration = async (name: string) => {
    setIntegrations((prev: any) => ({
      ...prev,
      [name]: { ...prev[name], loading: true }
    }));

    await new Promise(resolve => setTimeout(resolve, 1500));

    const wasConnected = integrations[name].connected;
    setIntegrations((prev: any) => ({
      ...prev,
      [name]: { connected: !wasConnected, loading: false }
    }));

    await supabase.from('audit_logs').insert({
      action: wasConnected ? `INTEGRATION_DISCONNECTED` : `INTEGRATION_CONNECTED`,
      module: 'Settings',
      metadata: { service: name },
      severity: 'Warning',
      user_email: profile?.email || 'System'
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32">
      <AnimatePresence>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-12 right-12 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] z-[1000] shadow-2xl flex items-center gap-4"
          >
            <CheckCircle2 className="text-neon" size={20} />
            SETTINGS_SYNC_SUCCESSFUL
          </motion.div>
        )}
        {resetSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-12 right-12 bg-red-600 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] z-[1000] shadow-2xl flex items-center gap-4"
          >
            <RotateCcw size={20} />
            FACTORY_REVERT_COMPLETE
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 text-white p-14 rounded-[3rem] mb-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon/10 rounded-full blur-[120px] translate-x-1/2 translate-y-[-1/2]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-neon">
                <Settings2 size={24} />
             </div>
             <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-black text-[9px] uppercase tracking-[0.4em]">
                System Configuration
             </div>
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">Enterprise <br/>Control <span className="text-neon italic">Center</span></h1>
          <p className="text-slate-400 mt-8 text-lg max-w-2xl font-bold leading-relaxed opacity-80">
            Customize your enterprise environment, security protocols, and visual telemetry to align with your operational workflow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12">
        <div className="flex flex-col gap-3">
          {tabs.map(t => (
            <motion.button 
              key={t.key} 
              onClick={() => setSettingsTab(t.key)}
              whileHover={{ x: 8 }}
              className={`flex items-center gap-5 px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all duration-500 ${
                settingsTab === t.key 
                  ? 'bg-neon text-white shadow-xl shadow-neon/30 scale-[1.02]' 
                  : 'bg-white/40 text-slate-400 border border-slate-100 hover:border-neon/30 hover:text-slate-900'
              }`}
            >
              <span className={settingsTab === t.key ? 'text-white' : 'text-slate-300'}>{t.icon}</span>
              <span className="whitespace-nowrap">{t.label}</span>
            </motion.button>
          ))}

          <div className="mt-12 brutal-card !p-8 bg-slate-900 text-white">
             <div className="flex items-center gap-3 mb-6">
                <CloudLightning className="text-neon" size={16} />
                <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400">Environment Status</h3>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Core Latency</span>
                   <span className="text-[10px] font-black text-neon">12ms</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Neural Sync</span>
                   <span className="text-[10px] font-black text-neon uppercase">Active</span>
                </div>
                <div className="pt-4 border-t border-white/5">
                   <ActionBtn className="w-full text-[9px]">Run Diagnostics</ActionBtn>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={settingsTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {settingsTab === "General" && (
                <div className="space-y-12">
                  <div className="glass-card !p-12">
                    <SectionHeader title="Business Branding" subtitle="Manage your enterprise visual identity and logo" />
                    <div className="flex flex-col md:flex-row items-center gap-12 mt-12">
                      <div className="w-40 h-40 rounded-[3rem] bg-slate-50 border-4 border-slate-100 flex items-center justify-center relative group overflow-hidden shadow-inner">
                        {bizInfo.logo_url ? (
                          <img src={bizInfo.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="text-slate-200" size={48} />
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                           <span className="text-[10px] font-black text-neon uppercase tracking-widest">Update Logo</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-6 w-full">
                        <InputField 
                          label="Enterprise Logo URL" 
                          value={bizInfo.logo_url} 
                          onChange={(e: any) => setBizInfo({ ...bizInfo, logo_url: e.target.value })} 
                          placeholder="https://..."
                          icon={Globe} 
                        />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                          Synchronize your brand across all invoices and internal dashboards. Recommended: 512x512px PNG or SVG.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card !p-12">
                    <SectionHeader title="Corporate Identity" subtitle="Manage your legal entity credentials and tax identification" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
                      <InputField label="Legal Business Name" value={bizInfo.name} onChange={(e: any) => setBizInfo({ ...bizInfo, name: e.target.value })} icon={Building2} />
                      <InputField label="Tax Identification (GST)" value={bizInfo.gst} onChange={(e: any) => setBizInfo({ ...bizInfo, gst: e.target.value })} icon={FileText} />
                      <InputField label="Administrative Email" value={bizInfo.email} onChange={(e: any) => setBizInfo({ ...bizInfo, email: e.target.value })} type="email" icon={Mail} />
                      <InputField label="Operational Contact" value={bizInfo.phone} onChange={(e: any) => setBizInfo({ ...bizInfo, phone: e.target.value })} icon={Smartphone} />
                    </div>
                  </div>

                  <div className="glass-card !p-12">
                    <SectionHeader title="Neural Coordinates" subtitle="Configure operational headquarters and location data" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
                      <div className="md:col-span-2">
                        <InputField label="Headquarters Address" value={bizInfo.address} onChange={(e: any) => setBizInfo({ ...bizInfo, address: e.target.value })} icon={MapPin} />
                      </div>
                      <InputField label="City" value={bizInfo.city} onChange={(e: any) => setBizInfo({ ...bizInfo, city: e.target.value })} />
                      <div className="grid grid-cols-2 gap-6">
                        <InputField label="State" value={bizInfo.state} onChange={(e: any) => setBizInfo({ ...bizInfo, state: e.target.value })} />
                        <InputField label="Pincode" value={bizInfo.pincode} onChange={(e: any) => setBizInfo({ ...bizInfo, pincode: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card !p-12">
                    <SectionHeader title="Operational Nomemclature" subtitle="Configure document series and automated prefixes" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
                      <InputField label="Invoice Series Prefix" value={bizInfo.invoice_prefix} onChange={(e: any) => setBizInfo({ ...bizInfo, invoice_prefix: e.target.value.toUpperCase() })} icon={FileText} />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "Notifications" && (
                <div className="space-y-12">
                  <div className="glass-card !p-12">
                    <SectionHeader title="Communication Protocols" subtitle="Configure automated alert and telemetry signals" />
                    <div className="space-y-2 mt-8">
                      <ToggleSwitch keyName="email_alerts" label="Email Telemetry" desc="High-priority reports delivered to administrative inbox" icon={Mail} />
                      <ToggleSwitch keyName="sms_alerts" label="Direct SMS Channel" desc="Real-time critical events pushed to registered devices" icon={MessageSquare} />
                      <ToggleSwitch keyName="push_notif" label="Neural Push Signals" desc="Browser-level interactive event notifications" icon={BellRing} />
                      <ToggleSwitch keyName="low_stock" label="Stock Threshold Monitor" desc="Automated alerts for inventory depletion events" icon={AlertTriangle} />
                      <ToggleSwitch keyName="sales_drop" label="Velocity Drop Analysis" desc="AI-driven signals for negative revenue variance" icon={TrendingDown} />
                      
                      {toggles.sms_alerts && (
                        <div className="pt-8 mt-8 border-t border-slate-100 space-y-6">
                          <div className="flex items-center gap-3 mb-2">
                            <Smartphone size={16} className="text-neon" />
                            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">Twilio SMS Configuration</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                              label="Twilio Account SID"
                              value={apiKeys.twilioAccountSid}
                              onChange={(e: any) => setApiKeys({ ...apiKeys, twilioAccountSid: e.target.value })}
                              placeholder="AC..."
                            />
                            <InputField
                              label="Twilio Auth Token"
                              value={apiKeys.twilioAuthToken}
                              onChange={(e: any) => setApiKeys({ ...apiKeys, twilioAuthToken: e.target.value })}
                              type="password"
                              placeholder="••••••••••••••••••••••••••••••••"
                            />
                            <InputField
                              label="Twilio From Phone Number"
                              value={apiKeys.twilioFromPhone}
                              onChange={(e: any) => setApiKeys({ ...apiKeys, twilioFromPhone: e.target.value })}
                              placeholder="+1..."
                            />
                            <InputField
                              label="Twilio Messaging Service SID"
                              value={apiKeys.twilioMessagingSid}
                              onChange={(e: any) => setApiKeys({ ...apiKeys, twilioMessagingSid: e.target.value })}
                              placeholder="MG..."
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-10 mt-10 border-t border-slate-100 flex items-center justify-between">
                         <div>
                            <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Diagnostic Test</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Send a test signal to {bizInfo.phone}</div>
                         </div>
                         <button
                           onClick={handleTestMessage}
                           disabled={testLoading}
                           className="px-8 py-3.5 rounded-2xl border-2 border-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
                         >
                           {testLoading ? "TRANSMITTING..." : "Send Test Signal"}
                         </button>
                      </div>
                    </div>
                  </div>
                  
                  <TelegramSettings />
                </div>
              )}


              {settingsTab === "Security" && (
                <div className="glass-card !p-12">
                  <SectionHeader title="Vault Hardening" subtitle="Manage authentication thresholds and access protocols" />
                  <div className="space-y-10 mt-12">
                    <ToggleSwitch keyName="two_factor" label="Multi-Factor Protocol" desc="Mandatory biometric or TOTP verification for all staff" icon={Lock} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Session TTL Threshold</label>
                        <select 
                          value={toggles.session_timeout}
                          onChange={e => setToggles({ ...toggles, session_timeout: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-neon focus:ring-4 focus:ring-neon/10 transition-all appearance-none"
                        >
                          <option value="15m">15 MINUTE BURST</option>
                          <option value="30m">30 MINUTE WINDOW</option>
                          <option value="1h">1 HOUR EXTENDED</option>
                          <option value="4h">4 HOUR ENTERPRISE</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">IP Whitelist Shield</label>
                        <div className="relative">
                           <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                           <input 
                            value={toggles.ip_whitelist}
                            onChange={e => setToggles({ ...toggles, ip_whitelist: e.target.value })}
                            placeholder="CIDR_RANGE_OR_STATIC_IP..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 font-bold text-sm outline-none focus:border-neon focus:ring-4 focus:ring-neon/10 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "Integrations" && (
                <div className="glass-card !p-12">
                  <SectionHeader title="Neural Ecosystem" subtitle="Bridge Vyapari with external reporting and financial hubs" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    {Object.keys(integrations).map(key => (
                      <div key={key} className="brutal-card !p-8 flex flex-col justify-between hover:border-neon/30 transition-all duration-500 group">
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <span className="font-black text-sm uppercase tracking-tight text-slate-900">{key}</span>
                            <Badge status={integrations[key].connected ? 'Active' : 'Offline'} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed mb-10">
                            {key === 'QuickBooks' && 'Automated structural bookkeeping and real-time tax synchronization.'}
                            {key === 'Stripe' && 'Global payment gateway for dynamic invoice settlements.'}
                            {key === 'Tally' && 'Bridge inventory assets and ledger charts to Tally Prime.'}
                          </p>
                        </div>
                        <button
                          disabled={integrations[key].loading}
                          onClick={() => handleToggleIntegration(key)}
                          className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${
                            integrations[key].connected 
                              ? 'bg-slate-100 text-slate-900 hover:bg-red-50 hover:text-red-600' 
                              : 'bg-slate-900 text-white hover:bg-neon'
                          }`}
                        >
                          {integrations[key].loading ? <Zap className="animate-spin" size={14}/> : integrations[key].connected ? <RotateCcw size={14}/> : <ExternalLink size={14}/>}
                          {integrations[key].loading ? 'LINKING...' : integrations[key].connected ? 'DISCONNECT' : 'AUTHORIZE'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Stripe, Razorpay and UPI Gateway Credentials */}
                  <div className="pt-10 mt-10 border-t border-slate-100 space-y-10">
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 mb-2">💳 Stripe Gateway Configuration</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6">
                        Configure Stripe payment credentials for processing international and domestic credit cards in test or live modes.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                          label="Stripe Publishable Key"
                          value={apiKeys.stripePublishableKey}
                          onChange={(e: any) => setApiKeys({ ...apiKeys, stripePublishableKey: e.target.value })}
                          placeholder="pk_test_..."
                        />
                        <InputField
                          label="Stripe Secret Key"
                          value={apiKeys.stripeSecretKey}
                          onChange={(e: any) => setApiKeys({ ...apiKeys, stripeSecretKey: e.target.value })}
                          type="password"
                          placeholder="sk_test_..."
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 mb-2">💳 Razorpay Gateway Configuration</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6">
                        Configure Razorpay payment credentials for domestic card payments, Netbanking, and UPI wallets in India.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                          label="Razorpay Key ID"
                          value={apiKeys.razorpayKeyId}
                          onChange={(e: any) => setApiKeys({ ...apiKeys, razorpayKeyId: e.target.value })}
                          placeholder="rzp_test_..."
                        />
                        <InputField
                          label="Razorpay Key Secret"
                          value={apiKeys.razorpayKeySecret}
                          onChange={(e: any) => setApiKeys({ ...apiKeys, razorpayKeySecret: e.target.value })}
                          type="password"
                          placeholder="••••••••••••••••••••••••"
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 mb-2">📱 Instant UPI QR Configuration</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6">
                        Specify the standard VPA address to automatically generate interactive dynamic payment QR codes for fast checkout.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                          label="Target UPI ID (VPA)"
                          value={apiKeys.upiId}
                          onChange={(e: any) => setApiKeys({ ...apiKeys, upiId: e.target.value })}
                          placeholder="merchant@upi"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "Appearance" && (
                <div className="glass-card !p-12">
                  <SectionHeader title="Visual Telemetry Engine" subtitle="Fine-tune the structural and aesthetic identity of the platform" />
                  <div className="space-y-12 mt-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Primary Design Identity</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                          { id: "Modern Executive", desc: "Refined glassmorphism", icon: <Eye /> },
                          { id: "Brutalist Dark", desc: "High-contrast tactical", icon: <Layers /> },
                          { id: "Classic Ink", desc: "Traditional dense ink", icon: <FileText /> }
                        ].map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setToggles({ ...toggles, theme: theme.id })}
                            className={`p-8 rounded-[2rem] border-2 font-black text-xs uppercase tracking-widest transition-all duration-500 text-left relative overflow-hidden ${
                              toggles.theme === theme.id 
                                ? 'bg-slate-900 border-neon text-white shadow-2xl shadow-neon/20' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-neon/30'
                            }`}
                          >
                            <div className={`mb-4 ${toggles.theme === theme.id ? 'text-neon' : 'text-slate-300'}`}>
                               {theme.icon}
                            </div>
                            <div className="text-sm tracking-tighter mb-1">{theme.id}</div>
                            <div className="text-[8px] opacity-60">{theme.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                       <ToggleSwitch keyName="compact_view" label="Dense Grid Allocation" desc="Maximize data density in tables and dashboard metrics" icon={Layers} />
                       <ToggleSwitch keyName="animations" label="Kinetic Transitions" desc="Enable high-performance entrance and state animations" icon={Zap} />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "Billing" && (
                <div className="glass-card !p-12">
                  <SectionHeader title="License & Fiscal Plan" subtitle="Manage your enterprise tier and historical billing records" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 mb-12">
                    <div className="brutal-card !p-8 bg-neon/10 !border-neon/20">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Enterprise Tier</div>
                      <div className="text-4xl font-black uppercase tracking-tighter text-slate-900">VYAPARI_PRO</div>
                      <div className="mt-6 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-neon animate-pulse"></div>
                         <span className="text-[10px] font-black uppercase text-neon tracking-widest">Active System</span>
                      </div>
                    </div>
                    <div className="brutal-card !p-8">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Fiscal Cycle</div>
                      <div className="text-4xl font-black uppercase tracking-tighter text-slate-900">ANNUAL</div>
                      <div className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Settlement: DEC 2026</div>
                    </div>
                    <div className="brutal-card !p-8 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Allocated Slots</div>
                        <div className="text-4xl font-black uppercase tracking-tighter text-slate-900">98%</div>
                      </div>
                      <ActionBtn className="w-full mt-6 text-[10px]">Scale Resources</ActionBtn>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-8">
                     <FileText size={18} className="text-slate-400" />
                     <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">Fiscal Archives</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { id: "TXN_2026_001", amount: "₹14,999", date: "JAN 15, 2026", status: "Settled" },
                      { id: "TXN_2025_120", amount: "₹1,299", date: "DEC 15, 2025", status: "Settled" }
                    ].map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-neon/30 transition-all duration-500">
                        <div className="flex items-center gap-6">
                           <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                              <Download size={18} />
                           </div>
                           <div>
                              <div className="font-black text-xs uppercase tracking-tight text-slate-900">{inv.id}</div>
                              <div className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{inv.date} • {inv.status}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <span className="font-black text-sm tracking-tight text-slate-900">{inv.amount}</span>
                          <ActionBtn className="!px-6 !py-2 !text-[9px]">Retrieve</ActionBtn>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {settingsTab === "Automation" && (
                <div className="glass-card !p-12">
                  <SectionHeader title="Robotic Process Automation" subtitle="Configure triggers, conditions, AI decisions, and WhatsApp pipelines" />
                  <AutomationRules />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center pt-8 border-t border-slate-100">
            <button 
              onClick={handleReset}
              className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              FACTORY_RESET
            </button>
            <div className="flex gap-6">
              <button className="px-8 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">
                DISCARD_CHANGES
              </button>
              <button 
                onClick={handleSaveAttempt}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-neon transition-all"
              >
                SYNC_TO_CLOUD
              </button>
            </div>
          </div>
        </div>
      </div>
      <PinModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={handleSaveConfirmed}
        title="Authorize Settings Change"
        description="Please enter your 4-digit Owner PIN to synchronize these changes to the cloud."
      />
    </div>
  );
}

