import { motion } from 'motion/react';
import { FileText, Send, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface TimelineStep {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  timestamp?: string;
  active?: boolean;
  overdue?: boolean;
}

interface InvoiceTimelineProps {
  createdAt?: string;
  sentAt?: string;
  partialPaidAt?: string;
  paidAt?: string;
  status: string;
  dueDate?: string;
}

function formatStamp(ts?: string | null) {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function InvoiceTimeline({
  createdAt,
  sentAt,
  partialPaidAt,
  paidAt,
  status,
  dueDate,
}: InvoiceTimelineProps) {
  const isOverdue = status === 'pending' && dueDate && new Date(dueDate) < new Date();
  const isPaid = status === 'paid';

  const steps: TimelineStep[] = [
    {
      key: 'created',
      label: 'Created',
      Icon: FileText,
      timestamp: formatStamp(createdAt) ?? undefined,
      active: true,
    },
    {
      key: 'sent',
      label: 'Sent',
      Icon: Send,
      timestamp: formatStamp(sentAt) ?? undefined,
      active: Boolean(sentAt),
      overdue: Boolean(isOverdue && sentAt && !partialPaidAt && !isPaid),
    },
    {
      key: 'partial',
      label: 'Part Paid',
      Icon: DollarSign,
      timestamp: formatStamp(partialPaidAt) ?? undefined,
      active: Boolean(partialPaidAt),
    },
    {
      key: 'paid',
      label: 'Paid',
      Icon: CheckCircle,
      timestamp: formatStamp(paidAt) ?? undefined,
      active: isPaid,
    },
  ];

  return (
    <div className="flex items-start gap-0 w-full overflow-x-auto">
      {steps.map((step, idx) => {
        const Icon = step.Icon;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center min-w-[56px]">
              {/* Circle */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-10 h-10 flex items-center justify-center border-2 relative ${
                  step.active
                    ? 'bg-neon border-ink'
                    : 'bg-ink/5 border-ink/20'
                } ${step.overdue ? 'border-red-500' : ''}`}
              >
                {step.overdue && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
                <Icon
                  size={16}
                  className={step.active ? 'text-ink' : 'text-ink/30'}
                />
              </motion.div>
              {/* Label */}
              <div className={`text-[9px] font-black uppercase tracking-wider mt-1 text-center leading-tight ${
                step.active ? 'text-ink' : 'text-ink/30'
              }`}>
                {step.label}
              </div>
              {/* Timestamp */}
              {step.timestamp && (
                <div className="text-[8px] font-bold text-ink/40 uppercase tracking-tight mt-0.5 text-center leading-tight max-w-[64px]">
                  {step.timestamp}
                </div>
              )}
              {step.overdue && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <AlertCircle size={8} className="text-red-500" />
                  <span className="text-[8px] text-red-500 font-black uppercase">Overdue</span>
                </div>
              )}
            </div>
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-6 mx-1 ${
                steps[idx + 1].active ? 'bg-neon' : 'bg-ink/10'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
