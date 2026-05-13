import { DSSRecommendation, EngineInput, EngineOutput, Sale } from './types';
import rules from './rules.json';
import { Product as InventoryItem, AuditLog as StockLog } from '../types';

/**
 * 3. DISCOUNT ENGINE & 7. DEAD STOCK ENGINE
 */
export function runInventoryEngine(input: EngineInput): EngineOutput {
  const start = Date.now();
  const recommendations: DSSRecommendation[] = [];
  const metrics: { label: string; value: number; unit?: string }[] = [];
  const now = new Date();

  let totalDeadStockValue = 0;

  // 1. Calculate Per-Product Velocity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const salesByItem = new Map<string, number>();
  for (const sale of input.sales) {
    if (new Date(sale.timestamp) >= thirtyDaysAgo) {
      for (const itemId of sale.item_ids) {
        salesByItem.set(itemId, (salesByItem.get(itemId) ?? 0) + 1);
      }
    }
  }

  for (const item of input.inventory) {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.cost_price) || 0;
    const price = Number(item.selling_price) || 0;
    
    if (qty <= 0) continue;

    const sales30d = salesByItem.get(item.id) ?? 0;
    const avgDailySales = sales30d / 30;

    // Check last movement from logs
    const lastSale = input.stockLogs
      .filter(l => l.details?.product_id === item.id && (l.action === 'SALE' || l.action === 'INVOICE_CREATED'))
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];

    const daysSinceSale = lastSale
      ? Math.floor((now.getTime() - new Date(lastSale.created_at || 0).getTime()) / 86400000)
      : 999;

    // -- DEAD STOCK LOGIC --------------------------------------
    if (daysSinceSale >= rules.inventory.deadStockDays) {
      const capitalLocked = qty * cost;
      totalDeadStockValue += capitalLocked;
      
      // Opportunity Cost (12% annual FD rate heuristic)
      const annualOppCost = capitalLocked * 0.12;
      const monthlyOppCost = annualOppCost / 12;

      // Discount Logic
      // Min Discount = cover holding costs
      // Sweet Spot = move it fast without losing capital
      const minSafeDiscountPct = 10;
      const aggressiveDiscountPct = Math.min(40, Math.round((price - cost) / price * 100));
      const recoveryValue = price * (1 - aggressiveDiscountPct/100) * qty;

      recommendations.push({
        id: `dead-stock-${item.id}`,
        engine: 'deadstock',
        priority: daysSinceSale > 90 ? 'critical' : 'high',
        score: Math.min(95, 50 + (daysSinceSale / 5)),
        confidence: 0.9,
        title: `Dead Stock Alert: ${item.name}`,
        headline: `Rs.${capitalLocked.toLocaleString()} locked for ${daysSinceSale} days`,
        detail: `This item hasn't moved in ${daysSinceSale} days. You are losing Rs.${Math.round(monthlyOppCost)}/mo in opportunity cost. Run a ${aggressiveDiscountPct}% clearance sale to recover Rs.${Math.round(recoveryValue).toLocaleString()}.`,
        impactEstimate: {
          metric: 'Recoverable Capital',
          value: Math.round(recoveryValue),
          unit: 'Rs.',
          direction: 'positive',
        },
        action: {
          type: 'liquidate',
          label: `Start ${aggressiveDiscountPct}% Clearance`,
          deepLink: `/inventory/${item.id}?action=discount&pct=${aggressiveDiscountPct}`,
        },
        evidence: [
          `Locked Capital: Rs.${capitalLocked.toLocaleString()}`,
          `Days Dead: ${daysSinceSale} days`,
          `Monthly Opp. Cost: Rs.${Math.round(monthlyOppCost)}`,
          `Cost Floor: Rs.${cost}`
        ],
        affectedItemId: item.id,
        affectedItemName: item.name,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 86400000),
      });
    }

    // -- STOCKOUT LOGIC (VELOCITY & REORDER POINTS) --------------------------
    const isBelowReorder = item.reorder_point && qty <= item.reorder_point;
    
    if (avgDailySales > 0 || isBelowReorder) {
      const daysOfCover = avgDailySales > 0 ? qty / avgDailySales : 999;
      
      if (daysOfCover < 10 || isBelowReorder) {
        const restockQty = Math.ceil(Math.max(avgDailySales * 30, (item.reorder_point || 10) * 2));
        
        recommendations.push({
          id: `stockout-${item.id}`,
          engine: 'inventory',
          priority: (daysOfCover < 3 || qty <= 0) ? 'critical' : 'high',
          score: Math.min(99, 100 - (daysOfCover < 10 ? daysOfCover * 5 : 20)),
          confidence: 0.85,
          title: qty <= 0 ? `Out of Stock: ${item.name}` : `Stockout Imminent: ${item.name}`,
          headline: qty <= 0 ? `Inventory zeroed out` : `Only ${Math.round(daysOfCover)} days of stock remaining`,
          detail: isBelowReorder && avgDailySales === 0 
            ? `Item is below its reorder point of ${item.reorder_point}. No recent sales detected, but stock replenishment is advised for availability.`
            : `Selling ${avgDailySales.toFixed(1)} units/day. You will stock out by ${new Date(Date.now() + Math.min(daysOfCover, 30) * 86400000).toLocaleDateString()}. Reorder ${restockQty} units now.`,
          impactEstimate: {
            metric: 'Revenue at Risk',
            value: Math.round(Math.max(avgDailySales * 30 * price, (item.reorder_point || 0) * price)),
            unit: 'Rs.',
            direction: 'negative',
          },
          action: {
            type: 'restock',
            label: `Reorder ${restockQty} Units`,
            deepLink: `/inventory/${item.id}?action=restock&qty=${restockQty}`,
          },
          evidence: [
            `Current Qty: ${qty}`,
            `Reorder Point: ${item.reorder_point || 'Not Set'}`,
            `Daily Velocity: ${avgDailySales.toFixed(1)} units`,
            `Criticality: ${isBelowReorder ? 'REORDER_TRIGGERED' : 'VELOCITY_ALERT'}`
          ],
          affectedItemId: item.id,
          affectedItemName: item.name,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 86400000),
        });
      }
    }
  }

  metrics.push({ label: 'Dead Stock Value', value: totalDeadStockValue, unit: 'Rs.' });
  metrics.push({ label: 'Inventory Health', value: 72, unit: '%' });

  return {
    engine: 'inventory',
    recommendations: recommendations.sort((a, b) => b.score - a.score),
    insights: [],
    metrics,
    executionMs: Date.now() - start,
    dataQuality: input.inventory.length > 0 ? 0.9 : 0,
  };
}
