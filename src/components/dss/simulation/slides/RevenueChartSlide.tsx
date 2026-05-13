import React from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Theme } from '../PresentationMode';

interface SlideProps {
  data: any;
  theme: Theme;
}

export default function RevenueChartSlide({ data, theme }: SlideProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-50';

  const chartData = (data.per_product_analysis || []).map((p: any) => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    current: p.current_revenue,
    projected: p.projected_revenue
  }));

  // Add total bar if there are multiple products
  if (chartData.length > 1) {
    chartData.push({
      name: 'TOTAL',
      current: data.current_scenario?.total_revenue || 0,
      projected: data.simulated_scenario?.total_revenue_projected || 0
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 ${theme === 'dark' ? 'bg-slate-900/90' : 'bg-white/90'} border ${borderColor} rounded-xl shadow-2xl backdrop-blur-md`}>
          <p className={`text-[10px] font-black uppercase tracking-widest ${textColor} mb-3 border-b ${borderColor} pb-2`}>{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between gap-8 items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Current</span>
              <span className={`text-xs font-black ${textColor}`}>Rs.{payload[0].value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-8 items-center">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Projected</span>
              <span className="text-xs font-black text-indigo-400">Rs.{payload[1].value.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col px-8 py-6 overflow-hidden min-h-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h2 className={`text-3xl lg:text-4xl font-black ${textColor} uppercase tracking-tight mb-2 italic`}>Revenue Comparison</h2>
        <div className="w-32 h-1.5 bg-indigo-500 rounded-full" />
      </motion.div>

      <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-h-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`flex-1 p-6 lg:p-8 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-xl relative overflow-hidden min-h-0`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)]" />
          
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10, fontWeight: 900 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10, fontWeight: 900 }}
                dx={-10}
                tickFormatter={(val) => `Rs.${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px' }}
                formatter={(val) => <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textColor} opacity-60 ml-2`}>{val}</span>}
              />
              <Bar 
                dataKey="current" 
                name="Current" 
                fill={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
                radius={[8, 8, 0, 0]} 
                barSize={40}
                animationDuration={2000}
              />
              <Bar 
                dataKey="projected" 
                name="Projected" 
                fill="#6366f1" 
                radius={[8, 8, 0, 0]} 
                barSize={40}
                animationDuration={2000}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === 'TOTAL' ? '#9FEF00' : '#6366f1'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 h-32 shrink-0">
          {(data.per_product_analysis || []).slice(0, 2).map((p: any, i: number) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.6 + (i * 0.2) }}
               className={`p-4 lg:p-6 rounded-[1.5rem] border ${borderColor} ${cardBg} flex flex-col justify-center`}
             >
                <h4 className={`text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2`}>{p.name}</h4>
                <div className="flex items-center gap-6">
                   <div className={`text-2xl font-black ${textColor} italic tracking-tighter`}>Rs.{p.current_revenue?.toLocaleString()} - Rs.{p.projected_revenue?.toLocaleString()}</div>
                   <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">
                      +{(((p.projected_revenue - p.current_revenue) / p.current_revenue) * 100).toFixed(0)}%
                   </div>
                </div>
             </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
