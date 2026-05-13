import { SimulationParams, SimulationResult, EngineInput, SimulationSnapshot } from './types';
import rules from './rules.json';

export const SCENARIO_PRESETS: Record<string, Partial<SimulationParams>> = {
  festive_season: {
    label: "Diwali / Festive Season Boost",
    priceChangePct: 5,
    footfallChangePct: 35,
    costChangePct: 8,
    discountCampaignPct: 10,
    periods: 2,
  },
  competitor_nearby: {
    label: "New Competitor Opens Nearby",
    priceChangePct: -8,
    footfallChangePct: -20,
    costChangePct: 0,
    discountCampaignPct: 5,
    periods: 3,
  },
  gst_rate_hike: {
    label: "GST Rate Increase (+3%)",
    priceChangePct: 3,
    footfallChangePct: -5,
    costChangePct: 3,
    discountCampaignPct: 0,
    periods: 1,
  },
  expansion: {
    label: "Add New Product Category",
    priceChangePct: 0,
    footfallChangePct: 15,
    costChangePct: 12,
    newProductRevenue: 50000,
    periods: 6,
  },
};

export function runSimulation(
  params: SimulationParams,
  input: EngineInput
): SimulationResult {
  const start = Date.now();
  
  // Baseline snapshot from last 30 days
  const currentTotalRevenue = input.invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const baseline: SimulationSnapshot = {
    revenue: currentTotalRevenue,
    grossProfit: currentTotalRevenue * 0.25,
    netProfit: currentTotalRevenue * 0.15,
    cashFlow: currentTotalRevenue * 0.1,
    inventoryValue: input.inventory.reduce((s, i) => s + ((Number(i.quantity) || 0) * (Number(i.selling_price) || 0) * 0.7), 0),
    unitsSold: input.sales.length * 10
  };

  const volumeChangePct = params.priceChangePct * rules.pricing.priceElasticity;
  const totalVolumeMod = (1 + (volumeChangePct / 100)) * (1 + (params.footfallChangePct / 100));
  
  const simRevenue = baseline.revenue * (1 + (params.priceChangePct / 100)) * totalVolumeMod + (params.newProductRevenue || 0);
  const simProfit = simRevenue * (0.25 - (params.discountCampaignPct / 100)) - (baseline.revenue * 0.1 * (params.costChangePct / 100));

  const monthly = [];
  const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
  for (let i = 0; i < Math.min(params.periods, 6); i++) {
    monthly.push({
      month: months[i],
      current: baseline,
      simulated: {
        ...baseline,
        revenue: simRevenue,
        netProfit: simProfit
      }
    });
  }

  const rippleEffects: SimulationResult['rippleEffects'] = [];
  if (Math.abs(params.priceChangePct) > 0) {
    rippleEffects.push({
      description: `${params.priceChangePct > 0 ? '+' : ''}${params.priceChangePct}% price - ${volumeChangePct.toFixed(1)}% volume change (elasticity: ${rules.pricing.priceElasticity})`,
      severity: Math.abs(volumeChangePct) > 15 ? 'warning' : 'positive',
    });
  }

  return {
    id: `sim-${Date.now()}`,
    label: params.label,
    params,
    current: baseline,
    simulated: {
      ...baseline,
      revenue: simRevenue,
      netProfit: simProfit
    },
    monthly,
    delta: {
      revenueChange: simRevenue - baseline.revenue,
      revenueChangePct: ((simRevenue - baseline.revenue) / baseline.revenue) * 100,
      profitChange: simProfit - baseline.netProfit,
      profitChangePct: ((simProfit - baseline.netProfit) / baseline.netProfit) * 100,
      roi: (simProfit - baseline.netProfit) / (baseline.revenue * 0.05), // Mock ROI
      breakEvenMonths: 3
    },
    rippleEffects,
    recommendation: "Strategy appears viable. Focus on maintaining volume during price adjustments.",
    generatedAt: new Date(),
    executionMs: Date.now() - start
  };
}
