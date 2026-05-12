import React from 'react';
import { Calendar, Trash2, Eye, GitCompare, Download } from 'lucide-react';

export const ScenarioHistory: React.FC = () => {
  const history = [
    { id: 1, name: 'Price Increase Scenario', date: '12 May 2026', risk: 'LOW', impact: '+₹12,800', products: 2 },
    { id: 2, name: 'Festival Season Scenario', date: '10 May 2026', risk: 'LOW', impact: '+₹28,400', products: 5 },
  ];

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-neon" />
          SCENARIO HISTORY
        </h2>
      </div>

      <div className="space-y-4">
        {history.map((scn) => (
          <div key={scn.id} className="group bg-white/5 border border-white/5 p-6 rounded-[2rem] hover:bg-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-white font-bold text-lg mb-1">{scn.name}</h4>
                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">
                  {scn.date} • {scn.products} PRODUCTS
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${scn.risk === 'LOW' ? 'bg-neon/10 text-neon' : 'bg-orange-500/10 text-orange-400'}`}>
                {scn.risk} RISK
              </span>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-2xl font-black text-white">{scn.impact}</span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/10 rounded-xl text-white hover:bg-brand transition-colors"><Eye className="w-4 h-4" /></button>
                <button className="p-2 bg-white/10 rounded-xl text-white hover:bg-brand transition-colors"><GitCompare className="w-4 h-4" /></button>
                <button className="p-2 bg-white/10 rounded-xl text-white hover:bg-brand transition-colors"><Download className="w-4 h-4" /></button>
                <button className="p-2 bg-white/10 rounded-xl text-overdue hover:bg-overdue/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
