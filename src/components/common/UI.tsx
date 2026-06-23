import React from "react";
import { C } from "../../lib/constants";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "motion/react";

export const formatCurrency = (n: number) => `Rs.${(n / 1000).toFixed(0)}K`;
export const formatNum = (n: number) => n.toLocaleString("en-IN");

export function Badge({ status, className = "", children }: { status?: string, className?: string, children?: React.ReactNode }) {
  const map: Record<string, string> = {
    Paid: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    Unpaid: 'text-rose-600 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5',
    Pending: 'text-amber-600 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
    Overdue: 'text-rose-600 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5',
    Cancelled: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    Completed: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    Processing: 'text-brand bg-brand/10 border-brand/20',
    Failed: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
    "Almost finished": 'text-amber-600 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
    "Out of stock": 'text-rose-600 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5',
    Ordered: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20',
    Delivered: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    "Low Risk": 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    "Medium Risk": 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    "High Risk": 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  };
  const classes = map[status || ""] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`px-4 py-1.5 border text-[12px] font-black uppercase tracking-[0.2em] whitespace-nowrap inline-block rounded-full backdrop-blur-md shadow-sm ${classes} ${className}`}
    >
      {children || status}
    </motion.span>
  );
}

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => {
  return (
    <motion.div 
      onClick={onClick}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2, scale: 1.001 } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`${className.includes('bg-') ? '' : 'bg-white'} rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 p-6 ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function ActionBtn({ 
  children, 
  onClick, 
  className = "", 
  secondary = false, 
  small = false, 
  disabled = false,
  type = "button"
}: { 
  children: React.ReactNode, 
  onClick?: any, 
  className?: string, 
  secondary?: boolean, 
  small?: boolean, 
  disabled?: boolean,
  type?: "button" | "submit" | "reset"
}) {
  return (
    <motion.button 
      type={type}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.015, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 shadow-sm
        ${secondary ? 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'bg-slate-900 text-white shadow-slate-900/5 hover:bg-slate-850'}
        ${small ? '!py-1.5 !px-3.5 !text-[10px] !rounded-lg' : ''}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

export function OrangeBtn({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  type = "button"
}: { 
  children: React.ReactNode, 
  onClick?: any, 
  className?: string, 
  disabled?: boolean,
  type?: "button" | "submit" | "reset"
}) {
  return (
    <motion.button 
      type={type}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.015, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 shadow-sm
        bg-orange-600 text-white shadow-orange-500/20 hover:bg-orange-700
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}


export function KPICard({ title, value, change, changeLabel, icon, color = '#4f46e5', sparkData, onClick }: any) {
  const isPos = change >= 0;
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <Card 
      className={`group relative border border-white/5 bg-slate-950 hover:bg-slate-900 transition-all duration-500 overflow-hidden !p-0 ${onClick ? 'cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/20' : ''}`} 
      onClick={onClick}
    >
      <div 
        onMouseMove={handleMouseMove}
        className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"
        style={{ 
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${color}25 0%, transparent 70%)` 
        }}
      />
      
      <div className="flex justify-between items-start relative z-10 p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color }} />
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{title}</div>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-white drop-shadow-sm"
          >
            {value}
          </motion.div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border ${isPos ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/20 text-rose-400 bg-rose-500/10'}`}>
              {isPos ? "+" : "-"} {Math.abs(change)}%
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{changeLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-white border border-white/20 rounded-xl sm:rounded-2xl bg-white/10 transition-all group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.2)]">
            <span className="text-xl sm:text-2xl transform group-hover:scale-110 transition-transform">{icon}</span>
          </div>
        </div>
      </div>

      {sparkData && (
        <div className="mt-8 h-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent z-10" />
          <div className="h-full group-hover:scale-y-110 transition-transform duration-700 origin-bottom">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="v" 
                  stroke={color} 
                  fill={`url(#grad-${title})`} 
                  strokeWidth={3} 
                  dot={false} 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse !p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-4">
          <div className="h-2 bg-slate-100 rounded w-1/3"></div>
          <div className="h-8 bg-slate-100 rounded w-2/3"></div>
          <div className="h-2 bg-slate-100 rounded w-1/2"></div>
        </div>
        <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
      </div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 border-b border-slate-100 pb-6 relative">
      <div className="relative pl-6 group">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-full group-hover:h-full transition-all duration-500" />
        <h2 className="text-base font-extrabold tracking-tight text-slate-900 uppercase leading-snug">
          {title}
        </h2>
        {subtitle && (
          <div className="flex items-center gap-2 mt-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        {action}
      </div>
    </div>
  );
}



