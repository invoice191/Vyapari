import { supabase } from "../lib/supabase";
import { vaniService } from "./vaniService";
import { smsService } from "./smsService";

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
          const targetModule = params?.target || params?.module;
          if (targetModule) setActiveModule(targetModule.toLowerCase());
          break;
        }

        case 'CREATE_INVOICE': {
          let contactId = null;
          if (params?.contact_name) {
            const { data: contact } = await supabase
              .from('contacts').select('id').eq('business_id', businessId).ilike('name', `%${params.contact_name}%`).limit(1).maybeSingle();
            if (contact) contactId = contact.id;
          }

          const resolvedItems = await Promise.all((params?.items || []).map(async (item: any) => {
            const { data: prod } = await supabase.from('products').select('id, name, selling_price').eq('business_id', businessId).ilike('name', `%${item.name}%`).limit(1).maybeSingle();
            return { product_id: prod?.id || null, product_name: prod?.name || item.name, quantity: item.qty || 1, unit_price: item.price || prod?.selling_price || 0, unit: 'pcs' };
          }));

          window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'invoices', props: { mode: 'create', prefill: { contact_id: contactId, contact_name: params.contact_name, items: resolvedItems, total: params.total || 0 }}}}));
          setActiveModule('invoices');
          break;
        }

        case 'CHECK_STOCK': {
          const { data: products } = await supabase.from('products').select('*').eq('business_id', businessId).ilike('name', `%${params?.product_name || ''}%`);
          if (products && products.length > 0) {
            setActiveModule('inventory');
            window.dispatchEvent(new CustomEvent('app:inventory-search', { detail: { query: params.product_name } }));
          } else {
            vaniService.speak("Stock not found.");
          }
          break;
        }

        case 'STRATEGIC_PLAN': {
          setActiveModule('dashboard');
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: {
              title: "Strategic Advisor Active",
              message: `Analyzing roadmap for: ${params.goal}. Checking historical trends and competitor indexing...`,
              type: 'smart'
            }
          }));
          // Trigger the simulation lab or DSS
          setTimeout(() => {
            setActiveModule('reports');
            window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'reports', props: { mode: 'strategic', goal: params.goal }}}));
          }, 2000);
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
            const { data: contact } = await supabase
              .from('contacts').select('id, phone').eq('business_id', businessId).ilike('name', `%${params.contact_name}%`).limit(1).maybeSingle();
            if (contact) {
              contactId = contact.id;
              phone = contact.phone;
            }
          }

          await supabase.from('reminders').insert({
            business_id: businessId,
            contact_id: contactId,
            message: `Payment reminder for ${params.contact_name || 'Customer'} - Amount: ₹${params.amount || 0}`,
            remind_at: params.date || new Date(Date.now() + 1000 * 60 * 60).toISOString(),
            status: 'pending'
          });
          
          if (phone) {
            await smsService.sendMessage({
              phone: phone,
              message: `Dear ${params.contact_name || 'Customer'}, this is a reminder for payment of ₹${params.amount || 0}. Team Vyapari.`,
              type: 'whatsapp',
              referenceType: 'system'
            });
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
            const { data: contact } = await supabase
              .from('contacts').select('id').eq('business_id', businessId).eq('type', 'supplier').ilike('name', `%${params.supplier_name}%`).limit(1).maybeSingle();
            if (contact) contactId = contact.id;
          }

          const resolvedItems = await Promise.all((params?.items || []).map(async (item: any) => {
            const { data: prod } = await supabase.from('products').select('id, name, cost_price').eq('business_id', businessId).ilike('name', `%${item.name}%`).limit(1).maybeSingle();
            return { product_id: prod?.id || null, product_name: prod?.name || item.name, quantity: item.qty || 1, unit_cost: item.unit_cost || prod?.cost_price || 0 };
          }));

          window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: 'purchases', props: { mode: 'create', prefill: { supplier_id: contactId, supplier_name: params.supplier_name, items: resolvedItems, total: params.total || 0 }}}}));
          setActiveModule('purchases');
          break;
        }

        case 'WHATSAPP_SEND': {
          let phone = '';
          if (params?.contact_name) {
            const { data: contact } = await supabase
              .from('contacts').select('phone').eq('business_id', businessId).ilike('name', `%${params.contact_name}%`).limit(1).maybeSingle();
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

        // ... (default cases) ...
        case 'error':
        case 'UNKNOWN':
          vaniService.speak("I'm not sure how to execute that command.");
          break;

        default:
          console.warn(`[VANI_EXEC] Action route not defined for intent: ${intent}`);
      }

      // Log execution
      await supabase.from('vani_logs').insert({
        business_id: businessId,
        transcript: response.transcript || '',
        intent: intent || 'unknown',
        confidence: response.confidence || 0.9,
        was_executed: true
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("[VANI_EXEC] Execution Failure:", err);
    }
  }
};
