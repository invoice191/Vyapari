import { DSSRecommendation, EngineInput, EngineOutput, Sale } from './types';
import rules from './rules.json';
import { Invoice } from '../types';

/**
 * 2. RFM ENGINE - Customer Segmentation
 */
export function runRFMEngine(input: EngineInput): EngineOutput {
  const start = Date.now();
  const recommendations: DSSRecommendation[] = [];
  const metrics: { label: string; value: number; unit?: string }[] = [];

  const now = new Date();
  const customerStats = new Map<string, { 
    lastDate: Date; 
    count: number; 
    total: number;
    name: string;
  }>();

  // Aggregate stats from invoices
  for (const inv of input.invoices) {
    if (!inv.contact_id) continue;
    
    const current = customerStats.get(inv.contact_id) || { 
      lastDate: new Date(0), 
      count: 0, 
      total: 0,
      name: (inv as any).contact?.name || 'Customer'
    };

    const invDate = new Date(inv.invoice_date || inv.created_at || 0);
    current.lastDate = invDate > current.lastDate ? invDate : current.lastDate;
    current.count += 1;
    current.total += (Number(inv.total_amount) || 0);
    current.name = (inv as any).contact?.name || current.name;
    customerStats.set(inv.contact_id, current);
  }

  // Calculate RFM Scores (1-5)
  const segments = {
    champions: 0,
    loyal: 0,
    at_risk: 0,
    lost: 0,
    new: 0
  };

  for (const [id, stats] of customerStats.entries()) {
    const recencyDays = Math.floor((now.getTime() - stats.lastDate.getTime()) / 86400000);
    
    // Simple 1-5 scoring (lower recency = higher score)
    const r = recencyDays < 7 ? 5 : recencyDays < 30 ? 4 : recencyDays < 60 ? 3 : recencyDays < 90 ? 2 : 1;
    const f = stats.count > 10 ? 5 : stats.count > 5 ? 4 : stats.count > 2 ? 3 : stats.count > 1 ? 2 : 1;
    const m = stats.total > 50000 ? 5 : stats.total > 20000 ? 4 : stats.total > 10000 ? 3 : stats.total > 5000 ? 2 : 1;

    // Segment Assignment
    if (r >= 4 && f >= 4) {
      segments.champions++;
    } else if (r >= 3 && f >= 3) {
      segments.loyal++;
      if (stats.total > 10000) {
        recommendations.push({
          id: `rfm-upsell-${id}`,
          engine: 'rfm',
          priority: 'medium',
          score: 65,
          confidence: 0.85,
          title: `Upsell Opportunity: ${stats.name}`,
          headline: `Loyal customer with Rs.${stats.total.toLocaleString()} LTV`,
          detail: `${stats.name} is a 'Loyal' customer. Offering a VIP bundle or 10% loyalty discount could convert them to a 'Champion'.`,
          impactEstimate: {
            metric: 'Potential LTV Lift',
            value: Math.round(stats.total * 0.2),
            unit: 'Rs.',
            direction: 'positive',
          },
          action: {
            type: 'investigate',
            label: 'Send VIP Invite',
            deepLink: `/contacts/${id}`,
          },
          evidence: [
            `Orders: ${stats.count}`,
            `Total Spend: Rs.${stats.total.toLocaleString()}`,
            `Last Purchase: ${recencyDays} days ago`
          ],
          affectedItemId: id,
          affectedItemName: stats.name,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 86400000),
        });
      }
    } else if (r <= 2 && f >= 3) {
      segments.at_risk++;
      recommendations.push({
        id: `rfm-atrisk-${id}`,
        engine: 'rfm',
        priority: 'high',
        score: 85,
        confidence: 0.9,
        title: `At-Risk Customer: ${stats.name}`,
        headline: `High frequency customer hasn't returned in ${recencyDays} days`,
        detail: `${stats.name} was a regular but is slipping away. Send a "We Miss You" offer on WhatsApp immediately.`,
        impactEstimate: {
          metric: 'Revenue at Risk',
          value: Math.round(stats.total / stats.count * 2),
          unit: 'Rs.',
          direction: 'negative',
        },
        action: {
          type: 'investigate',
          label: 'WhatsApp Win-back',
          deepLink: `/contacts/${id}?action=whatsapp`,
        },
        evidence: [
          `Avg Order: Rs.${Math.round(stats.total / stats.count).toLocaleString()}`,
          `Past frequency: ${f}/5`,
          `Current recency: ${recencyDays} days`
        ],
        affectedItemId: id,
        affectedItemName: stats.name,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });
    } else if (r >= 4 && f === 1) {
      segments.new++;
    } else {
      segments.lost++;
    }
  }

  metrics.push({ label: 'Champions', value: segments.champions });
  metrics.push({ label: 'Loyal', value: segments.loyal });
  metrics.push({ label: 'At Risk', value: segments.at_risk });

  return {
    engine: 'rfm',
    recommendations: recommendations.sort((a, b) => b.score - a.score),
    insights: [],
    metrics,
    executionMs: Date.now() - start,
    dataQuality: customerStats.size > 0 ? 0.9 : 0,
  };
}
