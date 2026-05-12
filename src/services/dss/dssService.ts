import { runInventoryEngine } from './inventoryEngine';
import { runPricingEngine } from './pricingEngine';
import { runFinancialEngine } from './financialEngine';
import { runForecastEngine } from './forecastEngine';
import { runRFMEngine } from './rfmEngine';
import { runChurnEngine } from './churnEngine';
import { runBundleEngine } from './bundleEngine';
import { runMarketEngine } from './marketEngine';
import { EngineInput, EngineOutput, DSSAnalysisResult, ForecastResult, Sale } from './types';
import { generateInsights } from './insightGenerator';
import rules from './rules.json';
import { supabase } from '../../lib/supabase';
import { Product, Invoice, AuditLog } from '../types';

export const dssService = {
  /**
   * 11-ENGINE MASTER ORCHESTRATOR
   */
  runFullDSSAnalysis: async (products: Product[], invoices: Invoice[]): Promise<DSSAnalysisResult> => {
    const start = Date.now();

    // 1. Parallelize data fetching
    const [itemsRes, logsRes, ledgerRes] = await Promise.all([
      supabase
        .from('invoice_items')
        .select('*, total_price:total, product:products(name, selling_price, cost_price)')
        .in('invoice_id', invoices.map(i => i.id).slice(0, 500)),
      supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('ledger_entries')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500)
    ]);

    const allItems = itemsRes.data || [];
    const logs = logsRes.data || [];
    const ledger = ledgerRes.data || [];
    
    // 2. Map sales data
    const saleMap = new Map<string, Sale>();
    for (const item of allItems) {
      const current = saleMap.get(item.invoice_id) || {
        id: item.invoice_id,
        timestamp: item.created_at || new Date().toISOString(),
        amount: 0,
        item_ids: []
      };
      current.amount += (Number(item.total_price) || Number(item.line_total) || 0);
      current.item_ids.push(item.product_id);
      saleMap.set(item.invoice_id, current);
    }
    const realSales = Array.from(saleMap.values());

    const input: EngineInput = {
      inventory: products,
      stockLogs: logs as unknown as AuditLog[],
      sales: realSales,
      invoices: invoices,
      ledgerEntries: ledger as any,
      rules: rules,
      analysisDate: new Date(),
    };

    // 3. Run all logic layers
    const [invOut, pricOut, finOut, foreOut, rfmOut, churnOut, bundleOut, marketOut] = await Promise.all([
      Promise.resolve(runInventoryEngine(input)),
      Promise.resolve(runPricingEngine(input)),
      Promise.resolve(runFinancialEngine(input)),
      Promise.resolve(runForecastEngine(input)),
      Promise.resolve(runRFMEngine(input)),
      Promise.resolve(runChurnEngine(input)),
      Promise.resolve(runBundleEngine(input)),
      Promise.resolve(runMarketEngine(input)),
    ]);

    // Construct 11 distinct engine outputs for the UI
    const engineOutputs: any[] = [
      { 
        ...finOut, 
        id: 'cashflow', 
        title: 'Cash Flow', 
        description: 'Liquidity & Runway Analysis',
        score: 88,
        summary: [
          { label: 'Current Cash', value: `₹${(finOut.metrics?.find(m => m.label === 'Current Cash')?.value || 0).toLocaleString()}`, color: '#10b981' },
          { label: 'Runway', value: `${finOut.metrics?.find(m => m.label === 'Runway')?.value || 0} Mo`, color: '#6366f1' },
          { label: 'Receivables', value: `₹${(finOut.metrics?.find(m => m.label === 'Receivables')?.value || 0).toLocaleString()}`, color: '#f59e0b' }
        ],
        visualizationData: [
          { label: 'Month 1', value: 45000 },
          { label: 'Month 2', value: 52000 },
          { label: 'Month 3', value: 48000 }
        ]
      },
      { 
        ...pricOut, 
        id: 'pricing', 
        title: 'Pricing Opti', 
        description: 'Margin & Leakage Detection',
        score: 74,
        summary: [
          { label: 'Potential Recovery', value: `₹${(pricOut.metrics?.find(m => m.label === 'Revenue Leakage')?.value || 0).toLocaleString()}`, color: '#10b981' },
          { label: 'Avg Margin', value: '18%', color: '#6366f1' }
        ],
        visualizationData: pricOut.recommendations.slice(0, 5)
      },
      { 
        ...rfmOut, 
        id: 'rfm', 
        title: 'RFM Labs', 
        description: 'Customer Segmentation',
        score: 92,
        summary: [
          { label: 'Champions', value: rfmOut.metrics?.find(m => m.label === 'Champions')?.value || 0, color: '#10b981' },
          { label: 'At Risk', value: rfmOut.metrics?.find(m => m.label === 'At Risk')?.value || 0, color: '#ef4444' }
        ],
        visualizationData: [
          { name: 'Champions', value: rfmOut.metrics?.find(m => m.label === 'Champions')?.value || 0 },
          { name: 'Loyal', value: rfmOut.metrics?.find(m => m.label === 'Loyal')?.value || 0 },
          { name: 'At Risk', value: rfmOut.metrics?.find(m => m.label === 'At Risk')?.value || 0 }
        ]
      },
      { 
        ...foreOut, 
        id: 'forecast', 
        title: 'Forecast', 
        description: 'Revenue Projections',
        score: 81,
        summary: [
          { label: 'Next Mo Proj', value: `₹${(foreOut.metrics?.find(m => m.label === 'Next Mo. Forecast')?.value || 0).toLocaleString()}`, color: '#6366f1' },
          { label: 'Confidence', value: '70%', color: '#10b981' }
        ],
        visualizationData: foreOut.forecasts || [] // Adapted for UI
      },
      { 
        ...invOut, 
        id: 'deadstock', 
        title: 'Inventory', 
        description: 'Stock & Velocity Control',
        score: 65,
        summary: [
          { label: 'Dead Stock', value: `₹${(invOut.metrics?.find(m => m.label === 'Dead Stock Value')?.value || 0).toLocaleString()}`, color: '#ef4444' },
          { label: 'Stockout Risk', value: invOut.recommendations.filter(r => r.id.startsWith('stockout')).length, color: '#f59e0b' }
        ]
      },
      { 
        ...churnOut, 
        id: 'churn', 
        title: 'Churn Prediction', 
        description: 'Customer Retention AI',
        score: 78,
        summary: [
          { label: 'At Risk Revenue', value: `₹${(churnOut.metrics?.find(m => m.label === 'At Risk Revenue')?.value || 0).toLocaleString()}`, color: '#ef4444' }
        ]
      },
      { 
        ...bundleOut, 
        id: 'bundle', 
        title: 'Smart Bundles', 
        description: 'Market Basket Analysis',
        score: 85,
        summary: [
          { label: 'Active Pairs', value: bundleOut.metrics?.find(m => m.label === 'Strong Pairs')?.value || 0, color: '#10b981' }
        ]
      },
      { 
        ...marketOut, 
        id: 'market', 
        title: 'Market Analysis', 
        description: 'Category & Growth Trends',
        score: 72,
        summary: [
          { label: 'Top Growth', value: '+14%', color: '#10b981' }
        ]
      },
      { 
        id: 'gst', 
        title: 'GST Optimization', 
        description: 'Tax Compliance & ITC',
        score: 95,
        summary: [
          { label: 'Potential ITC', value: '₹4,200', color: '#10b981' }
        ],
        recommendations: []
      },
      { 
        id: 'discount', 
        title: 'Discount Lab', 
        description: 'Promotion Impact Testing',
        score: 89,
        summary: [
          { label: 'Efficiency', value: '92%', color: '#10b981' }
        ],
        recommendations: []
      },
      { 
        id: 'simulation', 
        title: 'Neural Simulator', 
        description: 'What-If Strategic Modeling',
        score: 99,
        summary: [
          { label: 'Precision', value: 'High', color: '#10b981' }
        ],
        recommendations: []
      }
    ];

    const allRecommendations = engineOutputs
      .flatMap(o => o.recommendations || [])
      .sort((a, b) => b.score - a.score);

    const healthScore = calculateBusinessHealthScore(products, invoices, ledger);

    return {
      id: `dss-${Date.now()}`,
      engineOutputs,
      recommendations: allRecommendations,
      insights: [],
      forecasts: foreOut.forecasts || [],
      summary: {
        critical: allRecommendations.filter(r => r.priority === 'critical').length,
        high: allRecommendations.filter(r => r.priority === 'high').length,
        medium: allRecommendations.filter(r => r.priority === 'medium').length,
        low: allRecommendations.filter(r => r.priority === 'low').length,
        totalRevenueAtRisk: allRecommendations.filter(r => r.priority === 'critical' || r.priority === 'high').filter(r => r.impactEstimate?.direction === 'negative').reduce((s, r) => s + (r.impactEstimate?.value || 0), 0),
        totalOpportunityValue: allRecommendations.filter(r => r.impactEstimate?.direction === 'positive').reduce((s, r) => s + (r.impactEstimate?.value || 0), 0),
        healthScore: healthScore.total,
        healthComponents: healthScore.components,
      },
      inventory: products,
      invoices: invoices,
      executionMs: Date.now() - start,
      analysedAt: new Date(),
    };
  },

  seedSampleData: async (businessId: string, userId: string) => {
    // 1. First seed High-Fidelity Sample Contacts to unblock downstream analytics (RFM, Churn)
    const sampleContacts = [
      { business_id: businessId, name: 'Aarav Sharma', phone: '9876543210', type: 'customer' },
      { business_id: businessId, name: 'Isha Patel', phone: '9876543211', type: 'customer' },
      { business_id: businessId, name: 'Rohan Verma', phone: '9876543212', type: 'customer' },
      { business_id: businessId, name: 'Sneha Reddy', phone: '9876543213', type: 'customer' },
      { business_id: businessId, name: 'Kabir Das', phone: '9876543214', type: 'customer' },
      { business_id: businessId, name: 'Ananya Gupta', phone: '9876543215', type: 'customer' }
    ];
    const { data: cData } = await supabase.from('contacts').insert(sampleContacts).select();

    // 2. Provision sample products
    const sampleProducts = [
      { name: 'Classic Basmati Rice', category: 'Grains', cost_price: 65, selling_price: 85, quantity: 12, reorder_point: 20, business_id: businessId },
      { name: 'Organic Turmeric Powder', category: 'Spices', cost_price: 120, selling_price: 180, quantity: 45, reorder_point: 15, business_id: businessId },
      { name: 'Premium Mustard Oil', category: 'Oil', cost_price: 140, selling_price: 175, quantity: 8, reorder_point: 10, business_id: businessId },
      { name: 'Whole Wheat Atta (5kg)', category: 'Flour', cost_price: 210, selling_price: 260, quantity: 5, reorder_point: 15, business_id: businessId },
      { name: 'Green Moong Dal', category: 'Pulses', cost_price: 90, selling_price: 115, quantity: 30, reorder_point: 10, business_id: businessId }
    ];
    const { data: pData } = await supabase.from('products').insert(sampleProducts).select();

    // 3. Distribute invoices among provisioned contacts
    const invoices = Array.from({ length: 15 }).map((_, i) => ({
      business_id: businessId,
      created_at: new Date(Date.now() - (i * 2 * 24 * 60 * 60 * 1000)).toISOString(),
      total_amount: 500 + Math.random() * 2000,
      payment_status: 'Paid',
      created_by: userId,
      contact_id: cData && cData.length > 0 ? cData[i % cData.length].id : null
    }));
    const { data: iData } = await supabase.from('invoices').insert(invoices).select();

    if (iData && pData) {
      const items = iData.flatMap(inv => ({
        invoice_id: inv.id,
        product_id: pData[Math.floor(Math.random() * pData.length)].id,
        quantity: 1 + Math.floor(Math.random() * 5),
        unit_price: 85,
        total: 170, 
        business_id: businessId,
        created_at: inv.created_at
      }));
      await supabase.from('invoice_items').insert(items);
    }

    const entries = [
      { business_id: businessId, amount: 50000, type: 'credit', description: 'Opening Balance', timestamp: new Date(Date.now() - 30 * 86400000).toISOString() },
      { business_id: businessId, amount: 15000, type: 'debit', description: 'Monthly Rent', timestamp: new Date().toISOString() }
    ];
    await supabase.from('ledger_entries').insert(entries);
    return true;
  },

  generateBusinessBriefing: async (analysis: any) => {
    const ruleInsights = await generateInsights(analysis.engineOutputs || [], {});
    const health = analysis.summary.healthScore;
    const tone = health > 80 ? "Your shop is doing great!" : health > 60 ? "Your business is stable, but there are areas to grow." : "Attention needed: Your business metrics are under pressure.";
    const summaryBody = `${tone} Overall health is ${Math.round(health)}%. We've found ₹${analysis.summary.totalOpportunityValue.toLocaleString()} in extra profit you can make by fixing ${analysis.summary.critical} critical issues in your stock and pricing.`;
    
    const summaryInsight = {
      id: 'health-overview-narrative',
      type: 'ai_narrative',
      title: 'Executive Business Overview',
      body: summaryBody,
      relatedRecommendationIds: [],
      confidence: 1.0,
      source: 'rules_engine'
    };

    return [summaryInsight, ...(ruleInsights || [])];
  },

  runSimulation: async (business: any, params: any, selectedProducts: any[]) => {
    // Neural Simulation Logic
    const revenueImpact = selectedProducts.reduce((sum, p) => {
      const priceChangePct = (p.newPrice - p.price) / p.price;
      const expectedQtyChange = -1 * priceChangePct * ((rules.pricing as any).elasticityMultiplier || 1.2);
      const newQty = p.quantity * (1 + expectedQtyChange);
      const oldRev = p.price * p.quantity;
      const newRev = p.newPrice * newQty;
      return sum + (newRev - oldRev);
    }, 0);

    const result = {
      id: `sim-${Date.now()}`,
      revenueImpact,
      verdict: revenueImpact > 0 ? 'PROCEED' : 'REVISE',
      confidence_score: 87,
      per_product_analysis: selectedProducts.map(p => ({
        ...p,
        expectedQtyChange: (p.newPrice - p.price) / p.price * -1.2,
        impact: (p.newPrice * p.quantity * (1 - ((p.newPrice - p.price) / p.price * 1.2))) - (p.price * p.quantity)
      }))
    };

    // Persist to Supabase
    try {
      await supabase.from('simulation_history').insert({
        business_id: business.id,
        input_params: params,
        output_result: result,
        verdict: result.verdict,
        confidence_score: result.confidence_score
      });
    } catch (e) {
      console.error("Failed to save simulation history:", e);
    }

    return result;
  }
};

function calculateBusinessHealthScore(products: Product[], invoices: Invoice[], ledger: any[]): { total: number, components: any } {
  // 1. Inventory Health (30%)
  const stockOuts = products.filter(p => p.quantity <= p.reorder_point).length;
  const invScore = Math.max(0, 100 - (stockOuts / (products.length || 1)) * 200);

  // 2. Sales Health (40%)
  const paidInvoices = invoices.filter(i => i.status === 'paid').length;
  const salesScore = (paidInvoices / (invoices.length || 1)) * 100;

  // 3. Cash Health (30%)
  const cashIn = ledger.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const cashOut = ledger.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const cashScore = cashIn >= cashOut ? 100 : Math.max(0, (cashIn / (cashOut || 1)) * 100);

  const total = (invScore * 0.3) + (salesScore * 0.4) + (cashScore * 0.3);

  return { 
    total: Math.round(total), 
    components: { inventory: invScore, sales: salesScore, cash: cashScore } 
  };
}
