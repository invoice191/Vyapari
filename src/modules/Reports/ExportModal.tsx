import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, FileSpreadsheet, X, CheckCircle, ArrowRight, Sparkles, Printer, FileCode } from 'lucide-react';
import { useReportExport, ExportFormat } from './hooks/useReportExport';
import { useAuth } from '../../hooks/useAuth';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  data: any[];
  columns: string[];
  kpis: any[];
  period: string;
  chartRef?: React.RefObject<HTMLDivElement | null>;
  filtersApplied?: string;
}

export default function ExportModal({ 
  isOpen, 
  onClose, 
  reportTitle, 
  data, 
  columns, 
  kpis, 
  period,
  chartRef,
  filtersApplied
}: ExportModalProps) {
  const { profile } = useAuth();
  const { exporting, handleExport } = useReportExport();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf_executive');

  const onExecuteExport = async () => {
    await handleExport({
      format: selectedFormat,
      reportTitle,
      period,
      businessId: profile?.business_id || '',
      businessName: profile?.business_name || 'Vyapari User',
      gstin: profile?.gstin || 'N/A',
      kpis,
      tableData: data,
      columns,
      filtersApplied: filtersApplied || 'None',
      chartRef
    });
    onClose();
  };

  const formatGroups = [
    {
      label: 'PDF Documents',
      icon: FileText,
      formats: [
        { id: 'pdf_executive' as const, title: 'Executive Summary', desc: 'High-level view with AI insights & charts.' },
        { id: 'pdf_detailed' as const, title: 'Detailed Report', desc: 'Full multi-page audit with all logs.' },
        { id: 'pdf_simple' as const, title: 'Simple Summary', desc: 'Plain language explanation of data.' },
      ]
    },
    {
      label: 'Excel Spreadsheets',
      icon: FileSpreadsheet,
      formats: [
        { id: 'excel_formatted' as const, title: 'Formatted Report', desc: 'Styled sheet with KPIs and totals.' },
        { id: 'excel_pivot' as const, title: 'Pivot-Ready Data', desc: 'Optimized for spreadsheet analysis.' },
        { id: 'excel_raw' as const, title: 'Raw Data Dump', desc: 'Complete extract with full metadata.' },
      ]
    },
    {
      label: 'Other Formats',
      icon: FileCode,
      formats: [
        { id: 'csv' as const, title: 'Universal CSV', desc: 'Standard data portability format.' },
        { id: 'print' as const, title: 'Direct Print', desc: 'Optimized for physical output.' },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col p-10 max-h-[90vh] overflow-y-auto border border-white my-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em] mb-1">Export Intelligence</div>
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">Intelligence Dispatch</h3>
                </div>
              </div>
              <button onClick={onClose} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Selection Grid */}
            <div className="space-y-10 mb-10">
              {formatGroups.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <group.icon size={16} className="text-slate-400" />
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">{group.label}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {group.formats.map(format => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between h-full group ${
                          selectedFormat === format.id 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/20 translate-y-[-2px]' 
                            : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-bold uppercase tracking-widest leading-tight ${selectedFormat === format.id ? 'text-white' : 'text-slate-900'}`}>{format.title}</div>
                          <div className={`text-[10px] font-medium mt-3 leading-relaxed ${selectedFormat === format.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {format.desc}
                          </div>
                        </div>
                        {selectedFormat === format.id && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 self-end">
                            <CheckCircle className="text-white" size={16} />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-4 pt-8 border-t border-slate-100">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-white border border-slate-100 font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={onExecuteExport}
                disabled={exporting}
                className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="animate-pulse">Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <span>Execute {selectedFormat.split('_')[0].toUpperCase()} Dispatch</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

