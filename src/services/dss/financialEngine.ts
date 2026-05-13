import { DSSRecommendation, EngineInput, EngineOutput, LedgerEntry } from './types';
import rules from './rules.json';
import { Invoice } from '../types';

/**
 * 5. CASH FLOW ENGINE & 9. GST OPTIMIZATION
 */
export function runFinancialEngine(input: EngineInput): EngineOutput {
  const start = Date.now();
  const recommendations: DSSRecommendation[] = [];
  const metrics: { label: string; value: number; unit?: string }[] = [];

  // -- CASH FLOW CALCULATIONS -----------------------------------
  const totalCredits = input.ledgerEntries
    .filter(e => e.type === 'credit')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalDebits = input.ledgerEntries
    .filter(e => e.type === 'debit')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  
  const currentCash = totalCredits - totalDebits;
  
  // Burn Rate: Avg debits over last X months
  const monthlyBurn = totalDebits / (rules.finance.burnRateAvgMonths || 3);
  const runwayMonths = monthlyBurn > 0 ? currentCash / monthlyBurn : 99;

  // Receivables (Unpaid Invoices)
  const receivables = input.invoices
    .filter(i => i.payment_status?.toLowerCase() !== 'paid')
    .reduce((s, i) => s + (Number(i.total_amount) || 0), 0);

  metrics.push({ label: 'Current Cash', value: currentCash, unit: 'Rs.' });
  metrics.push({ label: 'Runway', value: Math.max(0, Number(runwayMonths.toFixed(1))), unit: 'mo' });
  metrics.push({ label: 'Receivables', value: receivables, unit: 'Rs.' });

  // 1. Cash Flow Alert
  if (runwayMonths < 1.5 && currentCash > 0) {
    recommendations.push({
      id: 'fin-low-runway',
      engine: 'finance',
      priority: 'critical',
      score: 95,
      confidence: 0.95,
      title: 'Critical: Low Cash Runway',
      headline: `Only ${runwayMonths.toFixed(1)} months of cash left at current burn rate`,
      detail: `Your current cash (Rs.${currentCash.toLocaleString()}) won't cover expenses for long. Recover Rs.${receivables.toLocaleString()} in pending invoices immediately.`,
      impactEstimate: {
        metric: 'Net Cash Risk',
        value: currentCash,
        unit: 'Rs.',
        direction: 'negative',
      },
      action: {
        type: 'investigate',
        label: 'Collect Receivables',
        deepLink: '/invoices?filter=unpaid',
      },
      evidence: [
        `Monthly Burn: Rs.${Math.round(monthlyBurn).toLocaleString()}`,
        `Current Cash: Rs.${currentCash.toLocaleString()}`,
        `Pending Collections: Rs.${receivables.toLocaleString()}`
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });
  }

  // -- GST OPTIMIZATION -----------------------------------------
  // Net GST = Output GST (Sales) - Input Tax Credit (Purchases/Expenses)
  const outputGST = input.invoices.reduce((s, i) => s + (Number(i.tax_amount) || 0), 0);
  
  // Estimate Input Tax Credit from ledger (if flagged as purchase/expense with GST)
  // For now, heuristic 5% of debits are GST
  const estimatedITC = totalDebits * 0.05; 
  const netGSTPayable = outputGST - estimatedITC;

  metrics.push({ label: 'Net GST', value: Math.max(0, netGSTPayable), unit: 'Rs.' });

  if (netGSTPayable > 10000) {
    recommendations.push({
      id: 'gst-itc-miss',
      engine: 'gst',
      priority: 'medium',
      score: 70,
      confidence: 0.8,
      title: 'GST Optimization: Unclaimed ITC',
      headline: `Estimated Rs.${Math.round(estimatedITC).toLocaleString()} in unclaimed Input Tax Credit`,
      detail: `Ensure all purchase invoices are uploaded to claim full ITC and reduce your Rs.${Math.round(outputGST).toLocaleString()} tax liability.`,
      impactEstimate: {
        metric: 'Tax Savings',
        value: Math.round(estimatedITC),
        unit: 'Rs.',
        direction: 'positive',
      },
      action: {
        type: 'investigate',
        label: 'Audit Purchase Invoices',
        deepLink: '/expenses',
      },
      evidence: [
        `Output GST: Rs.${Math.round(outputGST).toLocaleString()}`,
        `Est. ITC: Rs.${Math.round(estimatedITC).toLocaleString()}`,
        `Net Payable: Rs.${Math.round(netGSTPayable).toLocaleString()}`
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });
  }

  return {
    engine: 'finance',
    recommendations,
    insights: [],
    metrics,
    executionMs: Date.now() - start,
    dataQuality: input.ledgerEntries.length > 5 ? 0.9 : 0.4,
  };
}
