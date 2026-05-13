import React, { useMemo } from 'react';
import { useGlobalData } from '../../context/DataContext';
import { motion } from 'motion/react';

export function InventoryHeatmap({ selectedCategory }: { selectedCategory?: string }) {
  const { products, categories } = useGlobalData();

  const categoryStats = useMemo(() => {
    let filteredProducts = products;
    if (selectedCategory && selectedCategory !== 'All') {
      filteredProducts = products.filter(p => p.category === selectedCategory);
    }

    const groups: Record<string, any> = {};
    filteredProducts.forEach(p => {
      const catObj = categories.find(c => c.id === p.category_id);
      const category = catObj?.name || 'General';
      if (!groups[category]) {
        groups[category] = { count: 0, totalStock: 0 };
      }
      groups[category].count++;
      groups[category].totalStock += (p.quantity || p.stock || 0);
    });

    const colors = [
      'from-orange-500 to-amber-400', 
      'from-blue-500 to-sky-400', 
      'from-rose-500 to-pink-400', 
      'from-emerald-500 to-teal-400', 
      'from-violet-500 to-purple-400', 
      'from-pink-500 to-fuchsia-400'
    ];
    const borderColors = [
      'border-orange-500/30',
      'border-blue-500/30',
      'border-rose-500/30',
      'border-emerald-500/30',
      'border-violet-500/30',
      'border-pink-500/30'
    ];
    const glowColors = [
      'shadow-orange-500/10',
      'shadow-blue-500/10',
      'shadow-rose-500/10',
      'shadow-emerald-500/10',
      'shadow-violet-500/10',
      'shadow-pink-500/10'
    ];
    
    return Object.entries(groups).map(([name, stats]: any, i) => {
      const totalStock = stats.totalStock;
      const count = stats.count;
      const velocity = Math.max(0.5, Math.min(3, totalStock / (count * 10 || 1)));
      return {
        name,
        count,
        totalStock,
        velocity: Number(velocity.toFixed(2)),
        colorClass: colors[i % colors.length],
        borderClass: borderColors[i % borderColors.length],
        glowClass: glowColors[i % glowColors.length]
      };
    });
  }, [products, selectedCategory]);

  return (
    <div className="w-full h-full bg-slate-950 p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
      {/* High-Tech Grid Matrix Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto">
        {categoryStats.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-2xl bg-white/5 border ${cat.borderClass} ${cat.glowClass} shadow-lg backdrop-blur-xl hover:bg-white/10 transition-all duration-300 relative group overflow-hidden`}
          >
            {/* Tech Highlight line */}
            <div className={`absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r ${cat.colorClass}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wider">{cat.name}</h4>
                <p className="text-[12px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{cat.count} Unique SKUs</p>
              </div>
              <span className="text-[10px] font-mono text-neon bg-neon/10 px-2 py-0.5 rounded-lg">ID: SEC-0{i+1}</span>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-wider block">Total Stock</span>
                <span className="text-[22px] font-black text-white leading-none tracking-tight">{cat.totalStock.toLocaleString()} units</span>
              </div>

              <div className="text-right">
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-wider block">Velocity</span>
                <span className="text-[22px] font-black text-neon leading-none tracking-tight">{cat.velocity}x</span>
              </div>
            </div>

            {/* Velocity Indicator Bar */}
            <div className="mt-6 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (cat.velocity / 3) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${cat.colorClass}`}
              />
            </div>

            {/* High-Tech status indicator */}
            <div className="mt-4 flex justify-between items-center text-[12px] font-bold text-slate-400">
              <span className="uppercase tracking-wider">Neural Resonance</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>
          </motion.div>
        ))}

        {categoryStats.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-500 font-bold uppercase text-[12px] tracking-[0.3em]">
            No inventory sectors matched.
          </div>
        )}
      </div>
    </div>
  );
}
