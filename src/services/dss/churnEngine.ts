import { DSSRecommendation, EngineInput, EngineOutput } from './types';
import rules from './rules.json';

/**
 * 8. CHURN PREDICTION ENGINE
 */
export function runChurnEngine(input: EngineInput): EngineOutput {
  const start = Date.now();
  const recommendations: DSSRecommendation[] = [];
  const metrics: { label: string; value: number; unit?: string }[] = [];

  const now = new Date();
  const customerIntervals = new Map<string, { 
    dates: number[];
    name: string;
    totalSpend: number;
  }>();

  // Aggregate purchase history
  for (const inv of input.invoices) {
    if (!inv.contact_id) continue;
    const current = customerIntervals.get(inv.contact_id) || { 
      dates: [], 
      name: inv.contacts?.name || 'Customer',
      totalSpend: 0
    };
    current.dates.push(new Date(inv.invoice_date || inv.created_at || 0).getTime());
    current.totalSpend += (Number(inv.total_amount) || 0);
    customerIntervals.set(inv.contact_id, current);
  }

  let totalAtRiskRevenue = 0;

  for (const [id, stats] of customerIntervals.entries()) {
    if (stats.dates.length < 2) continue; // Need at least 2 purchases to find interval

    stats.dates.sort((a, b) => a - b);
    
    // Calculate Avg Purchase Interval
    let totalGap = 0;
    for (let i = 1; i < stats.dates.length; i++) {
      totalGap += (stats.dates[i] - stats.dates[i-1]);
    }
    const avgIntervalMs = totalGap / (stats.dates.length - 1);
    const avgIntervalDays = avgIntervalMs / 86400000;
    
    const lastPurchaseDays = (now.getTime() - stats.dates[stats.dates.length - 1]) / 86400000;
    const churnRiskRatio = lastPurchaseDays / (avgIntervalDays || 1);

    // Risk Levels
    if (churnRiskRatio > rules.churn.riskThresholds.medium) {
      const priority = churnRiskRatio > rules.churn.riskThresholds.critical ? 'critical' : 'high';
      const riskAmount = stats.totalSpend / stats.dates.length;
      totalAtRiskRevenue += riskAmount;

      recommendations.push({
        id: `churn-risk-${id}`,
        engine: 'churn',
        priority,
        score: Math.min(98, 40 + (churnRiskRatio * 15)),
        confidence: 0.8,
        title: `Churn Risk: ${stats.name}`,
        headline: `Purchase interval exceeded by ${churnRiskRatio.toFixed(1)}x`,
        detail: `${stats.name} usually buys every ${Math.round(avgIntervalDays)} days, but hasn't returned in ${Math.round(lastPurchaseDays)} days. Churn probability is ${Math.round(Math.min(99, churnRiskRatio * 20))}%.`,
        impactEstimate: {
          metric: 'Expected Order Value',
          value: Math.round(riskAmount),
          unit: 'Rs.',
          direction: 'negative',
        },
        action: {
          type: 'investigate',
          label: 'Personalized Win-back',
          deepLink: `/contacts/${id}?action=winback`,
        },
        evidence: [
          `Avg Interval: ${Math.round(avgIntervalDays)} days`,
          `Days Silent: ${Math.round(lastPurchaseDays)} days`,
          `Churn Ratio: ${churnRiskRatio.toFixed(2)}`
        ],
        affectedItemId: id,
        affectedItemName: stats.name,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });
    }
  }

  metrics.push({ label: 'At Risk Revenue', value: totalAtRiskRevenue, unit: 'Rs.' });
  metrics.push({ label: 'Avg Risk Ratio', value: 1.2 }); // Placeholder

  return {
    engine: 'churn',
    recommendations: recommendations.sort((a, b) => b.score - a.score),
    insights: [],
    metrics,
    executionMs: Date.now() - start,
    dataQuality: customerIntervals.size > 2 ? 0.85 : 0.3,
  };
}
