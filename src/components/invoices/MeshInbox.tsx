import React, { useState, useEffect } from 'react';
import { Share2, Download, CheckCircle2, XCircle, Info, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { meshService } from '../../services/meshService';

export const MeshInbox: React.FC<{ businessId: string }> = ({ businessId }) => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, [businessId]);

  const loadDrafts = async () => {
    const { data } = await supabase
      .from('peer_drafts')
      .select('*')
      .eq('target_business_id', businessId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    setDrafts(data || []);
    setLoading(false);
  };

  const handleAccept = async (id: string, hybridOptions?: any) => {
    const success = await meshService.acceptPeerDraft(id, businessId, hybridOptions);
    if (success) {
      setDrafts(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <Share2 className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">The Mesh: Incoming</h2>
        </div>
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400 font-mono flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          ZERO-ENTRY ACTIVE
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium">Syncing peer network...</div>
        ) : drafts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center"
          >
            <Info className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No pending peer drafts.</p>
            <p className="text-gray-600 text-xs mt-2">When partners send invoices via Vyapari, they will appear here for one-click entry.</p>
          </motion.div>
        ) : (
          drafts.map((draft) => (
            <MeshDraftCard 
              key={draft.id} 
              draft={draft} 
              onAccept={handleAccept} 
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
};

const MeshDraftCard: React.FC<{
  draft: any;
  onAccept: (id: string, hybridOptions?: any) => Promise<void>;
}> = ({ draft, onAccept }) => {
  const [showHybrid, setShowHybrid] = useState(false);
  const [enableCreditNote, setEnableCreditNote] = useState(false);
  const [creditNoteValue, setCreditNoteValue] = useState(0);
  const [enableTaxEscrow, setEnableTaxEscrow] = useState(false);
  const [taxEscrowValue, setTaxEscrowValue] = useState(0);
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = draft.invoice_data.total_amount || 0;

  // Auto-calculate 18% GST for tax escrow hold if enabled
  useEffect(() => {
    if (enableTaxEscrow) {
      setTaxEscrowValue(Math.round(totalAmount * 0.18));
    } else {
      setTaxEscrowValue(0);
    }
  }, [enableTaxEscrow, totalAmount]);

  const handleAction = async () => {
    setSubmitting(true);
    const options = showHybrid ? {
      isHybrid: true,
      creditNoteValue: enableCreditNote ? Number(creditNoteValue) : 0,
      taxEscrowAmount: enableTaxEscrow ? Number(taxEscrowValue) : 0,
      disputeReason: disputeReason || 'Partial acceptance adjustment'
    } : undefined;

    await onAccept(draft.id, options);
    setSubmitting(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition-all group space-y-4"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">New Incoming Purchase</span>
          <h3 className="text-lg font-bold text-white">{draft.sender_business_name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-mono">INV: {draft.invoice_data.invoice_number}</span>
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            <span>₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHybrid(!showHybrid)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${showHybrid ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'}`}
          >
            Hybrid Options
          </button>
          <button 
            onClick={handleAction}
            disabled={submitting}
            className="p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl transition-all"
            title="Accept & Convert to Purchase"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hybrid Multi-Choice Panels */}
      <AnimatePresence>
        {showHybrid && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 pt-4 space-y-4"
          >
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Configure Layered Sync Actions:
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Partial Acceptance & Credit Note */}
              <div className={`p-4 rounded-2xl border transition-all ${enableCreditNote ? 'bg-white/5 border-indigo-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={enableCreditNote}
                    onChange={(e) => setEnableCreditNote(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-black border-white/10 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Option A: Deduct Credit Note</span>
                </label>
                {enableCreditNote && (
                  <div className="mt-3 space-y-1">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Adjustment Amount (₹)</span>
                    <input 
                      type="number" 
                      value={creditNoteValue}
                      onChange={(e) => setCreditNoteValue(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                      placeholder="Enter adjustment amount"
                    />
                  </div>
                )}
              </div>

              {/* Option B: Tax Escrow Hold */}
              <div className={`p-4 rounded-2xl border transition-all ${enableTaxEscrow ? 'bg-white/5 border-indigo-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={enableTaxEscrow}
                    onChange={(e) => setEnableTaxEscrow(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-black border-white/10 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Option B: Hold Tax in Escrow</span>
                </label>
                {enableTaxEscrow && (
                  <div className="mt-3 space-y-1">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Escrow Amount (₹ - GST 18%)</span>
                    <input 
                      type="number" 
                      value={taxEscrowValue}
                      onChange={(e) => setTaxEscrowValue(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Adjustment Reason */}
            <div className="space-y-1">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Dispute / Adjustment Reason</span>
              <input 
                type="text" 
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. 5 units damaged on arrival"
              />
            </div>
            
            {/* Real-time Result Summary */}
            <div className="p-3 bg-black/30 rounded-2xl border border-white/5 text-[10px] font-mono text-gray-400 flex justify-between items-center">
              <div>
                Purchase Entry: <span className="text-white font-bold">₹{(totalAmount - (enableCreditNote ? creditNoteValue : 0)).toLocaleString()}</span>
              </div>
              <div>
                Credit Note: <span className="text-orange-400 font-bold">₹{(enableCreditNote ? creditNoteValue : 0).toLocaleString()}</span>
              </div>
              <div>
                Escrow: <span className="text-purple-400 font-bold">₹{(enableTaxEscrow ? taxEscrowValue : 0).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 text-[10px] font-mono text-gray-600">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          VERIFIED SENDER
        </div>
        <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap overflow-ellipsis max-w-[150px]">
          HASH: {draft.digital_fingerprint}
        </div>
      </div>
    </motion.div>
  );
};
