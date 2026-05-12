import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ledgerService } from '../../services/ledgerService';
import { useGlobalData } from '../../contexts/DataContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  businessId: string;
}

interface Contact {
  id: string;
  name: string;
  type: string;
}

export default function LedgerEntryModal({ isOpen, onClose, onCreated, businessId }: Props) {
  const { refresh } = useGlobalData();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [customEntityName, setCustomEntityName] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingLedger, setSavingLedger] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen && businessId) {
      supabase
        .from('contacts')
        .select('id, name, type')
        .eq('business_id', businessId)
        .order('name')
        .then(({ data }) => {
          setContacts(data || []);
        });
    }
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    setError('');
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    const contact = contacts.find(c => c.id === selectedContactId);
    const entityName = contact ? contact.name : customEntityName.trim();

    if (!entityName) {
      setError('Please select a Customer/Supplier, or type a custom Neural Entity Name.');
      return;
    }

    setSavingLedger(true);
    setSaveStatus('saving');

    try {
      const entry = {
        contact_id: selectedContactId || null,
        entity_name: entityName,
        type,
        amount: finalAmount,
        description: description.trim() || 'Manual Ledger Entry',
        timestamp: new Date().toISOString(), // Match schema column name
      };

      await ledgerService.createEntry(businessId, entry);
      setSaveStatus('success');
      
      // Global refresh
      refresh('ledger_entries');

      setTimeout(() => {
        onCreated();
        onClose();
        // Reset form
        setSelectedContactId('');
        setCustomEntityName('');
        setAmount('');
        setDescription('');
        setSavingLedger(false);
        setSaveStatus('idle');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
      setError(err.message || 'Failed to record entry.');
      setTimeout(() => setSavingLedger(false), 1500);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border-4 border-[#FF5500] shadow-[0_0_40px_rgba(255,85,0,0.25)] rounded-[2rem] overflow-hidden text-white relative"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 bg-slate-950/60 border-b border-slate-800">
            <div>
              <div className="text-[10px] font-black text-[#FF5500] uppercase tracking-[0.3em]">Corporate Ledger Suite</div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Record Ledger Entry</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 border-2 border-slate-800 hover:border-[#FF5500] rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-xs font-bold rounded-2xl uppercase tracking-wider">
                <AlertCircle size={18} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Neural Entity Picker */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Neural Entity <span className="text-[#FF5500]">*</span>
                </label>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Used for credit dunning & CLV mapping
                </span>
              </div>
              <div className="space-y-3">
                <select
                  value={selectedContactId}
                  onChange={e => {
                    setSelectedContactId(e.target.value);
                    if (e.target.value) setCustomEntityName('');
                  }}
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-[#FF5500] p-4 font-black text-xs uppercase tracking-widest rounded-2xl outline-none text-white transition-all"
                >
                  <option value="">— Select Customer/Supplier —</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>

                {!selectedContactId && (
                  <input
                    type="text"
                    placeholder="Or type a custom entity name..."
                    value={customEntityName}
                    onChange={e => setCustomEntityName(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-slate-800 focus:border-[#FF5500] p-4 font-bold text-xs tracking-wide rounded-2xl outline-none text-white transition-all"
                  />
                )}
              </div>
            </div>

            {/* Transaction Type Polarity Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Polarity Modality <span className="text-[#FF5500]">*</span>
                </label>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Impacts cash liquidity calculation
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('credit')}
                  className={`py-4 border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    type === 'credit'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🟢 Credit (Inflow)
                </button>
                <button
                  type="button"
                  onClick={() => setType('debit')}
                  className={`py-4 border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    type === 'debit'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🔴 Debit (Outflow)
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Valuation Valuation <span className="text-[#FF5500]">*</span>
                </label>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  INR Amount required for solvency mapping
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-[#FF5500] pl-10 pr-4 py-4 font-black text-base rounded-2xl outline-none text-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Nomenclature Nomenclature
                </label>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Details for banker auditing
                </span>
              </div>
              <input
                type="text"
                placeholder="Reason or invoice reference description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-800 focus:border-[#FF5500] p-4 font-bold text-xs rounded-2xl outline-none text-white transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 border-2 border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                disabled={savingLedger}
              >
                Cancel Process
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-[#FF5500] hover:bg-[#FF6611] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                disabled={savingLedger}
              >
                {savingLedger ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Commit Entry
              </button>
            </div>
          </form>

          {/* Premium Saving Animation Overlay */}
          <AnimatePresence>
            {savingLedger && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[1300] flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 15 }}
                  className="bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-800 flex flex-col items-center text-center space-y-6"
                >
                  <div className="relative flex items-center justify-center">
                    {saveStatus === 'success' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                      >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    ) : saveStatus === 'error' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20"
                      >
                        <X className="text-white" size={32} />
                      </motion.div>
                    ) : (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute w-20 h-20 bg-[#FF5500]/20 rounded-full"
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                          className="w-14 h-14 border-4 border-[#FF5500] border-t-transparent rounded-full relative z-10 shadow-md"
                        />
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5500]">
                      {saveStatus === 'success' ? 'Entry Committed!' : saveStatus === 'error' ? 'Failed to Save' : 'Syncing with Ledger'}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                      {saveStatus === 'success' 
                        ? `Transaction successfully recorded!` 
                        : saveStatus === 'error'
                        ? `Please check your inputs`
                        : `Saving Ledger Entry...`}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
