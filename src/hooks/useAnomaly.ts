import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGlobalData } from '../context/DataContext';

export interface AnomalyLog {
  id: string;
  business_id: string;
  anomaly_type: string;
  reference_id: string;
  reference_type: string;
  description: string;
  severity: string;
  value: number;
  expected_value: number;
  z_score: number;
  is_dismissed: boolean;
  detected_at: string;
}

export function useAnomaly(businessId: string | undefined) {
  const { invoices, products } = useGlobalData();
  const [anomalies, setAnomalies] = useState<AnomalyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('detect_anomalies', {
        p_business_id: businessId
      });
      if (error) throw error;
      const mapped = (data || []).map((row: any) => ({
        id: row.reference_id || Math.random().toString(),
        business_id: businessId,
        anomaly_type: row.anomaly_type,
        reference_id: row.reference_id,
        reference_type: row.anomaly_type === 'high_invoice_amount' ? 'invoice' : 'revenue',
        description: row.description,
        severity: row.severity,
        value: 0,
        expected_value: 0,
        z_score: 3.0,
        is_dismissed: false,
        detected_at: row.detected_at || new Date().toISOString()
      }));
      setAnomalies(mapped);
    } catch (err) {
      console.error("Anomaly hook fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const dismissAnomaly = async (id: string) => {
    await supabase
      .from('anomaly_log')
      .update({ is_dismissed: true })
      .eq('id', id);
    setAnomalies(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    fetchAnomalies();
  }, [businessId, invoices, products]);

  return { anomalies, loading, dismissAnomaly, refresh: fetchAnomalies };
}
