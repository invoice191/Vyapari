import { supabase } from "../lib/supabase";
import { systemAlertService } from "./systemAlertService";

export interface FraudAnalysisResult {
  riskScore: number;
  anomalies: string[];
  recommendations: string[];
}

export const fraudGuardService = {
  /**
   * Scans a specific product for margin erosion
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

    if (marginPercent < 10) {
      await systemAlertService.createAlert({
        business_id: businessId,
        type: 'MARGIN_RISK',
        severity: marginPercent < 0 ? 'CRITICAL' : 'WARNING',
        title: `Margin Erosion: ${product.name}`,
        message: `Current margin is ${marginPercent.toFixed(2)}%. Selling price may be too low relative to cost price (${product.cost_price}).`,
        metadata: { productId, marginPercent }
      });
    }

    return marginPercent;
  },

  /**
   * Checks for vendor price drift on a new purchase
   */
  checkVendorPriceDrift: async (productId: string, newPrice: number, businessId: string) => {
    // Get historical cost price history
    const { data: history, error } = await supabase
      .from('cost_price_history')
      .select('new_cost_price')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !history || history.length === 0) return 0;

    const avgPrice = history.reduce((acc, h) => acc + (h.new_cost_price || 0), 0) / history.length;
    const drift = ((newPrice - avgPrice) / avgPrice) * 100;

    if (drift > 15) {
      await systemAlertService.createAlert({
        business_id: businessId,
        type: 'VENDOR_RISK',
        severity: 'WARNING',
        title: `Price Drift Detected`,
        message: `Vendor is charging ${drift.toFixed(2)}% more than the historical average for this item.`,
        metadata: { productId, drift, newPrice, avgPrice }
      });
    }

    return drift;
  },

  /**
   * Real-time Invoice Fraud Scoring (Multi-factor)
   */
  analyzeInvoiceRisk: async (invoiceData: any): Promise<FraudAnalysisResult> => {
    let riskScore = 0;
    const anomalies: string[] = [];
    const recommendations: string[] = [];

    // 1. Check for duplicate invoice number with same vendor
    const { data: duplicates } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceData.invoice_number)
      .eq('contact_id', invoiceData.contact_id)
      .eq('is_purchase', true)
      .neq('id', invoiceData.id || '');

    if (duplicates && duplicates.length > 0) {
      riskScore += 80;
      anomalies.push("Potential Duplicate Invoice Number for this Vendor");
      recommendations.push("Verify if this invoice has already been paid or processed.");
    }

    // 2. High Value Transaction Check (Business Specific Threshold - Mocked at 1 Lakh)
    if (invoiceData.total_amount > 100000) {
      riskScore += 20;
      anomalies.push("High Value Transaction");
      recommendations.push("Require dual authorization for payments over 1,00,000.");
    }

    return {
      riskScore: Math.min(riskScore, 100),
      anomalies,
      recommendations
    };
  }
};

// Add createAlert to systemAlertService if it doesn't exist
// I'll update systemAlertService in a separate step
