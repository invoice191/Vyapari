import React from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface RoleGuardProps {
  children: React.ReactNode;
  permission?: string;
  module?: string;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  permission, 
  module, 
  fallback 
}) => {
  const { can, isOwner } = useRBAC();

  const hasAccess = () => {
    if (isOwner) return true;
    if (module) return can(module, permission || 'view');
    // Add more granular permission checks if needed
    return true;
  };

  if (!hasAccess()) {
    return fallback || (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200"
      >
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Access Restricted</h2>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest max-w-xs">
          Your current clearance level does not allow access to the <span className="text-rose-500">{module || 'this'}</span> module.
        </p>
        <div className="mt-8 px-6 py-2 bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] rounded-full">
          Secure Zone
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
};
