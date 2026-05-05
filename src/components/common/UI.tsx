import React from "react";
import { C } from "../../constants";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "motion/react";

export const formatCurrency = (n: number) => `₹${(n / 1000).toFixed(0)}K`;
export const formatNum = (n: number) => n.toLocaleString("en-IN");

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: 'border-green-500 text-green-500 bg-green-500/10',
    Pending: 'border-yellow-500 text-yellow-500 bg-yellow-500/10',
    Overdue: 'border-red-500 text-red-500 bg-red-500/10',
    Cancelled: 'border-ink/20 text-ink/40 bg-ink/5',
    Completed: 'border-green-500 text-green-500 bg-green-500/10',
    Processing: 'border-neon text-neon bg-neon/10',
    Failed: 'border-red-500 text-red-500 bg-red-500/10',
    "Low Risk": 'border-green-500 text-green-500 bg-green-500/10',
    "Medium Risk": 'border-yellow-500 text-yellow-500 bg-yellow-500/10',
    "High Risk": 'border-red-500 text-red-500 bg-red-500/10',
  };
  const classes = map[status] || 'border-ink/20 text-ink/40 bg-ink/5';
  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`px-3 py-1 border-2 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap inline-block shadow-[2px_2px_0px_var(--color-ink)] ${classes}`}
    >
      {status}
    </motion.span>
  );
}

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => {
  return (
    <motion.div 
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -4 } : {}}
      className={`brutal-card bg-white p-8 ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function OrangeBtn({ children, onClick, className = "", secondary = false, small = false, disabled = false }: { children: React.ReactNode, onClick?: any, className?: string, secondary?: boolean, small?: boolean, disabled?: boolean }) {
  return (
    <motion.button 
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={`
        brutal-btn transition-all
        ${small ? '!py-1.5 !px-4 !text-[10px] !shadow-[2px_2px_0px_var(--color-neon)] hover:!shadow-[4px_4px_0px_var(--color-neon)]' : ''}
        ${secondary ? '!bg-white !text-ink border-2 border-ink !shadow-[4px_4px_0px_var(--color-ink)] hover:!shadow-[8px_8px_0px_var(--color-ink)]' : ''}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed shadow-none translate-y-0 translate-x-0' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

export function KPICard({ title, value, change, changeLabel, icon, color = '#FF6B35', sparkData }: any) {
  const isPos = change >= 0;
  return (
    <Card className="group hover:bg-ink hover:text-white transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-ink/5 -mr-16 -mt-16 rounded-full group-hover:bg-white/5 transition-colors" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="text-[10px] font-black text-ink/40 group-hover:text-white/40 uppercase tracking-[0.3em] mb-4">{title}</div>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black tracking-tighter mb-4 italic"
          >
            {value}
          </motion.div>
          <div className="flex items-center gap-3">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-2 ${isPos ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
              {isPos ? "▲" : "▼"} {Math.abs(change)}%
            </span>
            <span className="text-[9px] font-black text-ink/30 group-hover:text-white/30 uppercase tracking-[0.1em]">{changeLabel}</span>
          </div>
        </div>
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.2 }}
          className="w-14 h-14 flex items-center justify-center text-3xl border-2 border-ink group-hover:border-white transition-all shadow-[4px_4px_0px_var(--color-ink)] group-hover:shadow-[4px_4px_0px_white]"
          style={{ background: `${color}20` }}
        >
          {icon}
        </motion.div>
      </div>
      {sparkData && (
        <div className="mt-8 h-12 opacity-30 group-hover:opacity-100 transition-all duration-500">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <Area type="monotone" dataKey="v" stroke={color} fill={`${color}40`} strokeWidth={4} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 border-b-4 border-ink pb-6 relative">
      <div className="absolute -bottom-1 left-0 w-24 h-1 bg-neon" />
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase leading-none italic">{title}</h2>
        {subtitle && <p className="text-[10px] font-black text-ink/40 uppercase tracking-[0.2em] mt-3 italic">{subtitle}</p>}
      </div>
      <div className="flex-shrink-0">
        {action}
      </div>
    </div>
  );
}

