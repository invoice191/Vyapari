import { supabase } from "../lib/supabase";

export interface RFMRow {
  contact_id: string;
  contact_name: string;
  recency_days: number;
  frequency: number;
  monetary: number;
  r_score: number;
  f_score: number;
  m_score: number;
  rfm_segment: string;
  rfm_label: string;
}

export interface StockVelocityRow {
  product_id: string;
  product_name: string;
  current_stock: number;
  avg_daily_sales: number;
  days_until_stockout: number;
  stockout_date: string | null;
  velocity_label: string;
}

export interface AnomalyRow {
  anomaly_type: string;
  reference_id: string;
  description: string;
  severity: string;
  detected_at: string;
}

export interface CLVRow {
  contact_id: string;
  contact_name: string;
  avg_order_value: number;
  purchase_frequency: number;
  customer_lifespan_months: number;
  clv: number;
  clv_tier: string;
}

export interface PricingGapRow {
  product_id: string;
  product_name: string;
  category: string;
  current_margin_pct: number;
  category_avg_margin_pct: number;
  gap_pct: number;
  suggested_price: number;
  potential_gain_monthly: number;
}

export const rfmService = {
  getRFMSegments: async (businessId: string): Promise<Record<string, RFMRow[]>> => {
    const cacheKey = `vyapari_rfm_${businessId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < 21600000) { // 6 hours
        return data;
      }
    }

    const { data, error } = await supabase.rpc('calculate_rfm', {
      p_business_id: businessId
    });

    if (error) throw error;

    const grouped = (data || []).reduce((acc: any, row: RFMRow) => {
      if (!acc[row.rfm_label]) acc[row.rfm_label] = [];
      acc[row.rfm_label].push(row);
      return acc;
    }, {});

    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: grouped
    }));

    return grouped;
  },

  getStockVelocity: async (businessId: string): Promise<StockVelocityRow[]> => {
    const { data, error } = await supabase.rpc('get_stock_velocity', {
      p_business_id: businessId
    });
    if (error) throw error;
    return data || [];
  },

  getAnomalies: async (businessId: string): Promise<AnomalyRow[]> => {
    const { data, error } = await supabase.rpc('detect_anomalies', {
      p_business_id: businessId
    });
    if (error) throw error;
    return data || [];
  },

  getCLV: async (businessId: string): Promise<CLVRow[]> => {
    const { data, error } = await supabase.rpc('calculate_clv', {
      p_business_id: businessId
    });
    if (error) throw error;
    return data || [];
  },

  getPricingGaps: async (businessId: string): Promise<PricingGapRow[]> => {
    const { data, error } = await supabase.rpc('detect_pricing_gaps', {
      p_business_id: businessId
    });
    if (error) throw error;
    return data || [];
  }
};
