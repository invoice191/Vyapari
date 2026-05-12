import { supabase } from "../../lib/supabase";

export interface AnomalyEvent {
  id: string;
  type: 'discount' | 'deletion' | 'override' | 'inventory';
  severity: 'low' | 'medium' | 'high';
  description: string;
  metadata: any;
  timestamp: string;
  resolved: boolean;
}

export const anomalyEngine = {
  /**
   * Detects unusual patterns in business operations
   */
  detectAnomalies: async (businessId: string): Promise<AnomalyEvent[]> => {
    const anomalies: AnomalyEvent[] = [];

    // 1. Check for High Discounts (e.g. > 30%)
    const { data: highDiscounts } = await supabase
      .from('invoice_items')
      .select('*, invoices!inner(*)')
      .eq('invoices.business_id', businessId)
      .gt('discount_percent', 30);

    if (highDiscounts) {
      highDiscounts.forEach(item => {
        anomalies.push({
          id: `disc-${item.id}`,
          type: 'discount',
          severity: 'high',
          description: `Unusual discount of ${item.discount_percent}% given on ${item.product_name || 'item'}`,
          metadata: { invoiceId: item.invoice_id, amount: item.total_amount },
          timestamp: item.invoices.created_at,
          resolved: false
        });
      });
    }

    // 2. Check for Manual Price Overrides
    // Assuming we have a products table with standard prices
    const { data: overrides } = await supabase
      .from('invoice_items')
      .select('*, products!inner(price), invoices!inner(*)')
      .eq('invoices.business_id', businessId);

    if (overrides) {
      overrides.forEach(item => {
        const standardPrice = item.products?.price || 0;
        const billedPrice = item.unit_price || 0;
        
        if (billedPrice < standardPrice * 0.8) { // > 20% below standard
          anomalies.push({
            id: `price-${item.id}`,
            type: 'override',
            severity: 'medium',
            description: `Manual price override: Billed at ₹${billedPrice} (Standard: ₹${standardPrice})`,
            metadata: { invoiceId: item.invoice_id },
            timestamp: item.invoices.created_at,
            resolved: false
          });
        }
      });
    }

    // 3. Check for Inventory Shrinkage (Negative Stock)
    const { data: shrinkage } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .lt('quantity', 0);

    if (shrinkage) {
      shrinkage.forEach(item => {
        anomalies.push({
          id: `inv-${item.id}`,
          type: 'inventory',
          severity: 'high',
          description: `Inventory Shrinkage: Product '${item.name}' has negative stock (${item.quantity})`,
          metadata: { productId: item.id },
          timestamp: new Date().toISOString(),
          resolved: false
        });
      });
    }

    return anomalies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};
