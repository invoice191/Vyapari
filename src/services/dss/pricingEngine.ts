import { DSSRecommendation, EngineInput, EngineOutput, Sale } from './types';
import rules from './rules.json';
import { Product as InventoryItem } from '../types';

/**
 * 1. PRICING ENGINE - Realistic Implementation
 */
export function runPricingEngine(input: EngineInput): EngineOutput {
  const start = Date.now();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  
  // Group sales by product
  const salesByItem = new Map<string, { qty: number; revenue: number }>();
  for (const sale of input.sales) {
    if (new Date(sale.timestamp) >= thirtyDaysAgo) {
      for (const itemId of sale.item_ids) {
        const current = salesByItem.get(itemId) || { qty: 0, revenue: 0 };
        // Estimate per-item revenue if not explicitly available per item in Sale type
        // In reality, Sale should probably have items with prices
        const item = input.inventory.find(i => i.id === itemId);
        const price = Number(item?.selling_price) || 0;
        salesByItem.set(itemId, { 
          qty: current.qty + 1, 
          revenue: current.revenue + price 
        });
      }
    }
  }

  const recommendations: DSSRecommendation[] = [];
  const metrics: { label: string; value: number; unit?: string }[] = [];
  let totalLeakage = 0;

  for (const item of input.inventory) {
    const stats = salesByItem.get(item.id) || { qty: 0, revenue: 0 };
    const cost = Number(item.cost_price) || 0;
    const price = Number(item.selling_price) || 0;
    
    // Gross Margin = (selling - cost) / selling * 100
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    const targetMargin = rules.pricing.targetMarginPercent;

    // 1. Revenue Leakage (Underpriced)
    if (stats.qty > 0 && margin < targetMargin) {
      const targetPrice = cost / (1 - targetMargin / 100);
      const leakagePerUnit = targetPrice - price;
      const monthlyLeakage = stats.qty * leakagePerUnit;
      totalLeakage += monthlyLeakage;

      if (monthlyLeakage > 500) {
        recommendations.push({
          id: `price-leak-${item.id}`,
          engine: 'pricing',
          priority: monthlyLeakage > 5000 ? 'high' : 'medium',
          score: Math.min(95, 40 + (monthlyLeakage / 500)),
          confidence: 0.9,
          title: `Revenue Leakage: ${item.name}`,
          headline: `Rs.${Math.round(monthlyLeakage).toLocaleString('en-IN')}/mo lost to sub-optimal margin`,
          detail: `${item.name} is selling well (${stats.qty} units/mo) but at ${margin.toFixed(1)}% margin. Increasing price to Rs.${Math.round(targetPrice)} reaches your ${targetMargin}% goal.`,
          impactEstimate: {
            metric: 'Monthly Recovery',
            value: Math.round(monthlyLeakage),
            unit: 'Rs.',
            direction: 'positive',
          },
          action: {
            type: 'reprice',
            label: `Optimize to Rs.${Math.round(targetPrice)}`,
            deepLink: `/inventory/${item.id}?action=reprice&price=${Math.round(targetPrice)}`,
          },
          evidence: [
            `Units sold: ${stats.qty}`,
            `Current Margin: ${margin.toFixed(1)}%`,
            `Target Margin: ${targetMargin}%`,
            `Cost Floor: Rs.${cost}`
          ],
          affectedItemId: item.id,
          affectedItemName: item.name,
          suggestedPrice: Math.round(targetPrice),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 86400000),
        });
      }
    }

    // 2. Overpriced Check (No sales + High margin)
    if (stats.qty === 0 && margin > targetMargin * 1.5 && price > 0) {
       // Logic for overpriced or just slow mover?
    }
  }

  // Calculate dynamic weighted or simple average margin across active products
  const pricedItems = input.inventory.filter(i => Number(i.selling_price) > 0);
  const totalMarginSum = pricedItems.reduce((sum, item) => {
    const cost = Number(item.cost_price) || 0;
    const price = Number(item.selling_price) || 0;
    return sum + (((price - cost) / price) * 100);
  }, 0);
  const calculatedAvgMargin = pricedItems.length > 0 ? Math.round(totalMarginSum / pricedItems.length) : 20;

  metrics.push({ label: 'Avg Margin', value: calculatedAvgMargin, unit: '%' });
  metrics.push({ label: 'Revenue Leakage', value: totalLeakage, unit: 'Rs.' });

  return {
    engine: 'pricing',
    recommendations: recommendations.sort((a, b) => b.score - a.score),
    insights: [],
    metrics,
    executionMs: Date.now() - start,
    dataQuality: 0.9,
  };
}
