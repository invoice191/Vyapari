import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface AutocompleteItem {
  product_id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  quantity: number;
  unit: string;
  tax_rate: number;
  bill_frequency: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export function useSmartAutocomplete(businessId: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    if (!businessId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('search_products_smart', {
          p_business_id: businessId,
          p_query: query,
          p_limit: 8,
        });
        if (!error) setResults(data ?? []);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, businessId]);

  return { query, setQuery, results, loading, clear: () => { setQuery(''); setResults([]); } };
}
