import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface DuplicateResult {
  invoice_id: string;
  invoice_number: string;
  created_at: string;
  total_amount: number;
  similarity_score: number;
}

export function useDuplicateCheck() {
  const [duplicate, setDuplicate] = useState<DuplicateResult | null>(null);

  const check = useCallback(async (
    businessId: string,
    contactId: string | null,
    totalAmount: number,
    itemCount: number
  ) => {
    if (!contactId || totalAmount < 1 || !businessId) return;
    try {
      const { data, error } = await supabase.rpc('check_duplicate_invoice', {
        p_business_id: businessId,
        p_contact_id: contactId,
        p_total_amount: totalAmount,
        p_item_count: itemCount,
      });
      if (!error) setDuplicate(data?.[0] ?? null);
    } catch {
      // silent fail — duplicate check is non-blocking
    }
  }, []);

  return { duplicate, check, clear: () => setDuplicate(null) };
}
