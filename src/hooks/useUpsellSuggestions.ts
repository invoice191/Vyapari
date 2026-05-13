import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface UpsellItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  reason: string;
  co_purchase_rate: number;
}

export function useUpsellSuggestions(customerId: string, currentProductIds: string[]) {
  const { profile } = useAuth();
  const [suggestions, setSuggestions] = useState<UpsellItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.business_id || currentProductIds.length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_upsell_suggestions', {
          p_business_id: profile.business_id,
          p_contact_id: customerId || null,
          p_current_product_ids: currentProductIds,
          p_limit: 3
        });

        if (error) throw error;
        setSuggestions(data || []);
      } catch (err) {
        console.error('Upsell Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 800);
    return () => clearTimeout(debounce);
  }, [profile?.business_id, customerId, JSON.stringify(currentProductIds)]);

  return { suggestions, loading };
}
