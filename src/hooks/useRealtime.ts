import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * useRealtime
 * Subscribes to Supabase realtime events for the scoped business
 * and dispatches app:data-refresh custom events with a 300ms debounce.
 */
export function useRealtime() {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.business_id) return;

    let debounceTimer: any = null;
    const dispatchRefresh = (table: string, eventType: string) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('app:data-refresh', {
            detail: { table, eventType }
          })
        );
      }, 300);
    };

    const channel = supabase
      .channel('global-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `business_id=eq.${profile.business_id}` },
        (payload) => {
          if (payload.table) {
            dispatchRefresh(payload.table, payload.eventType);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [profile?.business_id]);
}
