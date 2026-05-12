export interface SimProduct {
  id: string;
  name: string;
  currentPrice: number;
  costPrice: number;
  baseQuantity: number;
  dailySales: number;
  elasticity?: number;
}

export interface SimConfig {
  newPrice: number;
  discount: number;
  horizon: number;
  marketCondition: 'Normal' | 'Festival' | 'Off-season' | 'Competition';
}

export interface SimResultItem {
  productId: string;
  productName: string;
  currentPrice: number;
  newPrice: number;
  costPrice: number;
  currentRevenue: number;
  projectedRevenue: number;
  revenueChange: number;
  currentProfit: number;
  projectedProfit: number;
  profitChange: number;
  adjustedQuantity: number;
  breakEvenUnits: number;
  breakEvenDays: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  elasticity: number;
}

export interface SimResult {
  products: SimResultItem[];
  totalCurrentRevenue: number;
  totalProjectedRevenue: number;
  revenueChange: number;
  revenueChangePct: string;
  totalCurrentProfit: number;
  totalProjectedProfit: number;
  profitChange: number;
  profitChangePct: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  horizon: number;
  marketCondition: string;
}

export function runSimulation(
  products: SimProduct[],
  config: SimConfig
): SimResult {
  const results = products.map(product => {
    // 1. Price elasticity (from historical data or default)
    const elasticity = product.elasticity ?? -0.5;
    
    // 2. Quantity adjustment
    const priceChange = 
      (config.newPrice - product.currentPrice) 
      / product.currentPrice;
    
    const qtyAdjustment = 
      1 + (elasticity * priceChange);
    
    // 3. Market condition multiplier
    const multipliers = {
      Normal: 1.0,
      Festival: 1.3,
      "Off-season": 0.7,
      Competition: 0.85,
    };
    const multiplier = 
      multipliers[config.marketCondition];
    
    // 4. Adjusted quantity
    const adjustedQty = Math.max(0,
      product.baseQuantity 
      * qtyAdjustment 
      * multiplier
    );
    
    // 5. Revenue calculations
    const discountedPrice = 
      config.newPrice * (1 - config.discount/100);
    
    const currentRevenue = 
      product.currentPrice * product.baseQuantity;
    
    const projectedRevenue = 
      discountedPrice * adjustedQty;
    
    // 6. Profit calculations
    const currentProfit = 
      (product.currentPrice - product.costPrice) 
      * product.baseQuantity;
    
    const projectedProfit = 
      (discountedPrice - product.costPrice) 
      * adjustedQty;
    
    // 7. Break-even
    const breakEvenUnits = 
      (discountedPrice - product.costPrice) > 0
      ? product.costPrice 
        / (discountedPrice - product.costPrice)
      : 0;
    
    const breakEvenDays = 
      product.dailySales > 0
      ? breakEvenUnits / product.dailySales
      : 0;
    
    // 8. Risk assessment
    const profitRatio = 
      currentProfit > 0
      ? projectedProfit / currentProfit
      : 1;
    
    const risk: 'LOW' | 'MEDIUM' | 'HIGH' = 
      profitRatio >= 1.0 ? "LOW"
      : profitRatio >= 0.8 ? "MEDIUM"
      : "HIGH";
    
    return {
      productId: product.id,
      productName: product.name,
      currentPrice: product.currentPrice,
      newPrice: config.newPrice,
      costPrice: product.costPrice,
      currentRevenue,
      projectedRevenue,
      revenueChange: projectedRevenue - currentRevenue,
      currentProfit,
      projectedProfit,
      profitChange: projectedProfit - currentProfit,
      adjustedQuantity: Math.round(adjustedQty),
      breakEvenUnits: Math.round(breakEvenUnits),
      breakEvenDays: Math.round(breakEvenDays),
      risk,
      elasticity,
    };
  });

  // Totals
  const totalCurrentRevenue = 
    results.reduce((s, r) => s + r.currentRevenue, 0);
  const totalProjectedRevenue = 
    results.reduce((s, r) => s + r.projectedRevenue, 0);
  const totalCurrentProfit = 
    results.reduce((s, r) => s + r.currentProfit, 0);
  const totalProjectedProfit = 
    results.reduce((s, r) => s + r.projectedProfit, 0);

  // Overall risk
  const hasHigh = results.some(r => r.risk === "HIGH");
  const hasMed = results.some(r => r.risk === "MEDIUM");
  const overallRisk = 
    hasHigh ? "HIGH" 
    : hasMed ? "MEDIUM" 
    : "LOW";

  return {
    products: results,
    totalCurrentRevenue,
    totalProjectedRevenue,
    revenueChange: 
      totalProjectedRevenue - totalCurrentRevenue,
    revenueChangePct: totalCurrentRevenue > 0 ? (
      (totalProjectedRevenue - totalCurrentRevenue) 
      / totalCurrentRevenue * 100
    ).toFixed(1) : "0.0",
    totalCurrentProfit,
    totalProjectedProfit,
    profitChange: 
      totalProjectedProfit - totalCurrentProfit,
    profitChangePct: totalCurrentProfit > 0 ? (
      (totalProjectedProfit - totalCurrentProfit) 
      / totalCurrentProfit * 100
    ).toFixed(1) : "0.0",
    overallRisk,
    confidence: 
      overallRisk === "LOW" ? 87
      : overallRisk === "MEDIUM" ? 72
      : 58,
    horizon: config.horizon,
    marketCondition: config.marketCondition,
  };
}
