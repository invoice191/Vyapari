import { supabase } from "../lib/supabase";
import { vaniService } from "./vaniService";
import { smsService } from "./smsService";

/**
 * Races any Supabase database query against a timeout so the UI never blocks.
 */
const queryWithTimeout = async (promise: Promise<any>, timeoutMs = 800) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
  ]).catch(err => {
    console.warn("DB Query timed out or failed, using local parameters:", err);
    return { data: null };
  });
};

/**
 * VANI Executor
 * Maps recognized AI intents to frontend application actions, databases, and third-party APIs.
 */
export const vaniExecutor = {
  execute: async (
    response: any, 
    businessId: string, 
    setActiveModule: (m: string) => void,
    onSuccess?: () => void
  ) => {
    const { intent, params, actions } = response;
    console.log(`[VANI_EXEC] Executing Intent: ${intent}`, { params, actions });

    // Handle Multi-Action Chains if present
    if (actions && actions.length > 0) {
      console.log(`[VANI_EXEC] Sequential Chain detected: ${actions.length} steps`);
      for (const action of actions.sort((a: any, b: any) => a.sequence - b.sequence)) {
        await vaniExecutor.execute({ intent: action.type, params: action.params }, businessId, setActiveModule);
      }
      if (onSuccess) onSuccess();
      return;
    }

    // Provide visual feedback
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: {
        title: `VANI: ${intent.replace('_', ' ')}`,
        message: response.summary_card?.subtitle || "Processing autonomous request...",
        type: 'smart'
      }
    }));

    try {
      switch (intent) {
        // ... (existing cases: NAVIGATE, CREATE_INVOICE, CHECK_STOCK, RUN_REPORT, SEND_REMINDER, GET_BRIEFING, CREATE_PURCHASE_ORDER, WHATSAPP_SEND) ...
        case 'NAVIGATE': {
          const targetModule = (params?.target || params?.module || '').toLowerCase().trim();
          if (targetModule) {
            console.log(`[VANI_EXEC] Navigating to: ${targetModule}`);
            
            // Map common aliases if the brain missed them
            const mappedTarget = targetModule === 'bill' || targetModule === 'billing' ? 'invoices' :
                               targetModule === 'stock' ? 'inventory' :
                               targetModule === 'khata' ? 'ledger' :
                               targetModule === 'tips' || targetModule === 'dss' ? 'dss' :
                               targetModule === 'simulation' || targetModule === 'prediction' ? 'prediction' :
                               targetModule === 'negotiator' || targetModule === 'negotiation' || targetModule === 'agent' ? 'purchases' :
                               targetModule === 'dunning' || targetModule === 'recovery' ? 'autopilot' :
                               targetModule;

            setActiveModule(mappedTarget);
            
            // For complex modules, trigger additional UI setup via events
            if (mappedTarget === 'pos') {
              window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'pos' } }));
            } else if (mappedTarget === 'autopilot') {
              window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'autopilot', props: { subview: targetModule === 'dunning' || targetModule === 'recovery' ? 'dunning' : 'main' } } }));
            } else if (mappedTarget === 'purchases') {
              window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'purchases', props: { tab: targetModule === 'negotiator' || targetModule === 'negotiation' || targetModule === 'agent' ? 'agent' : 'orders' } } }));
            }
          }
          break;
        }

        case 'CREATE_INVOICE': {
          let contactId = null;
          if (params?.contact_name) {
            const { data: contact } = await queryWithTimeout(
              supabase.from('contacts').select('id').eq('business_id', businessId).ilike('name', `%${params.contact_name}%`).limit(1).maybeSingle()
            );
            if (contact) contactId = contact.id;
          }

          const resolvedItems = await Promise.all((params?.items || []).map(async (item: any) => {
            const { data: prod } = await queryWithTimeout(
              supabase.from('products').select('id, name, selling_price').eq('business_id', businessId).ilike('name', `%${item.name}%`).limit(1).maybeSingle()
            );
            return { 
              product_id: prod?.id || null, 
              product_name: prod?.name || item.name, 
              quantity: item.qty || 1, 
              unit_price: item.price || prod?.selling_price || 0, 
              unit: 'pcs' 
            };
          }));

          console.log(`[VANI_EXEC] Prefilling invoice for: ${params.contact_name}`);
          window.dispatchEvent(new CustomEvent('app:navigate', { 
            detail: { 
              module: 'invoices', 
              props: { 
                mode: 'create', 
                prefill: { 
                  contact_id: contactId, 
                  contact_name: params.contact_name, 
                  items: resolvedItems, 
                  total: params.total || 0 
                }
              }
            }
          }));
          setActiveModule('invoices');
          break;
        }

        case 'CHECK_STOCK': {
          const { data: products } = await queryWithTimeout(
            supabase.from('products').select('*').eq('business_id', businessId).ilike('name', `%${params?.product_name || ''}%`)
          );
          if (products && products.length > 0) {
            setActiveModule('inventory');
            // Allow time for component mount if needed
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('app:inventory-search', { detail: { query: params.product_name } }));
            }, 100);
          } else {
            vaniService.speak(`I couldn't find ${params?.product_name || 'the item'} in your stock.`);
          }
          break;
        }

        case 'STRATEGIC_PLAN': {
          setActiveModule('dashboard');
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: {
              title: "Strategic Advisor Active",
              message: `Analyzing roadmap for: ${params.goal || 'Growth'}. Checking historical trends...`,
              type: 'smart'
            }
          }));
          
          setTimeout(() => {
            setActiveModule('prediction'); // Changed from 'reports' to 'prediction' for what-if lab
            window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'prediction', props: { mode: 'strategic', goal: params.goal }}}));
          }, 1500);
          break;
        }

        case 'RUN_REPORT': {
          const reportType = params?.report_type || 'sales';
          window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'reports', props: { mode: 'view', type: reportType }}}));
          setActiveModule('reports');
          break;
        }

        case 'SEND_REMINDER': {
          let contactId = null;
          let phone = '';
          if (params?.contact_name) {
            const { data: contact } = await queryWithTimeout(
              supabase.from('contacts').select('id, phone').eq('business_id', businessId).ilike('name', `%${params.contact_name}%`).limit(1).maybeSingle()
            );
            if (contact) {
              contactId = contact.id;
              phone = contact.phone;
            }
          }

          // Insert is async, so we do it in a non-blocking way!
          queryWithTimeout(
            supabase.from('reminders').insert({
              business_id: businessId,
              contact_id: contactId,
              message: `Payment reminder for ${params.contact_name || 'Customer'} - Amount: ₹${params.amount || 0}`,
              remind_at: params.date || new Date(Date.now() + 1000 * 60 * 60).toISOString(),
              status: 'pending'
            })
          );
          
          if (phone) {
            smsService.sendMessage({
              phone: phone,
              message: `Dear ${params.contact_name || 'Customer'}, this is a reminder for payment of ₹${params.amount || 0}. Team Vyapari.`,
              type: 'whatsapp',
              referenceType: 'system'
            }).catch(e => console.warn("WhatsApp reminder skip:", e));
          }
          
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: {
              title: "Reminder Scheduled",
              message: `Reminder created for ${params.contact_name || 'customer'}.`,
              type: 'success'
            }
          }));
          break;
        }

        case 'GET_BRIEFING': {
          setActiveModule('dashboard');
          break;
        }

        case 'CREATE_PURCHASE_ORDER': {
          let contactId = null;
          if (params?.supplier_name) {
            const { data: contact } = await queryWithTimeout(
              supabase.from('contacts').select('id').eq('business_id', businessId).eq('type', 'supplier').ilike('name', `%${params.supplier_name}%`).limit(1).maybeSingle()
            );
            if (contact) contactId = contact.id;
          }

          const resolvedItems = await Promise.all((params?.items || []).map(async (item: any) => {
            const { data: prod } = await queryWithTimeout(
              supabase.from('products').select('id, name, cost_price').eq('business_id', businessId).ilike('name', `%${item.name}%`).limit(1).maybeSingle()
            );
            return { product_id: prod?.id || null, product_name: prod?.name || item.name, quantity: item.qty || 1, unit_cost: item.unit_cost || prod?.cost_price || 0 };
          }));

          console.log(`[VANI_EXEC] Prefilling purchase order for: ${params.supplier_name}`);
          window.dispatchEvent(new CustomEvent('app:navigate', { 
            detail: { 
              module: 'purchases', 
              props: { 
                mode: 'create', 
                prefill: { 
                  supplier_id: contactId, 
                  supplier_name: params.supplier_name, 
                  items: resolvedItems, 
                  total: params.total || 0 
                }
              }
            }
          }));
          setActiveModule('purchases');
          break;
        }

        case 'WHATSAPP_SEND': {
          let phone = '';
          if (params?.contact_name) {
            const { data: contact } = await queryWithTimeout(
              supabase.from('contacts').select('phone').eq('business_id', businessId).ilike('name', `%${params.contact_name}%`).limit(1).maybeSingle()
            );
            phone = contact?.phone || '';
          }
          if (phone) {
            await smsService.sendMessage({
              phone,
              message: params.type === 'invoice' ? "Here is your invoice link: Vyapari ERP" : "This is a quick reminder from Vyapari ERP.",
              type: 'whatsapp',
              referenceType: 'system'
            });
            
            window.dispatchEvent(new CustomEvent('app:toast', {
              detail: {
                title: "WhatsApp Sent",
                message: `Message sent to ${params.contact_name || 'contact'} successfully.`,
                type: 'success'
              }
            }));
          } else {
            vaniService.speak("Phone number not found for this contact.");
          }
          break;
        }

        case 'AUDIT_SEARCH': {
          setActiveModule('audit');
          window.dispatchEvent(new CustomEvent('app:audit-search', { detail: { query: params?.query, filters: params?.filters } }));
          break;
        }

        case 'SMART_DUNNING': {
          setActiveModule('autopilot');
          window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'autopilot', props: { subview: 'dunning' } } }));
          break;
        }
        
        case 'PROCUREMENT_AGENT': {
          setActiveModule('purchases');
          window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'purchases', props: { tab: 'agent' } } }));
          break;
        }

        case 'AUTONOMOUS_REORDER': {
          setActiveModule('purchases');
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: {
              title: "Agentic Procurement",
              message: "Scanning inventory for low stock... VANI is drafting POs.",
              type: 'smart'
            }
          }));
          window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'purchases', props: { tab: 'agent', runDraft: true } } }));
          break;
        }

        case 'VISUAL_VERIFICATION': {
          setActiveModule('inventory');
          window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'inventory', tab: 'verify' } }));
          break;
        }
        default:
          console.warn(`[VANI_EXEC] Action route not defined for intent: ${intent}`);
      }

      // EXTREME LEVEL: Chained Action Processing
      if (response.actions && Array.isArray(response.actions) && response.actions.length > 0) {
        console.log(`[VANI_EXEC] Executing ${response.actions.length} secondary actions...`);
        for (const action of response.actions) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await vaniExecutor.execute(
            { intent: action.type, params: action.params }, 
            businessId, 
            setActiveModule, 
            onSuccess
          );
        }
      }

      // Log execution (non-blocking fire-and-forget)
      supabase.from('vani_logs').insert({
        business_id: businessId,
        transcript: response.transcript || '',
        intent: intent || 'unknown',
        confidence: response.confidence || 0.9,
        was_executed: true
      }).catch(err => console.warn("Vani log save skipped:", err));

      // PROACTIVE STRATEGIC INSIGHT (JARVIS PROTOCOL)
      if (response.proactive_note) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: {
              title: "Strategic Insight",
              message: response.proactive_note,
              type: 'smart'
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
