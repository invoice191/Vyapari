import { EngineInput, DSSRecommendation } from '../dssService';

export const inventoryEngine = {
  analyze: (input: EngineInput): DSSRecommendation[] => {
    const recommendations: DSSRecommendation[] = [];
    
    const critical = input.inventory.filter(i => Number(i.quantity) <= (Number(i.reorder_point) || 10));
    if (critical.length > 0) {
      recommendations.push({
        id: 'INV-001',
        type: 'inventory',
        title: 'Critical Stock Shortage',
        body: `${critical.length} items are below the reorder point (threshold).`,
        score: 95,
        impact: `Potential revenue risk of ₹${(critical.length * 5000).toLocaleString()}`,
        action: 'Generate procurement request for replenishment',
        metadata: { items: critical.map(i => i.name) }
      });
    }

    return recommendations;
  }
};
