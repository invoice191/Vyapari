import { supabase } from '../lib/supabase';

export interface SMSPayload {
  phone: string;
  message: string;
  type: 'sms' | 'whatsapp';
  referenceId?: string;
  referenceType?: 'invoice' | 'promo' | 'system';
}

export const smsService = {
  /**
   * Global flag to prevent actual API costs during testing.
   * Set to TRUE to log to console only.
   */
  SIMULATION_MODE: true,

  /**
   * Sends a message via the Supabase Edge Function (Twilio)
   */
  sendMessage: async (payload: SMSPayload) => {
    if (smsService.SIMULATION_MODE) {
      console.log(`[SIMULATION_MODE] Intercepted Messaging Request:`, payload);
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1000));
      return { status: 'simulated_success', message: 'Message logged to console, no costs incurred.' };
    }
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-processor', {
        body: { 
          direct: true,
          phone: payload.phone,
          message: payload.message,
          channel: payload.type,
          referenceId: payload.referenceId,
          referenceType: payload.referenceType
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  },

  /**
   * Queues a message for future delivery
   */
  queueMessage: async (payload: SMSPayload & { scheduledFor?: string }) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_queue')
        .insert({
          phone: payload.phone,
          message: payload.message,
          message_type: payload.referenceType || 'system',
          reference_id: payload.referenceId,
          reference_type: payload.referenceType,
          scheduled_for: payload.scheduledFor || new Date().toISOString(),
          status: 'pending'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to queue message:", error);
      throw error;
    }
  }
};
