import { supabase } from "../lib/supabase";

export const accountingService = {
  /**
   * Generates real-time Profit & Loss metrics by aggregating invoices and ledger movements.
   */
  getProfitLossData: async (businessId: string, startDate: string, endDate: string) => {
    // 1. Fetch Inbound Revenue (Sales)
    const { data: salesData, error: sErr } = await supabase
      .from('invoices')
      .select('total_amount, created_at')
      .eq('business_id', businessId)
      .eq('is_purchase', false)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate);
    
    if (sErr) throw sErr;

    // 2. Fetch Direct COGS (Purchase Invoices)
    const { data: directCosts, error: cErr } = await supabase
      .from('invoices')
      .select('total_amount, created_at')
      .eq('business_id', businessId)
      .eq('is_purchase', true)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate);
    
    if (cErr) throw cErr;

    // 3. Fetch Indirect Expenses from General Ledger
    const { data: generalExpenses, error: gErr } = await supabase
      .from('ledger_entries')
      .select('amount, category, timestamp')
      .eq('business_id', businessId)
      .eq('type', 'debit') // Assuming debit is outlay here.
      .gte('timestamp', `${startDate}T00:00:00`)
      .lte('timestamp', `${endDate}T23:59:59`);
    
    if (gErr) throw gErr;

    // Summarize
    const totalRevenue = salesData?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0;
    const totalCOGS = directCosts?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0;
    
    // Group expenses by category
    const expenseMap: Record<string, number> = {};
    let totalIndirect = 0;
    
    generalExpenses?.forEach(ex => {
      const cat = ex.category || 'Other General';
      // Filter out items that are potentially direct invoice double-counts if applicable. 
      // In real usage, only category='expense' or similar logic. We will aggregate everything for now.
      expenseMap[cat] = (expenseMap[cat] || 0) + Number(ex.amount || 0);
      totalIndirect += Number(ex.amount || 0);
    });

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalIndirect;

    return {
      revenue: totalRevenue,
      cogs: totalCOGS,
      grossProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      expenses: expenseMap,
      totalExpenses: totalIndirect,
      netProfit,
      netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    };
  },

  /**
   * Snapshots current Assets, Liabilities and Equity based on present values
   */
  getBalanceSheet: async (businessId: string) => {
    // 1. Assets: Current Cash Position & Receivables
    const { data: inventoryValue } = await supabase
      .from('products')
      .select('quantity, cost_price')
      .eq('business_id', businessId);
    
    const { data: receivables } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('business_id', businessId)
      .eq('is_purchase', false)
      .eq('payment_status', 'unpaid'); // Assuming payment_status column is mapped

    // 2. Liabilities: Payables & Outstanding Loans
    const { data: payables } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('business_id', businessId)
      .eq('is_purchase', true)
      .eq('payment_status', 'unpaid');
    
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('remaining_amount')
      .eq('business_id', businessId)
      .eq('status', 'active');

    // Calculate totals
    const assetInventory = inventoryValue?.reduce((sum, p) => sum + (Number(p.quantity || 0) * Number(p.cost_price || 0)), 0) || 0;
    const assetReceivables = receivables?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0;
    
    const liabilityPayables = payables?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0;
    const liabilityLoans = activeLoans?.reduce((sum, l) => sum + Number(l.remaining_amount || 0), 0) || 0;

    const totalAssets = assetInventory + assetReceivables;
    const totalLiabilities = liabilityPayables + liabilityLoans;
    const netEquity = totalAssets - totalLiabilities;

    return {
      assets: {
        inventory: assetInventory,
        receivables: assetReceivables,
        total: totalAssets
      },
      liabilities: {
        payables: liabilityPayables,
        loans: liabilityLoans,
        total: totalLiabilities
      },
      equity: netEquity
    };
  }
};
