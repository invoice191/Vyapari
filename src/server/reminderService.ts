export type CollectibleInvoiceStatus = "Pending" | "Paid" | "Overdue" | "Cancelled";

export interface ReminderCandidate {
  reminderId: string;
  invoiceId: string;
  contactId?: string | null;
  customerName: string;
  phone?: string | null;
  dueDate: string;
  amount: number;
  status: CollectibleInvoiceStatus;
  reminderEnabled: boolean;
  reminderCount: number;
  lastReminderSentAt?: string | null;
  nextReminderAt?: string | null;
}

export interface ReminderDecision {
  eligible: boolean;
  reason:
    | "ready"
    | "disabled"
    | "not_collectible"
    | "not_due"
    | "missing_phone"
    | "invalid_phone"
    | "waiting_for_next_window";
  normalizedPhone?: string;
  derivedStatus: CollectibleInvoiceStatus;
}

export interface ReminderDispatch {
  reminderId: string;
  invoiceId: string;
  contactId?: string | null;
  phone: string;
  message: string;
  amount: number;
  customerName: string;
  dueDate: string;
  reminderCount: number;
}

const MS_PER_HOUR = 60 * 60 * 1000;
const INDIA_COUNTRY_CODE = "+91";

export function deriveInvoiceStatus(
  status: CollectibleInvoiceStatus,
  dueDate: string,
  now: Date = new Date()
) {
  if (status === "Paid" || status === "Cancelled") {
    return status;
  }

  const dueAt = new Date(`${dueDate}T23:59:59.999Z`);
  return dueAt.getTime() < now.getTime() ? "Overdue" : "Pending";
}

export function normalizePhoneNumber(phone?: string | null) {
  if (!phone) return null;

  const trimmed = phone.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${INDIA_COUNTRY_CODE}${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (trimmed.startsWith("+") && digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export function getNextReminderAt(sentAt: Date, intervalHours: number) {
  return new Date(sentAt.getTime() + intervalHours * MS_PER_HOUR).toISOString();
}

export function evaluateReminderCandidate(
  candidate: ReminderCandidate,
  now: Date = new Date(),
  intervalHours: number = 24
): ReminderDecision {
  const derivedStatus = deriveInvoiceStatus(candidate.status, candidate.dueDate, now);

  if (!candidate.reminderEnabled) {
    return { eligible: false, reason: "disabled", derivedStatus };
  }

  if (derivedStatus === "Paid" || derivedStatus === "Cancelled") {
    return { eligible: false, reason: "not_collectible", derivedStatus };
  }

  const dueAt = new Date(`${candidate.dueDate}T23:59:59.999Z`);
  if (dueAt.getTime() >= now.getTime()) {
    return { eligible: false, reason: "not_due", derivedStatus };
  }

  if (!candidate.phone?.trim()) {
    return { eligible: false, reason: "missing_phone", derivedStatus };
  }

  const normalizedPhone = normalizePhoneNumber(candidate.phone);
  if (!normalizedPhone) {
    return { eligible: false, reason: "invalid_phone", derivedStatus };
  }

  const nextAllowedAt = candidate.nextReminderAt
    ? new Date(candidate.nextReminderAt)
    : candidate.lastReminderSentAt
      ? new Date(getNextReminderAt(new Date(candidate.lastReminderSentAt), intervalHours))
      : null;

  if (nextAllowedAt && nextAllowedAt.getTime() > now.getTime()) {
    return { eligible: false, reason: "waiting_for_next_window", derivedStatus, normalizedPhone };
  }

  return { eligible: true, reason: "ready", derivedStatus, normalizedPhone };
}

export function buildReminderMessage(candidate: Pick<ReminderCandidate, "customerName" | "invoiceId" | "amount" | "dueDate">) {
  const amountLabel = candidate.amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  return `Hello ${candidate.customerName}, your payment for invoice ${candidate.invoiceId} of Rs. ${amountLabel} was due on ${candidate.dueDate}. Please pay as soon as possible. Ignore this message if you have already paid.`;
}

export function createReminderDispatches(
  candidates: ReminderCandidate[],
  now: Date = new Date(),
  intervalHours: number = 24
) {
  return candidates.reduce<ReminderDispatch[]>((dispatches, candidate) => {
    const decision = evaluateReminderCandidate(candidate, now, intervalHours);
    if (!decision.eligible || !decision.normalizedPhone) {
      return dispatches;
    }

    dispatches.push({
      reminderId: candidate.reminderId,
      invoiceId: candidate.invoiceId,
      contactId: candidate.contactId,
      phone: decision.normalizedPhone,
      message: buildReminderMessage(candidate),
      amount: candidate.amount,
      customerName: candidate.customerName,
      dueDate: candidate.dueDate,
      reminderCount: candidate.reminderCount,
    });
    return dispatches;
  }, []);
}
