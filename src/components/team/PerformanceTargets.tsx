import React from 'react';
import { Target, TrendingUp, AlertCircle, Award } from 'lucide-react';

const PerformanceTargets: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Team Performance</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Monthly KPIs & Targets</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Target size={24} />
            </div>
          </div>
          
          <div className="space-y-8">
            {[
              { label: 'Sales Volume', current: 850000, target: 1000000, color: 'bg-blue-500' },
              { label: 'Customer Retention', current: 92, target: 95, color: 'bg-emerald-500' },
              { label: 'Lead Conversion', current: 18, target: 25, color: 'bg-amber-500' },
            ].map((kpi, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">{kpi.label}</span>
                  <span className="font-black text-slate-900">{Math.round((kpi.current / kpi.target) * 100)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${kpi.color} rounded-full transition-all duration-1000`} 
                    style={{ width: `${(kpi.current / kpi.target) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Current: {kpi.label.includes('Sales') ? `₹${kpi.current.toLocaleString()}` : `${kpi.current}%`}</span>
                  <span>Target: {kpi.label.includes('Sales') ? `₹${kpi.target.toLocaleString()}` : `${kpi.target}%`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-amber-400" size={24} />
            <h3 className="font-black uppercase tracking-tight">Top Performer</h3>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <span className="text-2xl font-black">SP</span>
            </div>
            <div>
              <div className="font-black text-lg">Saurabh Prajwal</div>
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Senior Sales Lead</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-white/50 text-[10px] font-bold uppercase mb-1">Achieved</div>
              <div className="font-black text-xl text-amber-400">112%</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-white/50 text-[10px] font-bold uppercase mb-1">Points</div>
              <div className="font-black text-xl text-blue-400">2.4k</div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-200">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
            <div>
              <div className="font-black text-amber-900 text-sm uppercase mb-1 tracking-tight">Quarterly Review</div>
              <p className="text-amber-800 text-xs font-medium leading-relaxed">
                Team performance is up by 12.4% compared to last quarter. Individual assessments are scheduled for next week.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTargets;
