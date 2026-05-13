import { inventoryEngine } from "./engines/inventoryEngine";
import { pricingEngine } from "./engines/pricingEngine";
import { financialEngine } from "./engines/financialEngine";
import { forecastEngine } from "./engines/forecastEngine";
import { mlEngine } from "./engines/mlEngine";
import { supabase } from "../lib/supabase";

export interface EngineInput {
  inventory: any[];
  sales: any[];
  ledger: any[];
  timestamp: string;
}

export interface DSSRecommendation {
  id: string;
  type: 'inventory' | 'pricing' | 'financial' | 'forecast' | 'ml';
  title: string;
  body: string;
  score: number;
  impact: string;
  action: string;
  metadata?: any;
}

export const dssService = {
  runFullDSSAnalysis: async (businessId: string) => {
    try {
      // 1. Parallel Data Fetching (Architecture Sec 9)
      const [inventory, sales, ledger] = await Promise.all([
        supabase.from('products').select('*').eq('business_id', businessId),
        supabase.from('invoices').select('*, invoice_items(*)').eq('business_id', businessId),
        supabase.from('ledger_entries').select('*').eq('business_id', businessId)
      ]);

      const dataContext = {
        inventory: inventory.data || [],
        sales: sales.data || [],
        ledger: ledger.data || [],
        timestamp: new Date().toISOString()
      };

      // 2. Parallel Engine Execution
      const results = await Promise.all([
        inventoryEngine.analyze(dataContext),
        pricingEngine.analyze(dataContext),
        financialEngine.analyze(dataContext),
        forecastEngine.analyze(dataContext),
        mlEngine.analyze(dataContext)
      ]);

      // 3. Flatten and Rank Recommendations
      const allRecommendations = results.flat();
      const ranked = allRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // 4. Cache results for 5 minutes (SWR Pattern)
      localStorage.setItem('vyapari_dss_cache', JSON.stringify({
        timestamp: Date.now(),
        recommendations: ranked
      }));

      return ranked;
    } catch (err) {
      console.error("DSS Orchestration Failure:", err);
      throw err;
    }
  },

  getCachedResults: () => {
    const cache = localStorage.getItem('vyapari_dss_cache');
    if (!cache) return null;
    const { timestamp, recommendations } = JSON.parse(cache);
    if (Date.now() - timestamp > 300000) return null; // 5 min TTL
    return recommendations;
  },

  generateBusinessBriefing: async (data: any) => {
    try {
      const { data: res, error } = await supabase.functions.invoke('dss-ai', {
        body: { action: 'business-briefing', payload: data }
      });
      if (error) throw error;
      return res; // Return array or object
    } catch (err) {
      console.error("Briefing Generation Failure:", err);
      return [];
    }
  },

  generateForecastNarrative: async (forecastData: any) => {
    try {
      const { data: res, error } = await supabase.functions.invoke('dss-ai', {
        body: { action: 'forecast-narrative', payload: forecastData }
      });
      if (error) throw error;
      return res.text;
    } catch (err) {
      console.error("Narrative Generation Failure:", err);
      return "Forecast explanation unavailable. View the chart for trend analysis.";
    }
  }
};
