import React, { useState, useEffect } from 'react';
import { Fingerprint, Scan, ShieldCheck, XCircle, Lock, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { biometricService } from '../../services/biometricService';

interface BiometricShieldProps {
  userId: string;
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BiometricShield: React.FC<BiometricShieldProps> = ({ 
  userId, 
  email, 
  onSuccess, 
  onCancel 
}) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'failed' | 'unsupported'>('idle');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!biometricService.isSupported()) {
      setStatus('unsupported');
    }
  }, []);

  const handleAuth = async () => {
    setStatus('scanning');
    const success = await biometricService.authenticate(userId);
    if (success) {
      setStatus('success');
      setTimeout(onSuccess, 1500);
    } else {
      setStatus('failed');
    }
  };

  const handleRegister = async () => {
    setStatus('scanning');
    const success = await biometricService.register(userId, email);
    if (success) {
      setStatus('success');
      setTimeout(onSuccess, 1500);
    } else {
      setStatus('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0f1115] border border-white/10 w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-6 right-6">
          <button onClick={onCancel} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-10 text-center space-y-8">
          <div className="flex justify-center">
            <div className="relative">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50"
                  >
                    <ShieldCheck className="w-12 h-12 text-emerald-400" />
                  </motion.div>
                ) : status === 'failed' ? (
                  <motion.div
                    key="failed"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50"
                  >
                    <Lock className="w-12 h-12 text-red-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="normal"
                    className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center relative"
                  >
                    <Fingerprint className={`w-12 h-12 text-indigo-400 ${status === 'scanning' ? 'animate-pulse' : ''}`} />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {status === 'scanning' && (
                <motion.div 
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] z-10 opacity-50"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              {status === 'success' ? 'Identity Verified' : 
               status === 'failed' ? 'Verification Failed' : 
               status === 'unsupported' ? 'Hardware Unavailable' :
               'Biometric Shield'}
            </h2>
            <p className="text-gray-500 text-sm px-4 leading-relaxed">
              {status === 'success' ? 'Access granted. Welcome back.' :
               status === 'unsupported' ? 'Your browser or device does not support WebAuthn biometrics.' :
               'Confirm your identity using FaceID or Fingerprint to proceed with this sensitive action.'}
            </p>
          </div>

          <div className="pt-4">
            {status === 'unsupported' ? (
              <button
                onClick={onCancel}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
              >
                Use Alternative Method
              </button>
            ) : status === 'failed' ? (
              <button
                onClick={() => setStatus('idle')}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                Try Again
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAuth}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3"
                >
                  <Scan className="w-5 h-5" /> Authenticate Now
                </button>
                <button
                  onClick={handleRegister}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-bold transition-all text-xs"
                >
                  New Device? Register Biometrics
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-mono tracking-widest uppercase">
            <Smartphone className="w-3 h-3" />
            End-to-End Secure
          </div>
        </div>
      </motion.div>
    </div>
  );
};
