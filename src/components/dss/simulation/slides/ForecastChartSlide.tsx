import React from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Theme } from '../PresentationMode';

interface SlideProps {
  data: any;
  theme: Theme;
}

export default function ForecastChartSlide({ data, theme }: SlideProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-50';

  const horizon = data.input_params?.horizon || 30;
  
  // Generate mock forecast data for the chart
  const forecastData = Array.from({ length: horizon }).map((_, i) => {
    const day = i + 1;
    const base = (data.simulated_scenario?.total_revenue_projected || 64800) / horizon;
    const variation = Math.sin(day / 5) * (base * 0.2);
    const value = base + variation;
    return {
      day: `Day ${day}`,
      value: Math.round(value),
      upper: Math.round(value * 1.1),
      lower: Math.round(value * 0.9),
      baseline: Math.round((data.current_scenario?.total_revenue || 52000) / horizon)
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 ${theme === 'dark' ? 'bg-slate-900/90' : 'bg-white/90'} border ${borderColor} rounded-xl shadow-2xl backdrop-blur-md`}>
          <p className={`text-[10px] font-black uppercase tracking-widest ${textColor} mb-3 border-b ${borderColor} pb-2`}>{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between gap-8 items-center">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Projected</span>
              <span className="text-xs font-black text-indigo-400">Rs.{payload[0].value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-8 items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Baseline</span>
              <span className={`text-xs font-black ${textColor} opacity-60`}>Rs.{payload[1].value.toLocaleString()}</span>
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
        <h2 className={`text-3xl lg:text-4xl font-black ${textColor} uppercase tracking-tight mb-2 italic`}>{horizon} Day Revenue Forecast</h2>
        <div className="w-32 h-1.5 bg-indigo-500 rounded-full" />
      </motion.div>

      <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-h-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`flex-1 p-6 lg:p-8 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-xl relative overflow-hidden min-h-0`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 8, fontWeight: 900 }}
                interval={Math.floor(horizon / 6)}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10, fontWeight: 900 }}
                tickFormatter={(val) => `Rs.${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Confidence Band */}
              <Area 
                type="monotone" 
                dataKey="upper" 
                stroke="none" 
                fill="url(#confidenceBand)" 
                connectNulls 
              />
              <Area 
                type="monotone" 
                dataKey="lower" 
                stroke="none" 
                fill="url(#confidenceBand)" 
                connectNulls 
              />

              <Area 
                type="monotone" 
                dataKey="baseline" 
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 
                strokeDasharray="5 5" 
                fill="none" 
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#6366f1" 
                strokeWidth={4} 
                fill="url(#colorValue)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 lg:gap-6 h-28 shrink-0">
          {[
            { label: 'Peak Day Estimate', val: `Day ${Math.floor(horizon * 0.7)}`, detail: `Rs.${Math.round((data.simulated_scenario?.total_revenue_projected || 64800) / horizon * 1.2)}` },
            { label: 'Lowest Day', val: `Day 1`, detail: `Rs.${Math.round((data.simulated_scenario?.total_revenue_projected || 64800) / horizon * 0.8)}` },
            { label: 'Average Daily', val: `Overall`, detail: `Rs.${Math.round((data.simulated_scenario?.total_revenue_projected || 64800) / horizon)}` }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + (i * 0.1) }}
              className={`p-4 rounded-2xl border ${borderColor} ${cardBg} text-center flex flex-col justify-center`}
            >
               <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</div>
               <div className={`text-sm font-black ${textColor} uppercase mb-1`}>{stat.val}</div>
               <div className="text-xl font-black text-indigo-500 italic tracking-tighter">{stat.detail}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
