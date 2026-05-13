import { bankerService, BankerMetrics } from "../bankerService";

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
    
    // Logic for loan limit suggestion (Simple heuristic: 20% of annual revenue)
    // For now, using a placeholder calculation
    const estimatedAnnualRevenue = 1200000; // Mock value
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
        estimatedBurnRate: metrics.currentRatio < 1 ? 75000 : 50000, // Placeholder
      }
    };
  }
};
