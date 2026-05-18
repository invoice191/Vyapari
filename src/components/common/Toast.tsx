import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertTriangle, Info, Bell, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: any, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Convert objects to readable strings
    let displayMessage = message;
    if (typeof message === 'object' && message !== null) {
      displayMessage = message.message || message.error_description || JSON.stringify(message);
    } else {
      displayMessage = String(message);
    }

    setToasts((prev) => [...prev, { id, message: displayMessage, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  React.useEffect(() => {
    const handleGlobalToast = (e: any) => {
      const { message, type, title } = e.detail;
      toast(title ? `${title}: ${message}` : message, type);
    };
    window.addEventListener('app:toast', handleGlobalToast);
    return () => window.removeEventListener('app:toast', handleGlobalToast);
  }, [toast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-400" size={18} />;
      case 'error': return <XCircle className="text-rose-400" size={18} />;
      case 'warning': return <AlertTriangle className="text-amber-400" size={18} />;
      default: return <Info className="text-indigo-400" size={18} />;
    }
  };

  const getShadowColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'shadow-[0_8px_30px_rgba(16,185,129,0.12)] border-emerald-500/20';
      case 'error': return 'shadow-[0_8px_30px_rgba(244,63,94,0.12)] border-rose-500/20';
      case 'warning': return 'shadow-[0_8px_30px_rgba(245,158,11,0.12)] border-amber-500/20';
      default: return 'shadow-[0_8px_30px_rgba(99,102,241,0.12)] border-indigo-500/20';
    }
  };

  const getTitle = (type: ToastType) => {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      default: return 'Information';
    }
  };

  const getProgressColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-rose-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-indigo-500';
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[2000] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ x: 80, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className={`
                pointer-events-auto
                min-w-[320px] max-w-md p-4 rounded-2xl border
                bg-slate-900/95 backdrop-blur-md text-white
                flex items-start gap-4.5 relative overflow-hidden
                ${getShadowColor(t.type)}
              `}
            >
              <div className="flex-shrink-0 mt-0.5 p-1 bg-white/5 rounded-xl">
                {getIcon(t.type)}
              </div>
              <div className="flex-1 pr-2">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 text-slate-400">
                  {getTitle(t.type)}
                </div>
                <div className="text-[13px] font-semibold text-slate-100 leading-snug">
                  {t.message}
                </div>
              </div>
              <button 
                onClick={() => removeToast(t.id)}
                className="hover:bg-white/10 text-slate-400 hover:text-white rounded-lg p-1.5 transition-all duration-300 self-start -mr-1"
              >
                <X size={14} />
              </button>
              
              {/* Bottom Progress Timer */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-[3px] rounded-full opacity-80 ${getProgressColor(t.type)}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

// Global helper to trigger toasts from anywhere
export const toast = {
  success: (message: string, title?: string) => window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'success', title } })),
  error: (message: string, title?: string) => window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'error', title } })),
  warning: (message: string, title?: string) => window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'warning', title } })),
  info: (message: string, title?: string) => window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'info', title } })),
};
