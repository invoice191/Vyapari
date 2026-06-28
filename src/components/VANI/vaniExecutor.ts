import type { VANIAction } from "./vani.types";

function dispatch(event: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

export function executeVANIAction(action: VANIAction): void {
  const { intent, params } = action;

  const handlers: Record<string, () => void> = {
    NAVIGATE: () => dispatch("app:navigate", { module: params.target_page }),
    CREATE_INVOICE: () => dispatch("app:open-invoice-drawer", params),
    QUERY_INVOICE: () => { dispatch("app:navigate", { module: "invoices" }); dispatch("app:invoice-search", params.invoice_number ?? params.query); },
    PAYMENT_STATUS: () => { dispatch("app:navigate", { module: "invoices" }); dispatch("app:invoice-search", params.contact_name); },
    CHECK_STOCK: () => { dispatch("app:navigate", { module: "inventory" }); dispatch("app:inventory-search", params.query ?? params.product_name); },
    AUTONOMOUS_REORDER: () => dispatch("app:trigger-reorder", params),
    QUERY_CUSTOMER: () => { dispatch("app:navigate", { module: "contacts" }); dispatch("app:contact-search", params.contact_name); },
    SEND_REMINDER: () => dispatch("app:send-reminder", params),
    SMART_DUNNING: () => dispatch("app:navigate", { module: "dunning" }),
    STRATEGIC_PLAN: () => dispatch("app:navigate", { module: "simulation" }),
    SHOW_REPORT: () => dispatch("app:navigate", { module: params.target_page ?? "reports" }),
    MARKET_SIMULATION: () => dispatch("app:navigate", { module: "simulation" }),
    ITC_STATUS: () => dispatch("app:navigate", { module: "compliance" }),
    FRAUD_CHECK: () => dispatch("app:navigate", { module: "fraud" }),
    CREDIT_RISK: () => { dispatch("app:navigate", { module: "contacts" }); dispatch("app:contact-search", params.contact_name); },
    LIQUID_INVOICE: () => dispatch("app:open-liquid-invoice", params),
    PAYMENT_PORTAL: () => dispatch("app:navigate", { module: "payment-portal" }),
    MESH_INBOX: () => dispatch("app:navigate", { module: "mesh" }),
    BIOMETRIC_ACTION: () => dispatch("app:trigger-biometric", params),
    VPOD_VERIFY: () => { dispatch("app:navigate", { module: "inventory" }); dispatch("app:open-vpod", params); },
  };

  handlers[intent]?.();
}
