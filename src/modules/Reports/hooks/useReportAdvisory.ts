import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export function useReportAdvisory(reportTitle: string, kpis: any[], tableData: any[], period: string, businessId: string) {
  const [advisory, setAdvisory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchAdvisory = useCallback(async () => {
    if (!reportTitle || !kpis.length || !tableData.length) return;
    
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `advisory_${businessId}_${reportTitle}_${period.replace(/\s+/g, '_')}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        setAdvisory(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('report-insight', {
        body: { reportType: reportTitle, keyMetrics: kpis, tableData: tableData.slice(0, 15), period }
      });

      if (fnError) throw fnError;
      
      const result = data?.advisory || ["Monitor your trends closely for optimal growth."];
      setAdvisory(result);
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (err) {
      console.error('AI Advisory fetch failed:', err);
      setError(err);
      setAdvisory(["Analysis engine standby. Review metrics for strategic trends."]);
    } finally {
      setLoading(false);
    }
  }, [reportTitle, kpis, tableData, period, businessId]);

  useEffect(() => {
    fetchAdvisory();
  }, [fetchAdvisory]);

  return { advisory, loading, error, refresh: fetchAdvisory };
}
