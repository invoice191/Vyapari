import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';

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
      case 'success': return <CheckCircle size={18} />;
      case 'error': return <X size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-500 text-white border-green-700';
      case 'error': return 'bg-red-500 text-white border-red-700';
      case 'warning': return 'bg-orange-400 text-ink border-orange-600';
      default: return 'bg-ink text-white border-ink';
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[2000] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ x: 100, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 100, opacity: 0, scale: 0.8 }}
              className={`
                pointer-events-auto
                min-w-[300px] max-w-md p-5 border-4 shadow-[8px_8px_0px_var(--color-ink)]
                flex items-center gap-4 relative overflow-hidden
                ${getColor(t.type)}
              `}
            >
              <div className="flex-shrink-0">{getIcon(t.type)}</div>
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">SYSTEM_ALERT.{t.type}</div>
                <div className="text-sm font-black tracking-tight leading-tight uppercase italic">{t.message}</div>
              </div>
              <button 
                onClick={() => removeToast(t.id)}
                className="hover:rotate-90 transition-transform p-1"
              >
                <X size={16} />
              </button>
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-1 bg-white/30"
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
