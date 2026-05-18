import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldAlert, CheckCircle, Info, Camera, PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';
import { disputeGuardService, ConflictRisk } from '../../services/disputeGuardService';

export const DisputeGuardBadge: React.FC<{ invoiceId: string }> = ({ invoiceId }) => {
  const [risk, setRisk] = useState<ConflictRisk | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyze();
  }, [invoiceId]);

  const analyze = async () => {
    setLoading(true);
    const result = await disputeGuardService.predictConflict(invoiceId);
    setRisk(result);
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 animate-pulse">
      <div className="w-4 h-4 bg-gray-700 rounded-full" />
      <span className="text-xs text-gray-500 font-medium">Predicting Conflict Risk...</span>
    </div>
  );

  if (!risk) return null;

  const isHighRisk = risk.probability > 60;
  const isMedRisk = risk.probability > 30;

  return (
    <div className="space-y-3">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
          isHighRisk ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
          isMedRisk ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}
      >
        {isHighRisk ? <ShieldAlert className="w-5 h-5" /> : 
         isMedRisk ? <AlertCircle className="w-5 h-5" /> : 
         <CheckCircle className="w-5 h-5" />}
        
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest">Conflict AI: {risk.probability}% Risk</span>
            {isHighRisk && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-black">ACTION REQUIRED</span>}
          </div>
          <p className="text-[11px] font-medium leading-tight mt-0.5 opacity-90">{risk.reason}</p>
        </div>
      </motion.div>

      {(isHighRisk || isMedRisk) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5" />
            <div className="space-y-3 flex-1">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-indigo-300 font-bold">Proactive Fix:</span> {risk.recommendation}
              </p>
              
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] text-white font-bold transition-all border border-white/10">
                  <Camera className="w-3 h-3" /> ATTACH PROOF
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] text-white font-bold transition-all border border-white/10">
                  <PhoneCall className="w-3 h-3" /> LOG CALL
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
