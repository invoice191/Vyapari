import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGlobalData } from '../context/DataContext';

export interface CLVResult {
  contact_id: string;
  contact_name: string;
  avg_order_value: number;
  purchase_frequency: number;
  customer_lifespan_months: number;
  clv_estimate: number;
  clv_tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
}

export function useCLV(businessId: string | undefined) {
  const { invoices, contacts } = useGlobalData();
  const [clvData, setClvData] = useState<CLVResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    supabase.rpc('calculate_clv', { p_business_id: businessId })
      .then(({ data, error }) => {
        if (error) {
          console.error("CLV fetch error:", error);
        }
        setClvData((data as any) ?? []);
        setLoading(false);
      });
  }, [businessId, invoices, contacts]);

  return { clvData, loading };
}
