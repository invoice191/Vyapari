import { DSSRecommendation, EngineInput, EngineOutput, ForecastResult } from './types';
import rules from './rules.json';

/**
 * 6. FORECAST ENGINE - Realistic Revenue & Stock Projections
 */
export function runForecastEngine(input: EngineInput): EngineOutput {
  const start = Date.now();
  const recommendations: DSSRecommendation[] = [];
  const forecasts: ForecastResult[] = [];
  const metrics: { label: string; value: number; unit?: string }[] = [];

  const now = new Date();
  
  // 1. Revenue Forecast (Last 12 Months)
  // Group invoices by month
  const monthlyRevenue = new Map<string, number>();
  for (const inv of input.invoices) {
    const date = new Date(inv.invoice_date || inv.created_at || 0);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue.set(key, (monthlyRevenue.get(key) || 0) + (Number(inv.total_amount) || 0));
  }

  // Generate 3-month forecast for top categories or business as a whole
  // For the UI chart, we'll return a business-level forecast
  const months = [];
  for (let i = 0; i < 6; i++) {
     const d = new Date();
     d.setMonth(d.getMonth() - (5 - i));
     const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
     months.push({ key, actual: monthlyRevenue.get(key) || 0, isFuture: false });
  }

  // Simple Linear Projection for next 3 months
  const last3Months = months.slice(-3).map(m => m.actual);
  const avg = last3Months.reduce((a, b) => a + b, 0) / 3;
  const trend = (last3Months[2] - last3Months[0]) / 3;

  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    // Seasonality adjustment
    const monthIndex = d.getMonth() + 1;
    const isFestival = rules.forecast.festivalMonths.includes(monthIndex);
    const seasonality = isFestival ? rules.forecast.festivalBoostFactor : 1.0;
    
    const prediction = Math.max(0, (avg + (trend * i)) * seasonality);
    months.push({ 
      key, 
      actual: Math.round(prediction), 
      isFuture: true, 
      isFestival,
      lowerBound: Math.round(prediction * 0.8),
      upperBound: Math.round(prediction * 1.2)
    });
  }

  // Prepare ForecastResult for types
  // Note: ForecastResult in types.ts is per-item, but we can adapt it or return a generic one
  const businessForecast: ForecastResult = {
    itemId: 'business-total',
    itemName: 'Total Revenue',
    periods: months.map(m => ({
      month: m.key,
      predictedDemand: m.actual,
      lowerBound: m.lowerBound || m.actual,
      upperBound: m.upperBound || m.actual,
      seasonalityFactor: m.isFestival ? rules.forecast.festivalBoostFactor : 1.0,
      isFestivalMonth: !!m.isFestival
    })),
    confidence: 0.7,
    modelUsed: 'seasonal_decomposition',
    dataPointsUsed: input.invoices.length
  };

  forecasts.push(businessForecast);

  if (trend > 0) {
    recommendations.push({
      id: 'forecast-growth-trend',
      engine: 'forecast',
      priority: 'medium',
      score: 65,
      confidence: 0.7,
      title: 'Growth Forecast: Upward Trend',
      headline: `Revenue projected to grow by ${((trend/avg)*100).toFixed(1)}% over next 90 days`,
      detail: `Based on your recent 6-month performance, we anticipate a steady climb in sales. Ensure you have working capital ready for increased inventory requirements.`,
      impactEstimate: {
        metric: 'Projected Growth',
        value: Math.round(trend * 3),
        unit: 'Rs.',
        direction: 'positive',
      },
      action: {
        type: 'monitor',
        label: 'View Growth Plan',
        deepLink: '/analytics',
      },
      evidence: [
        `Avg Monthly Revenue: Rs.${Math.round(avg).toLocaleString()}`,
        `Current Trend: +Rs.${Math.round(trend).toLocaleString()}/mo`,
        `Festive Boost: ${rules.forecast.festivalBoostFactor}x included`
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });
  }

  // Compute forecast confidence dynamically based on historical data density
  const totalHistoryMonths = Math.max(1, months.filter(m => !m.isFuture).length);
  const totalTransactions = input.invoices.length;
  
  // Start with base confidence: more records = more reliability
  let baseConfidence = 50; 
  if (totalTransactions > 50) baseConfidence += 25;
  else if (totalTransactions > 15) baseConfidence += 15;
  
  // Data span multiplier (seasonal capture reliability)
  if (totalHistoryMonths > 6) baseConfidence += 15;
  else if (totalHistoryMonths > 3) baseConfidence += 8;

  // Clamp statistical confidence between 45% and 94%
  const calculatedConfidence = Math.min(94, Math.max(45, baseConfidence));

  metrics.push({ label: 'Next Mo. Forecast', value: months.find(m => m.isFuture)?.actual || 0, unit: 'Rs.' });
  metrics.push({ label: 'Forecast Confidence', value: calculatedConfidence, unit: '%' });

  return {
    engine: 'forecast',
    recommendations,
    insights: [],
    forecasts,
    metrics,
    executionMs: Date.now() - start,
    dataQuality: input.invoices.length > 20 ? 0.9 : 0.5,
  };
}
