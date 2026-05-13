import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useData<T>(
  table: string, 
  queryFn?: (query: any) => any,
  dependencies: any[] = []
) {
  const { business } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!business?.id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from(table)
        .select('*')
        .eq('business_id', business.id)
        .range(0, 49); // Rule 4: Always paginate

      if (queryFn) {
        query = queryFn(query);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setData(result || []);
    } catch (err) {
      console.error(`[useData] Error fetching ${table}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [business?.id, table, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleRefresh = (e: any) => {
      if (e.detail?.table === table || e.detail?.table === 'all') {
        fetchData();
      }
    };

    window.addEventListener('app:data-refresh', handleRefresh);
    return () => window.removeEventListener('app:data-refresh', handleRefresh);
  }, [table, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
