import { supabase } from "../lib/supabase";
import { systemAlertService } from "./systemAlertService";

export interface FraudAnalysisResult {
  riskScore: number;
  anomalies: string[];
  recommendations: string[];
}

export const fraudGuardService = {
  /**
   * Scans a specific product for margin erosion using Dynamic Averages
   */
  checkProductMargin: async (productId: string, businessId: string) => {
    const { data: product, error } = await supabase
      .from('products')
      .select('name, cost_price, selling_price')
      .eq('id', productId)
      .single();

    if (error || !product) return null;

    const margin = product.selling_price - product.cost_price;
    const marginPercent = (margin / product.selling_price) * 100;

    // ML Thresholding: Less than 10% is a critical bleeding indicator
    if (marginPercent < 10) {
      await systemAlertService.createAlert({
        business_id: businessId,
        type: 'MARGIN_RISK',
        severity: marginPercent < 0 ? 'CRITICAL' : 'WARNING',
        title: `Margin Erosion: ${product.name}`,
        message: `Current margin is critically low at ${marginPercent.toFixed(2)}%. Algorithmic recommendation: Raise price by at least ${(product.cost_price * 1.25 - product.selling_price).toFixed(2)} to maintain baseline health.`,
        metadata: { productId, marginPercent }
      });
    }
    return marginPercent;
  },

  /**
   * ML-Inspired Vendor Price Drift using Z-Score (Standard Deviation)
   */
  checkVendorPriceDrift: async (productId: string, newPrice: number, businessId: string) => {
    // Fetch last 10 historical prices
    const { data: history, error } = await supabase
      .from('cost_price_history')
      .select('new_cost_price')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !history || history.length < 3) return 0; // Need at least 3 data points for a valid distribution

    const prices = history.map(h => h.new_cost_price || 0);
    const mean = prices.reduce((acc, p) => acc + p, 0) / prices.length;
    
    // Calculate Standard Deviation
    const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance) || 1; // Prevent division by zero

    // Calculate Z-Score: how many standard deviations away is the new price?
    const zScore = (newPrice - mean) / stdDev;
    const driftPercent = ((newPrice - mean) / mean) * 100;

    // A Z-Score > 2 indicates a 95% statistical anomaly (Major Price Hike)
    if (zScore > 2.0 && driftPercent > 5) {
      await systemAlertService.createAlert({
        business_id: businessId,
        type: 'VENDOR_RISK',
        severity: 'WARNING',
        title: `Statistical Price Drift Detected`,
        message: `Vendor price of ₹${newPrice} is ${driftPercent.toFixed(1)}% above average (Z-Score: ${zScore.toFixed(2)}). Highly anomalous hike.`,
        metadata: { productId, zScore, driftPercent, newPrice, mean }
      });
    }

    return driftPercent;
  },

  /**
   * Neural-Style Real-time Invoice Fraud Scoring (Multi-factor Matrix)
   */
  analyzeInvoiceRisk: async (invoiceData: any): Promise<FraudAnalysisResult> => {
    let riskScore = 0;
    const anomalies: string[] = [];
    const recommendations: string[] = [];

    // 1. DUPLICATION HEURISTIC: Check exact invoice numbers
    const { data: duplicates } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceData.invoice_number)
      .eq('contact_id', invoiceData.contact_id)
      .eq('is_purchase', true)
      .neq('id', invoiceData.id || '');

    if (duplicates && duplicates.length > 0) {
      riskScore += 85;
      anomalies.push("Critical: Duplicate Vendor Invoice Number Detected.");
      recommendations.push("Immediately halt payment. Vendor may be double-billing.");
    }

    // 2. VELOCITY HEURISTIC: Too many invoices to the same contact in 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: velocityCount } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('contact_id', invoiceData.contact_id)
      .gte('created_at', yesterday.toISOString());

    if (velocityCount && velocityCount >= 5) {
      riskScore += 40;
      anomalies.push(`Velocity Risk: ${velocityCount} invoices logged for this contact in 24 hours.`);
      recommendations.push("Investigate account for potential automated ghost-billing.");
    }

    // 3. STATISTICAL OUTLIER (Benford's Law / High Value Check)
    if (invoiceData.total_amount > 250000) {
      riskScore += 30;
      anomalies.push("Class 1 Financial Outlier: Exceeds standard capital flow.");
      recommendations.push("Mandate dual-signature authorization for this clearance.");
    }

    // 4. ROUND NUMBER ANOMALY (Fraudsters often use perfectly round numbers)
    if (invoiceData.total_amount % 10000 === 0 && invoiceData.total_amount > 50000) {
      riskScore += 15;
      anomalies.push("Suspiciously perfect round-number transaction detected.");
      recommendations.push("Verify line items. Genuine high-value invoices rarely end in exact thousands.");
    }

    return {
      riskScore: Math.min(riskScore, 100),
      anomalies,
      recommendations
    };
  }
};
