import { supabase } from "../lib/supabase";
import { vaniService } from "./vaniService";
import { smsService } from "./smsService";

/**
 * Races any Supabase database query against a timeout so the UI never blocks.
 */
const queryWithTimeout = async (promise: PromiseLike<any>, timeoutMs = 800) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
  ]).catch(err => {
    console.warn("DB Query timed out or failed, using local parameters:", err);
    return { data: null };
  });
};

/** Fire a global navigation event and sync the active module state */
const navigateTo = (module: string, setActiveModule: (m: string) => void, props?: object) => {
  setActiveModule(module);
  window.dispatchEvent(new CustomEvent("app:navigate", { detail: { module, ...(props || {}) } }));
};

/**
 * VANI Executor — GOD MODE
 * Maps all 21 AI intents to frontend Neural Event Bus actions, DB writes, and third-party APIs.
 */
export const vaniExecutor = {
  execute: async (
    response: any,
    businessId: string,
    setActiveModule: (m: string) => void,
    onSuccess?: () => void
  ) => {
    const { intent, params, actions } = response;
    console.log(`[VANI_EXEC] GOD MODE — Intent: ${intent}`, { params, actions });

    // Handle Multi-Action Chains
    if (actions && actions.length > 0) {
      console.log(`[VANI_EXEC] Sequential Chain: ${actions.length} steps`);
      for (const action of actions.sort((a: any, b: any) => a.sequence - b.sequence)) {
        await vaniExecutor.execute({ intent: action.type, params: action.params }, businessId, setActiveModule);
      }
      if (onSuccess) onSuccess();
      return;
    }

    // Visual feedback toast
    window.dispatchEvent(new CustomEvent("app:toast", {
      detail: {
        title: `VANI: ${intent.replace(/_/g, " ")}`,
        message: response.spoken_response || "Processing autonomous request...",
        type: "smart"
      }
    }));

    try {
      switch (intent) {
        case "NAVIGATE":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: params?.target_page }));
          break;
        case "CREATE_INVOICE":
          window.dispatchEvent(new CustomEvent("app:open-invoice-drawer", { detail: params }));
          break;
        case "CHECK_STOCK":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "inventory" }));
          window.dispatchEvent(new CustomEvent("app:inventory-search", { detail: params?.query }));
          break;
        case "QUERY_CUSTOMER":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "contacts" }));
          window.dispatchEvent(new CustomEvent("app:contact-search", { detail: params?.contact_name }));
          break;
        case "SEND_REMINDER":
          window.dispatchEvent(new CustomEvent("app:send-reminder", { detail: params }));
          break;
        case "AUTONOMOUS_REORDER":
          window.dispatchEvent(new CustomEvent("app:trigger-reorder", { detail: params }));
          break;
        case "STRATEGIC_PLAN":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "simulation" }));
          break;
        case "SHOW_REPORT":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "reports" }));
          break;
        case "ITC_STATUS":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "compliance" }));
          break;
        case "FRAUD_CHECK":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "fraud" }));
          break;
        case "CREDIT_RISK":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "contacts" }));
          break;
        case "LIQUID_INVOICE":
          window.dispatchEvent(new CustomEvent("app:open-liquid-invoice", { detail: params }));
          break;
        case "MESH_INBOX":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "mesh" }));
          break;
        case "BIOMETRIC_ACTION":
          window.dispatchEvent(new CustomEvent("app:trigger-biometric", { detail: params }));
          break;
        case "MARKET_SIMULATION":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "simulation" }));
          break;
        case "PAYMENT_PORTAL":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "payment-portal" }));
          break;
        case "PAYMENT_STATUS":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "invoices" }));
          window.dispatchEvent(new CustomEvent("app:invoice-search", { detail: params?.contact_name }));
          break;
        case "QUERY_INVOICE":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "invoices" }));
          window.dispatchEvent(new CustomEvent("app:invoice-search", { detail: params?.invoice_number ?? params?.query }));
          break;
        case "VPOD_VERIFY":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "inventory" }));
          window.dispatchEvent(new CustomEvent("app:open-vpod", { detail: params }));
          break;
        case "SMART_DUNNING":
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: "dunning" }));
          break;
        case "CLARIFY":
          if (params?.clarification_question || response.spoken_response) {
            vaniService.speak(params?.clarification_question ?? response.spoken_response);
          }
          if (onSuccess) onSuccess();
          return;
        default:
          console.warn(`[VANI_EXEC] No route defined for intent: ${intent}`);
      }

      if (response.spoken_response) {
        vaniService.speak(response.spoken_response);
      }

      // ── Log execution to vani_logs (fire-and-forget) ──
      supabase.from("vani_logs").insert({
        business_id: businessId,
        transcript: response.transcript || "",
        intent: intent || "unknown",
        confidence: response.confidence || 0.9,
        params: params || {},
        spoken_response: response.spoken_response || "",
        execution_status: "executed",
        was_executed: true
      }).then(() => {}, err => console.warn("Vani log save skipped:", err));

      // ── Proactive Strategic Insight (J.A.R.V.I.S. Protocol) ──
      if (response.proactive_note) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("app:toast", {
            detail: {
              title: "Strategic Insight",
              message: response.proactive_note,
              type: "smart"
            }
          }));
        }, 2000);
      }

      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("[VANI_EXEC] Execution Failure:", err);
    }
  }
};
