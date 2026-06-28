// ═══════════════════════════════════════════════
// VANI 3.0 — Complete Type System
// ═══════════════════════════════════════════════

export type VANIRole = "user" | "vani";

export type VANIIntent =
  | "NAVIGATE" | "CREATE_INVOICE" | "QUERY_INVOICE" | "PAYMENT_STATUS"
  | "CHECK_STOCK" | "AUTONOMOUS_REORDER" | "QUERY_CUSTOMER" | "SEND_REMINDER"
  | "SMART_DUNNING" | "STRATEGIC_PLAN" | "SHOW_REPORT" | "MARKET_SIMULATION"
  | "ITC_STATUS" | "FRAUD_CHECK" | "CREDIT_RISK" | "LIQUID_INVOICE"
  | "PAYMENT_PORTAL" | "MESH_INBOX" | "BIOMETRIC_ACTION" | "VPOD_VERIFY"
  | "CLARIFY";

export interface VANIParams {
  target_page?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  invoice_id?: string | null;
  invoice_number?: string | null;
  amount?: number | null;
  query?: string | null;
  report_type?: string | null;
  scenario_name?: string | null;
  reminder_message?: string | null;
  settlement_type?: "standard" | "liquid_discount" | "split_installments" | null;
  action_type?: string | null;
  target_resource?: string | null;
  urgency?: "critical" | "high" | "normal" | null;
  clarification_question?: string | null;
  product_ids?: string[];
}

export interface VANIAction {
  intent: VANIIntent;
  confidence: number;
  params: VANIParams;
}

export interface VANIEntityResolution {
  contact: { id: string | null; name: string | null } | null;
  product: { id: string | null; name: string | null } | null;
  invoice: { id: string | null; number: string | null } | null;
}

export interface VANISessionUpdate {
  last_intent: string | null;
  active_entities: string[];
  follow_up_suggested: string | null;
}

export interface VANIResponse {
  reply: string;
  action: VANIAction | null;
  spoken_response: string;
  data_sourced_from: string[];
  entities_resolved: VANIEntityResolution;
  session_update: VANISessionUpdate;
}

export interface VANIMessage {
  id: string;
  role: VANIRole;
  content: string;
  timestamp: Date;
  action?: VANIAction | null;
  isTyping?: boolean;
}

export interface VANIContextData {
  business_name: string;
  business_id: string;
  current_user_role: "owner" | "staff" | "banker";
  products: unknown[];
  invoices: unknown[];
  contacts: unknown[];
  ledger_entries: unknown[];
  conversation_history: { role: string; content: string }[];
  recent_vani_logs: unknown[];
}
