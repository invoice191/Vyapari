import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGlobalData } from '../context/DataContext';

export type RFMSegment = 'Champion' | 'Loyal' | 'At Risk' | 'Cannot Lose' |
                          'New Customer' | 'Potential Loyalist' | 'Lost' | 'Needs Attention' | 'Hibernating';

export interface RFMResult {
  contact_id: string;
  contact_name: string;
  recency_days: number;
  frequency: number;
  monetary: number;
  rfm_segment: string;
  segment_label: RFMSegment;
  segment_color: string;
}

export function useRFM(businessId: string | undefined) {
  const { invoices, contacts } = useGlobalData();
  const [data, setData] = useState<RFMResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    async function loadRFM() {
      try {
        const { data, error } = await supabase.rpc('calculate_rfm', { p_business_id: businessId });
        if (error) throw error;
        const mapped = (data || []).map((r: any) => ({
          contact_id: r.contact_id,
          contact_name: r.contact_name,
          recency_days: r.recency_days,
          frequency: r.frequency,
          monetary: Number(r.monetary),
          rfm_segment: r.rfm_segment,
          segment_label: r.rfm_label as RFMSegment,
          segment_color: {
            'Champion':    '#22c55e',
            'Loyal':       '#3b82f6',
            'Promising':   '#8b5cf6',
            'At Risk':     '#f59e0b',
            'Cannot Lose': '#ef4444',
            'Lost':        '#6b7280',
            'New':         '#FF5500'
          }[r.rfm_label as string] || '#FF5500'
        }));
        setData(mapped);
      } catch (err) {
        console.error("RFM hook error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRFM();
  }, [businessId, invoices, contacts]);

  const bySegment = (seg: RFMSegment) => data.filter(d => d.segment_label === seg);
  const champions = bySegment('Champion');
  const atRisk = bySegment('At Risk');
  const cannotLose = bySegment('Cannot Lose');
  const lost = bySegment('Lost');
  const hibernating = bySegment('Hibernating');

  return { data, loading, champions, atRisk, cannotLose, lost, hibernating, bySegment };
}
