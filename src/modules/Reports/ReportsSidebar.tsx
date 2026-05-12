import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { REPORT_TREE } from './reportConfig';

const NAVY = "#1e2a5e";

interface SidebarProps {
  activeReportId: string;
  onSelectReport: (id: string) => void;
}

export default function ReportsSidebar({ activeReportId, onSelectReport }: SidebarProps) {
  const [expandedCats, setExpandedCats] = useState<string[]>(['📊 Sales Reports']);

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <aside className="w-full lg:w-[220px] min-w-[220px] bg-[#1e2a5e] text-white flex-shrink-0 flex flex-col h-full min-h-[80vh]">
      <div className="p-[18px_16px_12px] border-b border-white/10">
        <div className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Vyapari Retail</div>
        <div className="text-[13px] font-semibold text-white mt-0.5">Intelligence Center</div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {REPORT_TREE.map(group => (
          <div key={group.cat} className="mb-2">
            <button 
              onClick={() => toggleCat(group.cat)}
              className="w-full flex justify-between items-center px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors"
            >
              <span>{group.cat.replace(/[^\w\s]/g, '').trim()}</span>
              {expandedCats.includes(group.cat) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            
            <AnimatePresence initial={false}>
              {expandedCats.includes(group.cat) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="py-1">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => onSelectReport(item.id)}
                        className={`w-full text-left px-4 py-2 text-[12.5px] transition-all border-l-3 ${
                          activeReportId === item.id 
                          ? 'bg-white/15 text-white font-semibold border-white' 
                          : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-white/10 opacity-40">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
           <span className="text-[9px] font-bold uppercase tracking-widest">System Ready</span>
        </div>
      </div>
    </aside>
  );
}
