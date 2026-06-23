import { supabase } from "../lib/supabase";
import { vaniService } from "./vaniService";

/**
 * VANI Executor — GOD MODE (Dynamic Action Dispatcher)
 * This executor strictly follows the structured action schema returned by the Master Prompt.
 */
export const vaniExecutor = {
  execute: async (
    response: any,
    businessId: string,
    setActiveModule: (m: string) => void,
    onSuccess?: () => void
  ) => {
    console.log(`[VANI_EXEC] GOD MODE — Intent: ${response.intent}`, response);

    // Handle Multi-Intent Chains
    if (response.is_multi_intent && response.multi_intents && response.multi_intents.length > 0) {
      console.log(`[VANI_EXEC] Sequential Chain: ${response.multi_intents.length} steps`);
      for (const step of response.multi_intents.sort((a: any, b: any) => a.step - b.step)) {
        // Execute each step recursively
        await vaniExecutor.execute({ ...step, is_multi_intent: false }, businessId, setActiveModule);
      }
      
      if (onSuccess) onSuccess();
      return;
    }

    // Safely enforce vani_response
    if (!response.vani_response) {
      if (response.intent === "GREETING") {
        response.vani_response = "Hello! I am VANI. How can I assist you today?";
      } else if (response.intent === "UNKNOWN" || response.intent === "UNCLEAR") {
        response.vani_response = "I'm sorry, I didn't quite catch that. Could you please repeat?";
      } else {
        response.vani_response = `Executing ${response.intent.replace(/_/g, " ")}...`;
      }
    }

    // Visual feedback toast
    window.dispatchEvent(new CustomEvent("app:toast", {
      detail: {
        title: `VANI: ${(response.intent || "Unknown").replace(/_/g, " ")}`,
        message: response.vani_response,
        type: "smart"
      }
    }));

    try {
      // If clarification is needed, speak it and return
      if (response.needs_clarification || response.intent === "UNCLEAR" || response.intent === "CLARIFY") {
        const text = response.clarification_question || response.vani_response;
        if (text) vaniService.speak(text);
        if (onSuccess) onSuccess();
        return;
      }

      // Action Execution Engine
      const action = response.action;
      if (action && action.type !== "NONE") {
        
        // Manual Intent Overrides (To handle prompt/edge function mismatches)
        if (response.intent === "CREATE_INVOICE") {
          window.dispatchEvent(new CustomEvent("app:navigate", { 
            detail: { module: "invoices", props: { mode: "create", prefill: response.params } } 
          }));
        } else if (response.intent === "SHOW_LATEST_INVOICE" || response.intent === "SHOW_INVOICES_BY_CUSTOMER" || response.intent === "QUERY_INVOICE") {
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: { module: "invoices" } }));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("app:invoice-search", { detail: response.params?.customer_name || response.params?.query || "latest" }));
          }, 300);
        } else if (response.intent === "SEND_REMINDER" || response.intent === "SMART_DUNNING" || response.intent === "SCHEDULE_REMINDER") {
          // No global dunning event exists in the app yet, so we route to invoices and filter by the customer to let the user manually trigger
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: { module: "invoices" } }));
          setTimeout(() => {
             window.dispatchEvent(new CustomEvent("app:invoice-search", { detail: response.params?.contact_name || response.params?.customer_name || "" }));
          }, 300);
        } else if (response.intent === "SHOW_LOW_STOCK" || response.intent === "CHECK_STOCK_ITEM" || response.intent === "SHOW_ALL_PRODUCTS" || response.intent === "SHOW_INVENTORY_HEATMAP" || response.intent === "SHOW_FAST_MOVING" || response.intent === "SHOW_DEAD_STOCK") {
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: { module: "inventory" } }));
          if (response.params?.product_name || response.params?.query) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("app:inventory-search", { detail: response.params?.product_name || response.params?.query }));
            }, 300);
          }
        } else if (response.intent === "SHOW_CUSTOMER_PROFILE" || response.intent === "SHOW_TOP_CUSTOMERS" || response.intent === "SHOW_AT_RISK_CUSTOMERS" || response.intent === "SHOW_CUSTOMER_LEDGER" || response.intent === "SHOW_SUPPLIER_LIST") {
          window.dispatchEvent(new CustomEvent("app:navigate", { detail: { module: "contacts" } }));
          if (response.params?.customer_name || response.params?.query) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("app:contact-search", { detail: response.params?.customer_name || response.params?.query }));
            }, 300);
          }
        } else {
          // Normal execution
          if (action.target && action.type === "NAVIGATE") {
            window.dispatchEvent(new CustomEvent("app:navigate", { detail: { module: action.target } }));
          }

          if (action.event) {
            window.dispatchEvent(new CustomEvent(action.event, { detail: action.payload || response.params }));
          } else if (action.type === "OPEN_MODAL" && action.target === "create_invoice_drawer") {
            window.dispatchEvent(new CustomEvent("app:navigate", { detail: { module: "invoices", props: { mode: "create" } } }));
          } else if (action.type === "FETCH" && action.target === "invoices") {
            window.dispatchEvent(new CustomEvent("app:invoice-search", { detail: response.params?.customer_name || response.params?.query }));
          } else if (action.type === "FETCH" && action.target === "inventory") {
            window.dispatchEvent(new CustomEvent("app:inventory-search", { detail: response.params?.product_name || response.params?.query }));
          } else if (action.type === "FETCH" && action.target === "contacts") {
            window.dispatchEvent(new CustomEvent("app:contact-search", { detail: response.params?.customer_name || response.params?.query }));
          } else if (action.type === "CONFIRM_REQUIRED") {
            window.dispatchEvent(new CustomEvent("app:toast", {
              detail: { title: "Confirmation Required", message: response.vani_response, type: "warning" }
            }));
          }
        }
      }

      // Log execution to vani_logs (fire-and-forget)
      supabase.from("vani_logs").insert({
        business_id: businessId,
        transcript: response.transcript || "",
        intent: response.intent || "unknown",
        confidence: response.confidence || 0.9,
        params: response.params || {},
        spoken_response: response.vani_response || "",
        execution_status: "executed",
        was_executed: true
      }).then(() => {}, err => console.warn("Vani log save skipped:", err));

      // ── Proactive Strategic Insight (J.A.R.V.I.S. Protocol) ──
      if (response.followup_suggestions && response.followup_suggestions.length > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("app:toast", {
            detail: {
              title: "Strategic Insight",
              message: response.followup_suggestions[0],
              type: "smart"
            }
          }));
        }, 2500);
      }

      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("[VANI_EXEC] Execution Failure:", err);
    }
  }
};
