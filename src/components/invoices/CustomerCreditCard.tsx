import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CreditStatus {
  contact_name: string;
  outstanding_amount: number;
  credit_limit: number;
  available_credit: number;
  credit_used_pct: number;
  last_invoice_number: string;
  last_invoice_amount: number;
  last_invoice_days_ago: number;
  avg_payment_days: number;
  payment_label: string;
}

interface CustomerCreditCardProps {
  businessId: string;
  contactId: string;
  onViewLedger?: () => void;
}

export default function CustomerCreditCard({ businessId, contactId, onViewLedger }: CustomerCreditCardProps) {
  const [status, setStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId || !contactId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.rpc('get_customer_credit_status', {
          p_business_id: businessId,
          p_contact_id: contactId,
        });
        setStatus(data?.[0] ?? null);
      } catch {
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [businessId, contactId]);

  if (loading) {
    return (
      <div className="border-2 border-ink/20 p-4 animate-pulse bg-ink/5">
        <div className="h-3 bg-ink/20 rounded mb-2 w-1/3" />
        <div className="h-5 bg-ink/20 rounded mb-3 w-2/3" />
        <div className="h-2 bg-ink/10 rounded w-full" />
      </div>
    );
  }

  if (!status) return null;

  const usedPct = Math.min(100, status.credit_used_pct);
  const isOverLimit = status.outstanding_amount > status.credit_limit && status.credit_limit > 0;
  const isNearLimit = usedPct >= 80 && !isOverLimit;
  const borderColor = isOverLimit ? 'border-red-500' : isNearLimit ? 'border-amber-400' : 'border-green-500';
  const bgColor = isOverLimit ? 'bg-red-50' : isNearLimit ? 'bg-amber-50' : 'bg-green-50/50';

  const paymentIcon = status.payment_label === 'Excellent payer' || status.payment_label === 'Good payer'
    ? <CheckCircle size={12} className="text-green-600" />
    : <Clock size={12} className="text-amber-500" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 ${borderColor} ${bgColor} p-5 relative overflow-hidden`}
    >
      {/* Limit exceeded warning */}
      {isOverLimit && (
        <div className="flex items-center gap-2 mb-3 bg-red-500 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
          <AlertTriangle size={12} />
          CREDIT LIMIT EXCEEDED — PROCEED WITH CAUTION
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[9px] font-black text-ink/40 uppercase tracking-[0.2em] mb-0.5">
            Customer Credit Profile
          </div>
          <div className="text-lg font-black tracking-tighter uppercase leading-none">
            {status.contact_name}
          </div>
        </div>
        {onViewLedger && (
          <button
            onClick={onViewLedger}
            className="flex items-center gap-1 text-[9px] font-black uppercase text-neon tracking-wider hover:opacity-70 transition-opacity"
          >
            View Ledger <ExternalLink size={10} />
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-[9px] font-black text-ink/40 uppercase tracking-wider mb-0.5">Outstanding</div>
          <div className={`text-base font-black tracking-tighter ${isOverLimit ? 'text-red-500' : 'text-ink'}`}>
            ₹{status.outstanding_amount.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-black text-ink/40 uppercase tracking-wider mb-0.5">Credit Limit</div>
          <div className="text-base font-black tracking-tighter">
            {status.credit_limit > 0 ? `₹${status.credit_limit.toLocaleString('en-IN')}` : 'No Limit'}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-black text-ink/40 uppercase tracking-wider mb-0.5">Available</div>
          <div className={`text-base font-black tracking-tighter ${isNearLimit ? 'text-amber-500' : 'text-green-600'}`}>
            ₹{Math.max(0, status.available_credit).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Credit Usage Bar */}
      {status.credit_limit > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-[9px] font-black text-ink/40 uppercase mb-1">
            <span>Credit Used</span>
            <span>{usedPct.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-ink/10 border border-ink/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-400' : 'bg-green-500'}`}
            />
          </div>
        </div>
      )}

      {/* Last Invoice + Payment Behaviour */}
      <div className="flex items-center justify-between border-t border-ink/10 pt-3">
        <div className="text-[9px] font-bold text-ink/50 uppercase tracking-tight">
          {status.last_invoice_number
            ? `Last: ${status.last_invoice_number} — ₹${(status.last_invoice_amount || 0).toLocaleString('en-IN')} — ${status.last_invoice_days_ago}d ago`
            : 'No previous invoices'}
        </div>
        {status.avg_payment_days && (
          <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-tight px-2 py-0.5 border ${
            status.payment_label === 'Excellent payer' ? 'border-green-500 text-green-600 bg-green-50' :
            status.payment_label === 'Good payer' ? 'border-green-400 text-green-600 bg-green-50' :
            'border-amber-400 text-amber-600 bg-amber-50'
          }`}>
            {paymentIcon}
            {status.payment_label}
          </div>
        )}
      </div>

      {/* Avg payment days note */}
      {status.avg_payment_days && (
        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-ink/40 uppercase">
          <TrendingUp size={10} />
          Avg payment time: {Math.round(status.avg_payment_days)} days
        </div>
      )}
    </motion.div>
  );
}
