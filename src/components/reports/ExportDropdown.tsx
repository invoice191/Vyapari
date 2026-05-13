import { useState, useEffect } from 'react';
import { 
  Download, FileText, FileSpreadsheet, FileCode, Printer, 
  ChevronDown, Calendar, Mail, Share2, Eye, Clock, Phone,
  Check, Columns, AlertCircle, Copy, AlertTriangle, Sparkles
} from 'lucide-react';
import { useReportExport, ExportFormat } from '../../modules/Reports/hooks/useReportExport';
import { toast } from 'sonner';

interface ExportDropdownProps {
  reportTitle: string;
  data: any[];
  columns: string[];
  kpis: any[];
  period: string;
  chartRef?: React.RefObject<HTMLDivElement | null>;
  filtersApplied?: string;
  businessId: string;
  businessName: string;
  gstin: string;
}

export default function ExportDropdown({
  reportTitle,
  data,
  columns,
  kpis,
  period,
  chartRef,
  filtersApplied,
  businessId,
  businessName,
  gstin
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleFreq, setScheduleFreq] = useState('weekly');
  const [isColumnChooserOpen, setIsColumnChooserOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns);
  const { exporting, handleExport } = useReportExport();

  useEffect(() => {
    const saved = localStorage.getItem(`cols_${reportTitle.toLowerCase().replace(/\s+/g, '_')}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedColumns(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [reportTitle, columns]);

  const toggleColumn = (col: string) => {
    const updated = selectedColumns.includes(col)
      ? selectedColumns.filter(c => c !== col)
      : [...selectedColumns, col];
    setSelectedColumns(updated);
    localStorage.setItem(`cols_${reportTitle.toLowerCase().replace(/\s+/g, '_')}`, JSON.stringify(updated));
  };

  const onExecuteExport = async (format: ExportFormat) => {
    setIsOpen(false);
    const id = toast.loading(`Synthesizing ${reportTitle} ${format.split('_')[0].toUpperCase()} report...`);
    try {
      await handleExport({
        format,
        reportTitle,
        period,
        businessId,
        businessName,
        gstin,
        kpis,
        tableData: data,
        columns: selectedColumns,
        filtersApplied: filtersApplied || 'None',
        chartRef
      });
      toast.success(`- Downloaded as ${reportTitle.toLowerCase().replace(/\s+/g, '_')}`, { id });
      
      const historyKey = 'vyapari_report_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const newEntry = {
        id: crypto.randomUUID(),
        title: reportTitle,
        format,
        timestamp: new Date().toLocaleString(),
      };
      localStorage.setItem(historyKey, JSON.stringify([newEntry, ...history].slice(0, 20)));
      window.dispatchEvent(new Event('report_history_updated'));

    } catch (err: any) {
      toast.error(`- Export failed: ${err?.message || 'Server error'}`, {
        id,
        action: {
          label: 'Retry',
          onClick: () => onExecuteExport(format)
        }
      });
    }
  };

  const handleShareLink = () => {
    const mockShareLink = `https://vyapari.co/share/report/${businessId}/${crypto.randomUUID().slice(0, 8)}?exp=24h`;
    navigator.clipboard.writeText(mockShareLink);
    toast.success('- Generated 24hr shareable link & copied to clipboard!');
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleEmail) return;
    toast.success(`- Scheduled ${scheduleFreq} reports for ${scheduleEmail}!`);
    setIsScheduleOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      {/* Outer Button: Premium styled to avoid blending */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-8 py-3.5 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border-2 border-indigo-500 hover:border-indigo-400 hover:shadow-indigo-500/20 shadow-[0_10px_30px_rgba(79,70,229,0.15)] transition-all duration-300 active:scale-95 z-10"
      >
        <Sparkles size={12} className="text-neon animate-pulse" />
        <span>EXPORT MATRIX</span>
        <ChevronDown size={12} className={`transition-transform duration-500 ${isOpen ? 'rotate-180 text-neon' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {/* Dropdown Container: Highly detailed glassmorphic aesthetic */}
          <div className="absolute right-0 mt-3 w-80 rounded-[2rem] bg-slate-950/95 border-2 border-white/10 backdrop-blur-xl text-slate-300 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-3 duration-300">
            
            {/* Top decorative glow */}
            <div className="absolute -top-10 left-10 w-32 h-10 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

            {/* PDF SECTION */}
            <div className="mb-5">
              <div className="px-3 py-2 text-[8px] font-black uppercase text-indigo-400 tracking-[0.25em] border-b border-white/5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><FileText size={10} className="text-indigo-400" /> PDF Branded Layouts</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              </div>
              <div className="mt-3 space-y-1.5">
                <button
                  onClick={() => onExecuteExport('pdf_executive')}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-indigo-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-indigo-500/30 flex items-center justify-between group"
                >
                  <span>-- PDF - Executive</span>
                  <span className="text-[7px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-black tracking-widest group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">AI INSIGHTS</span>
                </button>
                <button
                  onClick={() => onExecuteExport('pdf_detailed')}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-indigo-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-indigo-500/30 flex items-center justify-between"
                >
                  <span>-- PDF - Detailed</span>
                  <span className="text-[7px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-black tracking-widest">ALL COLS</span>
                </button>
                <button
                  onClick={() => onExecuteExport('pdf_simple')}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-indigo-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-indigo-500/30"
                >
                  <span>-- PDF - Print-Ready (Simple)</span>
                </button>
              </div>
            </div>

            {/* SPREADSHEETS */}
            <div className="mb-5">
              <div className="px-3 py-2 text-[8px] font-black uppercase text-emerald-400 tracking-[0.25em] border-b border-white/5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><FileSpreadsheet size={10} className="text-emerald-400" /> Spreadsheets & CSV</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-3 space-y-1.5">
                <button
                  onClick={() => onExecuteExport('excel_formatted')}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-emerald-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-emerald-500/30 flex items-center justify-between group"
                >
                  <span>-- Excel Workbook (.xlsx)</span>
                  <span className="text-[7px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-black tracking-widest group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">EXCEL</span>
                </button>
                <button
                  onClick={() => onExecuteExport('csv')}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-emerald-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-emerald-500/30"
                >
                  <span>-- CSV Extract (UTF-8 BOM)</span>
                </button>
              </div>
            </div>

            {/* INTERACTIONS */}
            <div>
              <div className="px-3 py-2 text-[8px] font-black uppercase text-amber-400 tracking-[0.25em] border-b border-white/5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Eye size={10} className="text-amber-400" /> Actions & Customizer</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <div className="mt-3 space-y-1.5">
                <button
                  onClick={() => onExecuteExport('print')}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-amber-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-amber-500/30 flex items-center gap-2"
                >
                  <Printer size={12} className="text-neon" />
                  <span>--- Open Print Preview</span>
                </button>
                <button
                  onClick={() => setIsColumnChooserOpen(true)}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-indigo-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-indigo-500/30 flex items-center gap-2"
                >
                  <Columns size={12} className="text-blue-400" />
                  <span>-- Column Chooser</span>
                </button>
                <button
                  onClick={handleShareLink}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-purple-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-purple-500/30 flex items-center gap-2"
                >
                  <Share2 size={12} className="text-purple-400" />
                  <span>-- Shareable Link (24hr)</span>
                </button>
                <button
                  onClick={() => setIsScheduleOpen(true)}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-wider bg-white/[0.02] hover:bg-amber-600/20 rounded-xl hover:text-white transition-all duration-300 border border-white/5 hover:border-amber-500/30 flex items-center gap-2"
                >
                  <Mail size={12} className="text-amber-400" />
                  <span>-- Schedule Dispatch</span>
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* COLUMN CHOOSER MODAL with Premium Details */}
      {isColumnChooserOpen && (
        <div className="fixed inset-0 z-[1200] flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border-2 border-white/10 rounded-[2.5rem] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] text-slate-200 relative overflow-hidden my-auto">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-neon" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Columns size={18} className="text-indigo-400" /> Isolate Columns
                </h4>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Isolate specific data series to render in export</p>
              </div>
              <button onClick={() => setIsColumnChooserOpen(false)} className="text-slate-400 hover:text-white text-[10px] font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all">CLOSE</button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {columns.map(col => (
                <label key={col} className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-white/5 hover:border-indigo-500/20 group">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">{col}</span>
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                    className="accent-neon w-5 h-5 rounded-lg border-2 border-white/20 bg-transparent transition-all cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={() => setIsColumnChooserOpen(false)}
              className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl transition-all border border-indigo-400 shadow-xl"
            >
              Apply Column Selection
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL with Premium Details */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-[1200] flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <form onSubmit={handleScheduleSubmit} className="w-full max-w-md bg-slate-900 border-2 border-white/10 rounded-[2.5rem] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] text-slate-200 relative overflow-hidden my-auto">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Mail size={18} className="text-amber-400" /> Automate Dispatch
                </h4>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Configure automated AI intelligence deliveries</p>
              </div>
              <button type="button" onClick={() => setIsScheduleOpen(false)} className="text-slate-400 hover:text-white text-[10px] font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all">CLOSE</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2.5">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="accountant@business.com"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  className="w-full bg-white/[0.02] border-2 border-white/10 rounded-2xl px-4 py-3.5 text-xs font-black tracking-wider outline-none focus:border-amber-500 focus:bg-slate-950 transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2.5">Delivery Frequency</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['daily', 'weekly', 'monthly'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setScheduleFreq(f)}
                      className={`py-3 text-[9px] font-black uppercase tracking-widest rounded-2xl border-2 transition-all ${
                        scheduleFreq === f 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10' 
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl transition-all border border-amber-300 shadow-xl"
            >
              Activate Automated Schedule
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
