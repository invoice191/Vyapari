import { supabase } from "../lib/supabase";

export interface SystemAlert {
  id: string;
  business_id: string;
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  status: 'pending' | 'resolved';
  created_at: string;
  metadata?: any;
}

export const systemAlertService = {
  getAlerts: async (businessId: string) => {
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SystemAlert[];
  },

  resolveAlert: async (alertId: string) => {
    const { error } = await supabase
      .from('system_alerts')
      .update({ status: 'resolved' })
      .eq('id', alertId);

    if (error) throw error;
  },

  subscribeToAlerts: (businessId: string, callback: (alert: SystemAlert) => void) => {
    return supabase
      .channel(`system_alerts_${businessId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'system_alerts',
          filter: `business_id=eq.${businessId}` 
        },
        (payload) => callback(payload.new as SystemAlert)
      )
      .subscribe();
  }
};
