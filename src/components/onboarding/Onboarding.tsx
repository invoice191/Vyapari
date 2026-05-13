import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, Building2, Package, Users, ArrowRight, CheckCircle2, 
  FileText, ShieldCheck, UserPlus, MapPin, Tag, Smartphone, Mail
} from 'lucide-react';
import { onboardingService } from '../../services/onboardingService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    gst: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: '',
    city: '',
    state: '',
    pincode: '',
    ownerPin: '',
    invoicePrefix: 'INV',
    invoiceStart: 1,
    firstProduct: { name: '', sku: '', unit_price: 0 },
    firstContact: { name: '', type: 'customer', phone: '' },
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!profile?.id) {
      toast("Profile not loaded. Please wait.", "warning");
      return;
    }
    setLoading(true);
    try {
      console.log("[Onboarding] Submitting formData:", formData);
      await onboardingService.completeOnboarding(profile.id, formData);
      setStep(7); // Success step
    } catch (err) {
      console.error("[Onboarding] Submission failed:", err);
      toast("Setup failed. Please check your inputs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Identity', icon: <Building2 size={20} /> },
    { id: 2, title: 'Contact', icon: <Smartphone size={20} /> },
    { id: 3, title: 'Inventory', icon: <Package size={20} /> },
    { id: 4, title: 'Network', icon: <Users size={20} /> },
    { id: 5, title: 'Billing', icon: <FileText size={20} /> },
    { id: 6, title: 'Security', icon: <ShieldCheck size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <button 
        onClick={() => signOut()}
        className="absolute top-6 right-6 z-20 px-5 py-2.5 bg-slate-800 text-white hover:bg-neon hover:text-slate-900 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
      >
        Sign Out --
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-[3rem] p-12 shadow-2xl relative z-10 overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-16 px-4">
          {steps.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-3 relative flex-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${
                step >= s.id ? 'bg-slate-900 text-neon shadow-xl shadow-neon/20' : 'bg-slate-100 text-slate-300'
              }`}>
                {step > s.id ? <CheckCircle2 size={24} /> : s.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                step >= s.id ? 'text-slate-900' : 'text-slate-300'
              }`}>
                {s.title}
              </span>
              {s.id < 6 && (
                <div className={`absolute top-6 left-1/2 w-full h-[2px] -z-0 transition-all duration-500 ${
                  step > s.id ? 'bg-neon' : 'bg-slate-100'
                }`} />
              )}
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900">Establish Your <span className="text-neon italic">Empire</span></h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Provide your primary business credentials to begin neural sync.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 flex flex-col items-center mb-8">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-neon transition-all group overflow-hidden relative">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Tag className="text-slate-300 group-hover:text-neon" size={32} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-neon">Upload Logo</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={formData.logoUrl}
                    onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                    placeholder="OR PASTE LOGO URL..."
                    className="mt-4 w-full max-w-xs bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-black text-[10px] uppercase text-center focus:border-neon outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Legal Business Entity</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={formData.businessName}
                      onChange={e => setFormData({...formData, businessName: e.target.value})}
                      placeholder="ENTERPRISE NAME..."
                      className="w-full bg-slate-50 border-2 border-slate-100 p-5 pl-14 rounded-2xl font-black text-sm uppercase focus:border-neon focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">GST Identification</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={formData.gst}
                      onChange={e => setFormData({...formData, gst: e.target.value.toUpperCase()})}
                      placeholder="15-CHAR GSTIN..."
                      maxLength={15}
                      className="w-full bg-slate-50 border-2 border-slate-100 p-5 pl-14 rounded-2xl font-black text-sm uppercase focus:border-neon focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleNext}
                disabled={!formData.businessName}
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl italic uppercase flex items-center justify-center gap-4 hover:bg-neon hover:text-slate-900 transition-all disabled:opacity-50 group"
              >
                Continue Setup <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900">Neural <span className="text-neon italic">Coordinates</span></h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Provide operational contact and location data.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Operational Phone</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-slate-50 border-2 border-slate-100 p-5 pl-14 rounded-2xl font-black text-sm focus:border-neon outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Enterprise Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="ADMIN@ENTERPRISE.COM"
                      className="w-full bg-slate-50 border-2 border-slate-100 p-5 pl-14 rounded-2xl font-black text-sm uppercase focus:border-neon outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Operational Headquarters</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="FULL OFFICE/STORE ADDRESS..."
                      className="w-full bg-slate-50 border-2 border-slate-100 p-5 pl-14 rounded-2xl font-black text-sm uppercase focus:border-neon focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">City</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    placeholder="CITY..."
                    className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-black text-sm uppercase focus:border-neon outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">State</label>
                    <input 
                      type="text" 
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                      placeholder="STATE..."
                      className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-black text-sm uppercase focus:border-neon outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Pincode</label>
                    <input 
                      type="text" 
                      value={formData.pincode}
                      onChange={e => setFormData({...formData, pincode: e.target.value})}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-black text-sm focus:border-neon outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="px-12 py-6 rounded-[2rem] border-2 border-slate-100 font-black uppercase italic text-slate-400 hover:text-slate-900 transition-all">Back</button>
                <button 
                  onClick={handleNext}
                  disabled={!formData.phone || !formData.email || !formData.address}
                  className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl italic uppercase hover:bg-neon hover:text-slate-900 transition-all disabled:opacity-50"
                >
                  Verify Coordinates
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900">Initialize <span className="text-neon italic">Assets</span></h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Add your first SKU to activate the inventory intelligence engine.</p>
              </div>

              <div className="bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Product Designation</label>
                    <input 
                      type="text" 
                      value={formData.firstProduct.name}
                      onChange={e => setFormData({...formData, firstProduct: {...formData.firstProduct, name: e.target.value}})}
                      placeholder="PRODUCT NAME..."
                      className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl font-black text-sm uppercase outline-none focus:border-neon transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">SKU / Serial Code</label>
                    <input 
                      type="text" 
                      value={formData.firstProduct.sku}
                      onChange={e => setFormData({...formData, firstProduct: {...formData.firstProduct, sku: e.target.value}})}
                      placeholder="SKU-XXXX-XXXX..."
                      className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl font-black text-sm uppercase outline-none focus:border-neon transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Unit Valuation (INR)</label>
                    <input 
                      type="number" 
                      value={formData.firstProduct.unit_price}
                      onChange={e => setFormData({...formData, firstProduct: {...formData.firstProduct, unit_price: Number(e.target.value)}})}
                      className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl font-black text-sm outline-none focus:border-neon transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="px-12 py-6 rounded-[2rem] border-2 border-slate-100 font-black uppercase italic text-slate-400 hover:text-slate-900 transition-all">Back</button>
                <button onClick={handleNext} className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl italic uppercase hover:bg-neon hover:text-slate-900 transition-all">Register Asset</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900">Map <span className="text-neon italic">Network</span></h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Register your first stakeholder to begin relationship tracking.</p>
              </div>

              <div className="bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Stakeholder Identity</label>
                    <input 
                      type="text" 
                      value={formData.firstContact.name}
                      onChange={e => setFormData({...formData, firstContact: {...formData.firstContact, name: e.target.value}})}
                      placeholder="NAME OR FIRM..."
                      className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl font-black text-sm uppercase outline-none focus:border-neon transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Network Role</label>
                    <select 
                      value={formData.firstContact.type}
                      onChange={e => setFormData({...formData, firstContact: {...formData.firstContact, type: e.target.value}})}
                      className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl font-black text-sm uppercase outline-none focus:border-neon transition-all appearance-none"
                    >
                      <option value="customer">CUSTOMER</option>
                      <option value="supplier">SUPPLIER</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Secure Contact Link</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        value={formData.firstContact.phone}
                        onChange={e => setFormData({...formData, firstContact: {...formData.firstContact, phone: e.target.value}})}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full bg-white border-2 border-slate-100 p-5 pl-14 rounded-2xl font-black text-sm outline-none focus:border-neon transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="px-12 py-6 rounded-[2rem] border-2 border-slate-100 font-black uppercase italic text-slate-400 hover:text-slate-900 transition-all">Back</button>
                <button onClick={handleNext} className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl italic uppercase hover:bg-neon hover:text-slate-900 transition-all">Sync Network</button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900">Billing <span className="text-neon italic">Series</span></h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Configure your official document nomenclature.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Voucher Prefix</label>
                  <input 
                    type="text" 
                    value={formData.invoicePrefix}
                    onChange={e => setFormData({...formData, invoicePrefix: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-black text-2xl tracking-tighter uppercase focus:border-neon outline-none text-center transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Starting Sequence</label>
                  <input 
                    type="number" 
                    value={formData.invoiceStart}
                    onChange={e => setFormData({...formData, invoiceStart: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-black text-2xl tracking-tighter focus:border-neon outline-none text-center transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="px-12 py-6 rounded-[2rem] border-2 border-slate-100 font-black uppercase italic text-slate-400 hover:text-slate-900 transition-all">Back</button>
                <button onClick={handleNext} className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl italic uppercase hover:bg-neon hover:text-slate-900 transition-all">Confirm Series</button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div 
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900">Vault <span className="text-neon italic">Shield</span></h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Establish your 4-digit Owner PIN for high-security authorizations.</p>
              </div>

              <div className="flex justify-center gap-6">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-20 h-24 rounded-3xl border-4 flex items-center justify-center text-4xl font-black transition-all duration-500 ${
                    formData.ownerPin.length > i ? 'bg-slate-900 text-neon border-neon shadow-2xl shadow-neon/30 scale-110' : 'bg-slate-50 border-slate-100 text-slate-200'
                  }`}>
                    {formData.ownerPin[i] ? '-' : ''}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map(n => (
                  <button 
                    key={n}
                    onClick={() => {
                      if (n === 'C') setFormData({...formData, ownerPin: ''});
                      else if (n === 'DEL') setFormData({...formData, ownerPin: formData.ownerPin.slice(0, -1)});
                      else if (formData.ownerPin.length < 4) setFormData({...formData, ownerPin: formData.ownerPin + n});
                    }}
                    className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 font-black text-xl transition-all"
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="px-12 py-6 rounded-[2rem] border-2 border-slate-100 font-black uppercase italic text-slate-400 hover:text-slate-900 transition-all">Back</button>
                <button 
                  onClick={handleSubmit}
                  disabled={formData.ownerPin.length !== 4 || loading}
                  className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl italic uppercase hover:bg-neon hover:text-slate-900 transition-all disabled:opacity-50"
                >
                  {loading ? 'CALCULATING...' : 'EXECUTE_DEPLOYMENT'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div 
              key="step7"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-32 h-32 bg-neon text-slate-900 flex items-center justify-center mx-auto mb-10 rounded-[2.5rem] shadow-2xl shadow-neon/40 rotate-3 animate-pulse">
                <CheckCircle2 size={64} />
              </div>
              <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4 text-slate-900">SYSTEM_ARMED</h2>
              <p className="text-xl font-black text-slate-400 uppercase tracking-[0.3em] mb-12">All neural nodes synchronized. Welcome to Vyapari.</p>
              <button 
                onClick={onComplete}
                className="bg-slate-900 text-white px-20 py-8 rounded-[2.5rem] font-black text-3xl italic uppercase hover:bg-neon hover:text-slate-900 transition-all shadow-2xl"
              >
                Access_Nexus
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
