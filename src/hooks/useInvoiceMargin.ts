import { useMemo } from 'react';

export interface LineItemForMargin {
  unit_price: number;
  quantity: number;
  cost_price?: number;
}

export function useInvoiceMargin(lineItems: LineItemForMargin[]) {
  return useMemo(() => {
    const totalRevenue = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const totalCost = lineItems.reduce(
      (sum, item) => sum + item.quantity * (item.cost_price ?? 0),
      0
    );
    const grossProfit = totalRevenue - totalCost;
    const marginPct =
      totalRevenue > 0
        ? Math.round((grossProfit / totalRevenue) * 1000) / 10
        : 0;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      marginPct,
      marginLabel:
        marginPct >= 20 ? 'healthy' :
        marginPct >= 10 ? 'low' : 'critical',
    };
  }, [lineItems]);
}
