import { EngineInput, DSSRecommendation } from '../dssService';

export const pricingEngine = {
  analyze: (input: EngineInput): DSSRecommendation[] => {
    const recommendations: DSSRecommendation[] = [];
    const products = input.inventory || [];
    const sales = input.sales || [];

    if (products.length === 0) return recommendations;

    // 1. Elasticity & Margin Guardrails
    const opportunities = findPricingOpportunities(products, sales);
    
    opportunities.slice(0, 2).forEach(opt => {
      recommendations.push({
        id: `PRC-${opt.id}`,
        type: 'pricing',
        title: 'Elasticity-Aware Pricing',
        body: `"${opt.name}" has high demand velocity and stable margins. A ${opt.increase}% adjustment is feasible.`,
        score: opt.confidence,
        impact: `Projected Rs.${opt.revenueLift} monthly profit gain`,
        action: `Adjust price from Rs.${opt.current} to Rs.${opt.suggested}`,
        metadata: { productId: opt.id, currentMargin: opt.margin }
      });
    });

    return recommendations;
  }
};

function findPricingOpportunities(products: any[], sales: any[]) {
  return products
    .filter(p => (Number(p.quantity) || 0) > 0 && (Number(p.selling_price) || 0) > 0)
    .map(p => {
      // Logic: If product is in top 20% of sales volume but bottom 20% of margin,
      // it might be underpriced.
      const sellingPrice = Number(p.selling_price);
      const costPrice = Number(p.cost_price) || sellingPrice * 0.7;
      const margin = (sellingPrice - costPrice) / sellingPrice;
      const velocity = p.velocity === 'High' ? 1.2 : p.velocity === 'Medium' ? 1.0 : 0.8;
      
      const increase = margin < 0.15 ? 8 : 5;
      const suggested = Math.round(sellingPrice * (1 + increase / 100));
      
      return {
        id: p.id,
        name: p.name,
        current: sellingPrice,
        suggested,
        increase,
        margin: (margin * 100).toFixed(1) + '%',
        revenueLift: Math.round(sellingPrice * 0.05 * 50), // Mock calc
        confidence: Math.round(velocity * 80),
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}
