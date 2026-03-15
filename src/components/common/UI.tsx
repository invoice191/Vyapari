import React from "react";
import { C } from "../../constants";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "motion/react";

export const formatCurrency = (n: number) => `₹${(n / 1000).toFixed(0)}K`;
export const formatNum = (n: number) => n.toLocaleString("en-IN");

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: 'border-green-500 text-green-500 bg-green-50',
    Pending: 'border-yellow-500 text-yellow-500 bg-yellow-50',
    Overdue: 'border-red-500 text-red-500 bg-red-50',
    Cancelled: 'border-ink/20 text-ink/40 bg-ink/5',
    Completed: 'border-green-500 text-green-500 bg-green-50',
    Processing: 'border-neon text-neon bg-neon/5',
    Failed: 'border-red-500 text-red-500 bg-red-50',
    "Low Risk": 'border-green-500 text-green-500 bg-green-50',
    "Medium Risk": 'border-yellow-500 text-yellow-500 bg-yellow-50',
    "High Risk": 'border-red-500 text-red-500 bg-red-50',
  };
  const classes = map[status] || 'border-ink/20 text-ink/40 bg-ink/5';
  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`px-3 py-1 border-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap inline-block ${classes}`}
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
      className={`brutal-card bg-white p-6 ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function OrangeBtn({ children, onClick, className = "", secondary = false, small = false, disabled = false }: { children: React.ReactNode, onClick?: any, className?: string, secondary?: boolean, small?: boolean, disabled?: boolean }) {
  return (
    <motion.button 
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        brutal-btn transition-all
        ${small ? '!py-1.5 !px-4 !text-xs' : ''}
        ${secondary ? '!bg-white !text-ink border-2 border-ink' : ''}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
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
    <Card className="group hover:bg-ink hover:text-white transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[10px] font-black text-ink/40 group-hover:text-white/40 uppercase tracking-widest mb-2">{title}</div>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black tracking-tighter mb-2"
          >
            {value}
          </motion.div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${isPos ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
              {isPos ? "▲" : "▼"} {Math.abs(change)}%
            </span>
            <span className="text-[10px] font-bold text-ink/40 group-hover:text-white/40 uppercase tracking-widest">{changeLabel}</span>
          </div>
        </div>
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="w-12 h-12 flex items-center justify-center text-2xl border-2 border-ink group-hover:border-white transition-colors"
          style={{ background: `${color}20` }}
        >
          {icon}
        </motion.div>
      </div>
      {sparkData && (
        <div className="mt-6 h-10 opacity-50 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <Area type="monotone" dataKey="v" stroke={color} fill={`${color}20`} strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-4 border-ink pb-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight uppercase leading-none">{title}</h2>
        {subtitle && <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
