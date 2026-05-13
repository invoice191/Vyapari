import { EngineInput, DSSRecommendation } from '../dssService';

export const financialEngine = {
  analyze: (input: EngineInput): DSSRecommendation[] => {
    const recommendations: DSSRecommendation[] = [];
    
    // Check for high receivables (pending invoices)
    const pendingAmount = input.sales
      .filter(s => s.status?.toLowerCase() !== 'paid' && s.payment_status?.toLowerCase() !== 'paid')
      .reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
      
    if (pendingAmount > 50000) {
      recommendations.push({
        id: 'FIN-001',
        type: 'financial',
        title: 'Cash Flow Optimization',
        body: `Rs.${(pendingAmount/1000).toFixed(1)}K is currently tied up in pending invoices.`,
        score: 82,
        impact: 'Improve liquidity by 20%',
        action: 'Trigger automated WhatsApp reminders for overdue payments',
        metadata: { amount: pendingAmount }
      });
    }

    return recommendations;
  }
};
