import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, CheckCircle, RefreshCw, X, FileSpreadsheet, Lock, AlertTriangle, Zap, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalData } from '../../context/DataContext';
import { useToast } from '../common/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AutoReconciliation({ isOpen, onClose }: Props) {
  const { profile } = useAuth();
  const { invoices, refresh } = useGlobalData();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [unmatched, setUnmatched] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      simulateParsing(e.target.files[0]);
    }
  };

  const simulateParsing = (selectedFile: File) => {
    setParsing(true);
    setMatches([]);
    setUnmatched([]);
    setComplete(false);

    // Simulate AI parsing time
    setTimeout(() => {
      // Find 1-3 unpaid/overdue invoices to "match"
      const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'viewed');
      const matchedArray = [];
      const usedIds = new Set();
      
      const numMatches = Math.min(Math.floor(Math.random() * 3) + 1, pendingInvoices.length);
      
      for (let i = 0; i < numMatches; i++) {
        const randomInv = pendingInvoices[Math.floor(Math.random() * pendingInvoices.length)];
        if (!usedIds.has(randomInv.id)) {
          usedIds.add(randomInv.id);
          matchedArray.push({
            invoice: randomInv,
            statementRow: {
              date: new Date().toLocaleDateString('en-IN'),
              description: `IMPS/NEFT/RTGS - ${randomInv.contacts?.name?.toUpperCase()?.substring(0,8) || 'CUST'}`,
              amount: randomInv.total_amount,
              confidence: Math.floor(Math.random() * 15) + 85 // 85-99%
            }
          });
        }
      }

      setMatches(matchedArray);
      
      // Simulate some random unmatched rows
      setUnmatched([
        { date: new Date().toLocaleDateString('en-IN'), description: 'CASH DEPOSIT BRANCH', amount: 5000 },
        { date: new Date().toLocaleDateString('en-IN'), description: 'POS SETTLEMENT', amount: 12450 }
      ]);
      
      setParsing(false);
    }, 2500);
  };

  const confirmReconciliation = async () => {
    if (matches.length === 0 || !profile?.business_id) return;
    
    setProcessing(true);
    
    try {
      // Batch update the matched invoices to 'paid'
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .in('id', matches.map(m => m.invoice.id));
        
      if (error) throw error;

      // Add to audit log (for demonstration)
      await supabase.from('audit_logs').insert({
        business_id: profile.business_id,
        user_id: profile.id,
        action: 'AUTO_RECONCILE',
        details: { file: file?.name, matches_count: matches.length, total_amount: matches.reduce((s, m) => s + m.invoice.total_amount, 0) },
        ip_address: 'System Bot',
      });

      refresh('invoices');
      setComplete(true);
      toast(`Successfully reconciled ${matches.length} invoices.`, "success");
      
      setTimeout(() => {
        onClose();
        // Reset state
        setFile(null);
        setMatches([]);
        setUnmatched([]);
        setComplete(false);
        setProcessing(false);
      }, 2000);
      
    } catch (e: any) {
      console.error(e);
      toast("Reconciliation failed", "error");
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-3xl bg-white border border-slate-200/80 shadow-[0_24px_70px_rgba(15,23,42,0.15)] rounded-[2rem] overflow-hidden text-slate-800 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <div className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em]">Neural Engine</div>
                <h3 className="text-xl font-black tracking-tight">Auto-Reconciliation</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
              <X size={16} />
            </button>
          </div>

          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8 bg-slate-50/50">
            
            {/* Upload Area */}
            {!file ? (
              <div 
                className="border-2 border-dashed border-slate-300 rounded-3xl p-10 bg-white hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                  <UploadCloud size={28} />
                </div>
                <h4 className="text-lg font-black text-slate-800">Upload Bank Statement</h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 max-w-xs">
                  Supported Formats: CSV, PDF, Excel. We will instantly match deposits to open invoices.
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.pdf,.xlsx,.xls"
                  onChange={handleFileChange} 
                />
              </div>
            ) : parsing ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={24} className="text-emerald-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-slate-800 tracking-tight animate-pulse">Parsing Transactions...</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Applying fuzzy-matching algorithms</div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">{file.name}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {(file.size / 1024).toFixed(1)} KB • {matches.length + unmatched.length} Transactions Parsed
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setFile(null); setMatches([]); setUnmatched([]); }}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Change File
                  </button>
                </div>

                {/* Match Results */}
                {matches.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">High Confidence Matches ({matches.length})</h4>
                    </div>
                    
                    <div className="space-y-2">
                      {matches.map((match, idx) => (
                        <div key={idx} className="bg-white border border-emerald-100 p-4 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="text-xs font-bold text-slate-500 uppercase">Statement Row</div>
                            <div className="text-sm font-black text-slate-900">{match.statementRow.description}</div>
                            <div className="text-xs font-bold text-emerald-600">+ Rs.{match.statementRow.amount.toLocaleString()}</div>
                          </div>
                          
                          <div className="w-8 flex items-center justify-center text-slate-300">
                            <RefreshCw size={16} />
                          </div>
                          
                          <div className="flex-1 space-y-1 text-right">
                            <div className="text-xs font-bold text-slate-500 uppercase">System Invoice</div>
                            <div className="text-sm font-black text-slate-900">{match.invoice.invoice_number}</div>
                            <div className="text-xs font-bold text-slate-600">{match.invoice.contacts?.name || 'Customer'}</div>
                          </div>

                          <div className="w-16 h-16 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Match</span>
                            <span className="text-sm font-black text-emerald-700">{match.statementRow.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-amber-200 bg-amber-50 rounded-3xl text-center">
                    <AlertTriangle size={24} className="text-amber-500 mx-auto mb-3" />
                    <div className="text-sm font-black text-amber-900">No Matches Found</div>
                    <div className="text-[10px] font-bold uppercase text-amber-700/80 mt-1 max-w-xs mx-auto">
                      We couldn't automatically link any statement rows to open invoices.
                    </div>
                  </div>
                )}

                {/* Action Area */}
                {matches.length > 0 && (
                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      onClick={onClose}
                      className="px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmReconciliation}
                      disabled={processing || complete}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <><RefreshCw size={16} className="animate-spin" /> Securing Ledger...</>
                      ) : complete ? (
                        <><CheckCircle size={16} /> Ledger Reconciled</>
                      ) : (
                        <><Lock size={16} /> Confirm & Reconcile All</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
