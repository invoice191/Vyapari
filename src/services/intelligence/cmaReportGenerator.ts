import { bankerService, BankerMetrics } from "../bankerService";
import { supabase } from "../../lib/supabase";

export interface CMAReport {
  generationDate: string;
  businessSummary: {
    healthScore: number;
    liquidityStatus: string;
    solvencyStatus: string;
  };
  financialHighlights: {
    currentRatio: string;
    quickRatio: string;
    debtToEquity: string;
    cashRunway: string;
  };
  bankingReadiness: {
    qualified: boolean;
    reasoning: string;
    suggestedLoanLimit: number;
  };
  projections: {
    nextQuarterRevenue: number;
    estimatedBurnRate: number;
  };
}

export const cmaReportGenerator = {
  /**
   * Generates a structured Credit Monitoring Arrangement (CMA) report
   * for banking and credit evaluation.
   */
  generateReport: async (businessId: string): Promise<CMAReport> => {
    const metrics: BankerMetrics = await bankerService.getBankerData(businessId);
    
    // Fetch actual revenue from invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('total_amount, created_at')
      .eq('business_id', businessId)
      .eq('status', 'paid')
      .eq('type', 'sale');
      
    let totalRevenue = 0;
    let daysOfData = 30; // Default assumption

    if (invoices && invoices.length > 0) {
      totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const firstInvoiceDate = new Date(Math.min(...invoices.map(i => new Date(i.created_at || new Date()).getTime())));
      const daysDiff = Math.max(1, (new Date().getTime() - firstInvoiceDate.getTime()) / (1000 * 3600 * 24));
      daysOfData = daysDiff;
    }

    // Extrapolate to annual revenue based on daily run rate
    const dailyRevenue = totalRevenue / daysOfData;
    const estimatedAnnualRevenue = Math.max(10000, dailyRevenue * 365); 
    
    // Calculate a realistic burn rate (estimated expenses/outflows)
    const { data: expenses } = await supabase
      .from('ledger_entries')
      .select('amount')
      .eq('business_id', businessId)
      .eq('type', 'debit')
      .eq('category', 'expense');
      
    const totalExpenses = (expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const estimatedMonthlyBurnRate = Math.max(5000, (totalExpenses / daysOfData) * 30);

    const suggestedLimit = Math.floor(estimatedAnnualRevenue * 0.2 * (metrics.loanEligibility.score / 100));

    return {
      generationDate: new Date().toISOString(),
      businessSummary: {
        healthScore: metrics.loanEligibility.score,
        liquidityStatus: metrics.currentRatio > 1.2 ? 'Healthy' : 'Tight',
        solvencyStatus: metrics.debtToEquity < 0.6 ? 'Stable' : 'Leveraged',
      },
      financialHighlights: {
        currentRatio: metrics.currentRatio.toFixed(2),
        quickRatio: metrics.quickRatio.toFixed(2),
        debtToEquity: metrics.debtToEquity.toFixed(2),
        cashRunway: `${metrics.cashRunway.months.toFixed(1)} months`,
      },
      bankingReadiness: {
        qualified: metrics.loanEligibility.qualified,
        reasoning: metrics.loanEligibility.reason,
        suggestedLoanLimit: suggestedLimit,
      },
      projections: {
        nextQuarterRevenue: Math.floor(estimatedAnnualRevenue / 4 * (1 + metrics.revenueGrowth.qoq / 100)),
        estimatedBurnRate: Math.floor(estimatedMonthlyBurnRate),
      }
    };
  }
};
