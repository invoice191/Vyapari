import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGlobalData } from '../contexts/DataContext';

export interface ForecastRow {
  forecast_date: string;
  projected_inflow: number;
  projected_outflow: number;
  net_cashflow: number;
  confidence: number;
}

export function useCashflowForecast(businessId: string | undefined) {
  const { ledger } = useGlobalData();
  const [forecast, setForecast] = useState<ForecastRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    supabase.rpc('generate_cashflow_forecast', { p_business_id: businessId })
      .then(({ data }) => {
        setForecast((data as any) ?? []);
        setLoading(false);
      });
  }, [businessId, ledger]);

  const totalInflow  = forecast.reduce((s, r) => s + Number(r.projected_inflow), 0);
  const totalOutflow = forecast.reduce((s, r) => s + Number(r.projected_outflow), 0);
  const worstDay     = forecast.reduce((a, b) =>
    (b && a && Number(b.net_cashflow) < Number(a.net_cashflow)) ? b : a, forecast[0] || null);

  return { forecast, loading, totalInflow, totalOutflow, worstDay };
}
