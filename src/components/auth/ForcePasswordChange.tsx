import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../common/Toast';

const ForcePasswordChange: React.FC = () => {
  const { user, profile, updatePassword, setNeedsPasswordChange } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (cleanPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (cleanPass !== cleanConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // 1. Update Auth Password
      await updatePassword(cleanPass);

      // 2. Clear flag in Profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          requires_password_change: false
        })
        .eq('id', user?.id);

      if (error) throw error;

      setSuccess(true);
      toast.success("Security handshake complete!");
      
      setTimeout(() => {
        setNeedsPasswordChange(false);
      }, 2000);

    } catch (err: any) {
      console.error("Password update failed:", err);
      
      const errMsg = err.message || "";
      
      if (errMsg.includes("should be different from the old")) {
        toast.error("SECURITY ALERT: You cannot reuse the temporary password. Please type a NEW private password.");
      } else if (errMsg.includes("at least 6 characters") || errMsg.includes("weak")) {
        toast.error("PASSWORD TOO WEAK: Please use a stronger password with at least 8 characters.");
      } else {
        toast.error(`HANDSHAKE ERROR: ${errMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-white/20"
      >
        {!success ? (
          <div className="p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20">
                <Shield size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">Security Handshake</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Zero-Trust Credential Upgrade</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8">
              <div className="flex gap-4">
                <div className="p-2 bg-white rounded-xl h-fit border border-slate-200">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">
                  Welcome, <span className="font-black text-slate-900">{profile?.full_name || 'Team Member'}</span>. 
                  As a security measure, all new accounts must initialize their own private credentials upon first login.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Secure Password</label>
                <div className="relative">
                  <input 
                    required
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    autoComplete="new-password"
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all pr-12"
                    placeholder="Min 8 characters..."
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Identity</label>
                <input 
                  required
                  type="password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="Repeat new password..."
                />
              </div>

              <button 
                disabled={loading}
                className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <Key size={18} />
                    Finalize Credentials
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Access Granted</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Handshake Complete. Redirecting to Dashboard...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForcePasswordChange;
