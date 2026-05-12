import { Product, Invoice } from "../types";

export const mlEngine = {
  // Detect Anomalies (Stock or Sales)
  detectAnomalies: (invoices: Invoice[], products: Product[]) => {
    const anomalies: any[] = [];
    
    // 1. Stock Anomalies
    products.forEach(p => {
      if ((p.quantity || 0) < 0) {
        anomalies.push({
          type: 'stock',
          item: p.name,
          issue: 'Negative Stock',
          hypothesis: 'Check for missing stock-in entries. Your data shows more sales than arrivals.'
        });
      } else if ((p.quantity || 0) === 0) {
        anomalies.push({
          type: 'stock',
          item: p.name,
          issue: 'Stockout',
          hypothesis: 'Critical SKU is empty. Likely missed revenue today.'
        });
      }
    });

    return anomalies;
  },

  // RFM Analysis (Recency, Frequency, Monetary)
  analyzeCustomers: (invoices: Invoice[]) => {
    const customers: Record<string, any> = {};
    const now = new Date();

    invoices.forEach(inv => {
      const cid = inv.contact_id || 'anonymous';
      if (!customers[cid]) {
        customers[cid] = { id: cid, name: (inv as any).contacts?.name || 'Unknown', orders: 0, totalSpend: 0, lastOrder: new Date(0) };
      }
      customers[cid].orders += 1;
      customers[cid].totalSpend += (inv.total_amount || 0);
      const orderDate = new Date(inv.invoice_date || (inv as any).created_at || Date.now());
      if (orderDate > customers[cid].lastOrder) {
        customers[cid].lastOrder = orderDate;
      }
    });

    return Object.values(customers).map(c => {
      const daysSinceLast = Math.floor((now.getTime() - c.lastOrder.getTime()) / (1000 * 3600 * 24));
      let persona = 'Standard';
      let intervention = '';
      let predictedImpact = 0;

      // Whale: Top 10% spenders, active in last 30 days
      if (c.totalSpend > 25000 && daysSinceLast <= 30) {
        persona = 'Whale';
        intervention = 'Personalized VIP early-access invitation';
        predictedImpact = c.totalSpend * 0.15; // 15% lift on high spend
      }
      // Loyalist: High frequency (> 5 orders), active
      else if (c.orders > 5 && daysSinceLast <= 45) {
        persona = 'Loyalist';
        intervention = 'Subscription-style loyalty points multiplier';
        predictedImpact = (c.totalSpend / c.orders) * 2; // Extra 2 orders value
      }
      // At-Risk: Was active, but hasn't ordered in 30-90 days
      else if (daysSinceLast > 30 && daysSinceLast <= 90 && (c.totalSpend > 5000 || c.orders > 2)) {
        persona = 'At-Risk';
        intervention = 'Automated "We Miss You" 10% discount coupon';
        predictedImpact = c.totalSpend * 0.4; // 40% chance of reclaiming historical spend
      }
      // Dormant: Inactive for > 90 days
      else if (daysSinceLast > 90) {
        persona = 'Dormant';
        intervention = 'Re-engagement deep-link WhatsApp campaign';
        predictedImpact = c.totalSpend * 0.1; // 10% conversion on old leads
      }

      return { ...c, daysSinceLast, persona, intervention, predictedImpact };
    });
  },

  // Market Basket Analysis (Bundles)
  findBundles: (invoices: Invoice[]) => {
    const pairs: Record<string, number> = {};
    invoices.forEach(inv => {
      const items = inv.items || (inv as any).invoice_items;
      if (!items) return;
      const productIds = items.map((i: any) => i.product_id).sort();
      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const key = `${productIds[i]}|${productIds[j]}`;
          pairs[key] = (pairs[key] || 0) + 1;
        }
      }
    });

    return Object.entries(pairs)
      .filter(([_, count]) => count > 2)
      .map(([key, count]) => ({ products: key.split('|'), confidence: count }))
      .sort((a, b) => b.confidence - a.confidence);
  }
};
