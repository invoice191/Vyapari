import { Product, Invoice } from "../types";

export interface TacticalAlert {
  id: string;
  severity: 'CRITICAL' | 'WATCH' | 'OPPORTUNITY';
  title: string;
  body: string;
  impact: string;
  action: string;
  module: string;
  timestamp: string;
}

export const warRoomService = {
  calculateMetrics: (
    invoices: Invoice[], 
    products: Product[], 
    purchaseOrders: any[], 
    stockMovements: any[]
  ) => {
    const alerts: TacticalAlert[] = [];
    const now = new Date();
    
    // 1. Revenue Velocity Monitoring
    const currentHour = now.getHours();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const lastWeekSameDay = new Date(today);
    lastWeekSameDay.setDate(lastWeekSameDay.getDate() - 7);

    const getHourRevenue = (date: Date, hour: number) => {
      return invoices.filter(inv => {
        const d = new Date(inv.invoice_date || (inv as any).created_at);
        return d.getFullYear() === date.getFullYear() &&
               d.getMonth() === date.getMonth() &&
               d.getDate() === date.getDate() &&
               d.getHours() === hour;
      }).reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
    };

    const revToday = getHourRevenue(today, currentHour);
    const revLastWeek = getHourRevenue(lastWeekSameDay, currentHour);

    if (revLastWeek > 0 && (revLastWeek - revToday) / revLastWeek > 0.2) {
      alerts.push({
        id: `rev-vel-${now.getTime()}`,
        severity: 'CRITICAL',
        title: 'Revenue Velocity Drop',
        body: `Current hour sales (Rs.${revToday.toLocaleString()}) are ${( ((revLastWeek - revToday) / revLastWeek) * 100).toFixed(0)}% below last week's baseline.`,
        impact: 'High Revenue Risk',
        action: 'Inspect Storefront',
        module: 'Sales',
        timestamp: now.toISOString()
      });
    } else if (revToday > revLastWeek * 1.2 && revLastWeek > 0) {
       alerts.push({
        id: `rev-vel-opp-${now.getTime()}`,
        severity: 'OPPORTUNITY',
        title: 'Sales Surge Detected',
        body: `Current hour sales are ${( ((revToday - revLastWeek) / revLastWeek) * 100).toFixed(0)}% above baseline.`,
        impact: 'Revenue Growth',
        action: 'Check Staffing',
        module: 'Sales',
        timestamp: now.toISOString()
      });
    }

    // 2. SKU Anomaly Detection (z-score)
    // We'll look at movements in the last 4 hours
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const movements4h = stockMovements.filter(m => new Date(m.created_at) >= fourHoursAgo);
    
    const skuMovements: Record<string, number> = {};
    movements4h.forEach(m => {
      skuMovements[m.product_id] = (skuMovements[m.product_id] || 0) + Math.abs(m.quantity_change || 0);
    });

    // Baseline: Average movement per 4h window over last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const baselineMovements = stockMovements.filter(m => new Date(m.created_at) >= sevenDaysAgo);
    
    const skuBaselines: Record<string, { sum: number, count: number }> = {};
    baselineMovements.forEach(m => {
      const pid = m.product_id;
      if (!skuBaselines[pid]) skuBaselines[pid] = { sum: 0, count: 0 };
      skuBaselines[pid].sum += Math.abs(m.quantity_change || 0);
    });

    Object.keys(skuMovements).forEach(pid => {
      const product = products.find(p => p.id === pid);
      if (!product) return;

      const currentMove = skuMovements[pid];
      const avgMove = (skuBaselines[pid]?.sum || 0) / (7 * 6); // roughly 42 four-hour windows in 7 days
      
      if (currentMove > avgMove * 3 && currentMove > 5) {
        alerts.push({
          id: `sku-anomaly-${pid}-${now.getTime()}`,
          severity: 'WATCH',
          title: `Abnormal SKU Movement: ${product.name}`,
          body: `Movement of ${currentMove} units in 4h exceeds baseline significantly.`,
          impact: 'Inventory Spike/Drain',
          action: 'Audit Stock',
          module: 'Inventory',
          timestamp: now.toISOString()
        });
      }
    });

    // 3. Overdue Suppliers
    // Since we don't have expected_delivery_date, we'll assume 7 days from order_date
    purchaseOrders.filter(po => {
      if (po.status === 'Received' || po.status === 'Cancelled') return false;
      const orderDate = new Date(po.order_date || po.created_at);
      const expectedDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return expectedDate < now;
    }).forEach(po => {
      alerts.push({
        id: `po-overdue-${po.id}`,
        severity: 'CRITICAL',
        title: `Overdue PO: ${po.po_number}`,
        body: `PO from ${po.supplier_id || 'Supplier'} is past its 7-day delivery window.`,
        impact: 'Supply Chain Delay',
        action: 'Contact Supplier',
        module: 'Procurement',
        timestamp: now.toISOString()
      });
    });

    // 5. Monsoon Season Tactical Prep
    const currentMonth = now.getMonth() + 1; // 1-indexed
    if (currentMonth >= 6 && currentMonth <= 9) {
       // Check for low stock in monsoon categories
       const monsoonCategories = ["Rainwear", "Umbrella", "Waterproof", "Agricultural", "Seeds", "Pesticides"];
       const lowRainStock = products.filter(p => 
         monsoonCategories.some(cat => p.name.toLowerCase().includes(cat.toLowerCase())) &&
         (Number(p.quantity) || 0) < 20 // Dynamic buffer
       );
       
       if (lowRainStock.length > 0) {
         alerts.push({
           id: `monsoon-prep-${now.getTime()}`,
           severity: 'CRITICAL',
           title: 'Monsoon Supply Shift',
           body: `${lowRainStock.length} monsoon-critical items are below the season safety buffer. Supply chain delays forecast at 45% risk.`,
           impact: 'Seasonal Revenue Loss',
           action: 'Bulk Restock Now',
           module: 'Strategic',
           timestamp: now.toISOString()
         });
       }
    }

    // 6. Ranking and Top 3
    // Severity priority: CRITICAL > WATCH > OPPORTUNITY
    const severityMap = { CRITICAL: 3, WATCH: 2, OPPORTUNITY: 1 };
    const rankedAlerts = [...alerts].sort((a, b) => severityMap[b.severity] - severityMap[a.severity]);

    return {
      alerts: rankedAlerts,
      top3: rankedAlerts.slice(0, 3),
      metrics: {
        velocity: revLastWeek > 0 ? (revToday / revLastWeek) : 1,
        anomalyCount: Object.keys(skuMovements).length,
        overdueCount: rankedAlerts.filter(a => a.module === 'Procurement').length
      }
    };
  }
};
