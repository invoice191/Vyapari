import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, Package, Users, PieChart, AlertCircle } from 'lucide-react';

interface HealthScore {
  label: string;
  score: number;
  max: number;
  value: string;
  icon: any;
  color: string;
}

export const HealthPanel: React.FC = () => {
  const [healthScores, setHealthScores] = useState<HealthScore[]>([
    { label: 'MONEY LEFT', score: 5, max: 25, value: '3 months', icon: Shield, color: 'overdue' },
    { label: 'SALES GROWTH', score: 20, max: 20, value: '+24%', icon: TrendingUp, color: 'paid' },
    { label: 'STOCK STATUS', score: 15, max: 20, value: 'Good', icon: Package, color: 'warning' },
    { label: 'CUSTOMER LOYALTY', score: 10, max: 10, value: 'Active', icon: Users, color: 'paid' },
    { label: 'PROFIT LEVEL', score: 15, max: 15, value: '32%', icon: PieChart, color: 'paid' },
  ]);

  const totalScore = healthScores.reduce((acc, curr) => acc + curr.score, 0);
  const maxTotal = healthScores.reduce((acc, curr) => acc + curr.max, 0);
  const grade = totalScore / maxTotal > 0.8 ? 'A' : totalScore / maxTotal > 0.6 ? 'B' : 'C';

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon" />
            SHOP STATUS
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Score: <span className="text-white font-bold">{totalScore}/{maxTotal}</span> Grade: <span className="text-neon font-black">{grade}</span>
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {healthScores.map((score) => (
          <div key={score.label} className="group cursor-pointer">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{score.label}</span>
              <div className="text-right">
                <span className="text-white font-bold text-sm block">{score.value}</span>
                <span className="text-[10px] text-slate-400">{score.score}/{score.max} pts</span>
              </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_12px_rgba(159,239,0,0.2)]`}
                style={{ 
                  width: `${(score.score / score.max) * 100}%`,
                  backgroundColor: score.score / score.max < 0.5 ? '#EF4444' : score.score / score.max < 0.75 ? '#F59E0B' : '#9FEF00'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-white/5">
        <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          URGENT ALERTS
        </h3>
        <div className="space-y-3">
          <AlertItem color="bg-red-500" text="2 products critical" count={2} />
          <AlertItem color="bg-amber-500" text="3 invoices overdue" count={3} />
          <AlertItem color="bg-blue-500" text="5 customers at risk" count={5} />
        </div>
      </div>
    </div>
  );
};

const AlertItem = ({ color, text, count }: { color: string, text: string, count: number }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm text-slate-300 font-medium">{text}</span>
    </div>
    <span className="text-xs text-slate-500 font-bold">Details →</span>
  </div>
);
