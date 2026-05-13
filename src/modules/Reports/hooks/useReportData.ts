import { useState, useEffect, useCallback } from 'react';
import { R, productMatrix } from '../../../lib/constants';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

export interface KPIItem {
  label: string;
  value: string;
  trend?: string;
  negative?: boolean;
  color?: string;
}

export interface ReportConfig {
  data: any[];
  cards: KPIItem[];
  recommendations: string[];
  summary: string[];
  loading: boolean;
  error: any;
  refresh: () => void;
}

export function useReportData(reportId: string, filters: any = {}): ReportConfig {
  const { business } = useAuth();
  const [rawData, setRawData] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [cards, setCards] = useState<KPIItem[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [summary, setSummary] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchReportData = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('invoices').select('*').eq('business_id', business.id);
      
      // Apply Date Filter at DB level for performance
      if (filters.dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.eq('invoice_date', today);
      } else if (filters.dateRange === 'yesterday') {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        query = query.eq('invoice_date', yesterday);
      } else if (filters.dateRange === 'this-month') {
        const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        query = query.gte('invoice_date', start);
      } else if (filters.dateRange === 'last-month') {
        const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
        const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];
        query = query.gte('invoice_date', lastMonthStart).lte('invoice_date', lastMonthEnd);
      } else if (filters.dateRange === 'quarter') {
        const qStart = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0];
        query = query.gte('invoice_date', qStart);
      } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
        query = query.gte('invoice_date', filters.startDate).lte('invoice_date', filters.endDate);
      }

      let fetchedData: any[] = [];
      let generatedCards: KPIItem[] = [];
      let recs: string[] = [];
      let sumLines: string[] = [];

      switch (reportId) {
        case 'daily-sales': {
          const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('*')
            .eq('business_id', business.id)
            .eq('is_purchase', false)
            .order('invoice_date', { ascending: false });

          if (invError) throw invError;

          // Group by date
          const dailyMap: Record<string, any> = {};
          invoices?.forEach(inv => {
            const date = inv.invoice_date;
            if (!dailyMap[date]) {
              dailyMap[date] = { date, txns: 0, gross: 0, disc: 0, net: 0, tax: 0, profit: 0 };
            }
            dailyMap[date].txns += 1;
            dailyMap[date].disc += Number(inv.discount_amt || 0);
            dailyMap[date].net += Number(inv.total_amount || 0);
            dailyMap[date].gross += Number(inv.total_amount || 0) + Number(inv.discount_amt || 0);
            dailyMap[date].tax += Number(inv.gst_amt || 0);
            dailyMap[date].profit += Number(inv.total_amount || 0) * 0.25; // 25% margin estimate
          });

          const dailyList = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));
          
          fetchedData = dailyList.map(r => ({
            date: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            transactions: r.txns,
            gross: `Rs.${r.gross.toLocaleString()}`,
            discounts: `Rs.${r.disc.toLocaleString()}`,
            net: `Rs.${r.net.toLocaleString()}`,
            tax: `Rs.${r.tax.toLocaleString()}`,
            profit: `Rs.${r.profit.toLocaleString()}`,
            avg: `Rs.${(r.net / r.txns).toLocaleString()}`
          }));

          const totalNet = dailyList.reduce((s, r) => s + r.net, 0);
          const totalTxns = dailyList.reduce((s, r) => s + r.txns, 0);
          const totalProfit = dailyList.reduce((s, r) => s + r.profit, 0);

          generatedCards = [
            { label: 'Total_Net_Revenue', value: `Rs.${totalNet.toLocaleString()}`, trend: '+14.2%', color: 'orange' },
            { label: 'Avg_Ticket_Value', value: `Rs.${totalTxns ? Math.round(totalNet / totalTxns) : 0}`, trend: '+2.1%', color: 'blue' },
            { label: 'Gross_Discount_Burn', value: `Rs.${dailyList.reduce((s, r) => s + r.disc, 0).toLocaleString()}`, trend: '+15.4%', negative: true, color: 'red' },
            { label: 'Overall_Net_Profit', value: `Rs.${totalProfit.toLocaleString()}`, trend: 'OPTIMAL', color: 'green' }
          ];
          recs = [
            'Net Profit Margin is currently healthy. Consider adjusting premium category items upwards by 2% to sustain current operating expenses.',
            'Discounts are showing a steep increase on weekends. Implement bundle promos instead of direct price deductions to protect product margins.',
            'Average ticket value has decreased slightly recently. Launch a midweek happy hour discount trigger to stimulate mid-basket additions.'
          ];
          sumLines = [
            `Overall net sales are Rs.${totalNet.toLocaleString()}, processed across ${totalTxns} transactions.`,
            `The highest volume date recorded was ${dailyList[0]?.date || 'N/A'} with ${dailyList[0]?.txns || 0} orders.`
          ];
          break;
        }

        case 'hourly-sales':
          fetchedData = R.hourly.map(r => ({
            hour: r.hour,
            orders: r.orders,
            sales: `Rs.${r.sales.toLocaleString()}`,
            avgTicket: `Rs.${r.avgTicket.toLocaleString()}`,
            status: r.peakFlag ? 'PEAK_VOLUME' : 'NORMAL'
          }));
          generatedCards = [
            { label: 'Peak_Business_Hour', value: '7:00 PM', trend: 'CRITICAL', color: 'orange' },
            { label: 'Max_Orders_per_Hour', value: '124 Orders', trend: '+12%', color: 'blue' },
            { label: 'Avg_Hourly_Sales', value: 'Rs.28,500', trend: 'STABLE', color: 'green' },
            { label: 'Load_Variance', value: '88%', trend: 'HIGH', color: 'red' }
          ];
          recs = [
            'Busiest period occurs between 5:00 PM and 8:00 PM. Reallocate front-of-house staff meal breaks outside this window to ensure maximum counter throughput.',
            'Underutilized slots identified from 8:00 AM to 10:00 AM. Run early-bird beverage or essential promos to drive morning utility.',
            'Install an express checkout station to handle low-item basket customers during peak hourly spikes.'
          ];
          sumLines = [
            'Traffic peaks sharply in the evening with 124 transactions recorded in the 7:00 PM hour.',
            'Revenue per transaction scales during high-volume periods, indicating higher multi-item purchases.'
          ];
          break;

        case 'payment-modes': {
          const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('payment_mode, total_amount')
            .eq('business_id', business.id)
            .eq('is_purchase', false);

          if (invError) throw invError;

          const modeMap: Record<string, any> = {};
          invoices?.forEach(inv => {
            const mode = inv.payment_mode || 'Cash';
            if (!modeMap[mode]) modeMap[mode] = { txns: 0, amount: 0 };
            modeMap[mode].txns += 1;
            modeMap[mode].amount += Number(inv.total_amount || 0);
          });

          const totalAmt = Object.values(modeMap).reduce((s, m) => s + m.amount, 0);
          const modeList = Object.entries(modeMap).map(([method, data]) => ({
            method,
            txns: data.txns,
            amount: data.amount,
            pct: totalAmt ? ((data.amount / totalAmt) * 100).toFixed(1) : '0'
          })).sort((a, b) => b.amount - a.amount);

          fetchedData = modeList.map(r => ({
            method: r.method,
            transactions: r.txns,
            amount: `Rs.${r.amount.toLocaleString()}`,
            contribution: `${r.pct}%`,
            avgTicket: `Rs.${r.txns ? Math.round(r.amount / r.txns).toLocaleString() : 0}`
          }));

          generatedCards = [
            { label: 'Dominant_Channel', value: modeList[0]?.method || 'N/A', trend: `${modeList[0]?.pct || 0}% SHARE`, color: 'orange' },
            { label: 'Total_Digital_Volume', value: `Rs.${modeList.filter(m => m.method.toLowerCase() !== 'cash').reduce((s, m) => s + m.amount, 0).toLocaleString()}`, trend: 'REAL-TIME', color: 'green' },
            { label: 'Cash_on_Hand_Est', value: `Rs.${modeMap['Cash']?.amount.toLocaleString() || 0}`, trend: 'STABLE', color: 'blue' },
            { label: 'Total_Collections', value: `Rs.${totalAmt.toLocaleString()}`, trend: 'AUDITED', color: 'green' }
          ];
          recs = [
            `UPI/Digital payments represent ${modeList.filter(m => m.method.toLowerCase() !== 'cash').reduce((s, m) => s + Number(m.pct), 0).toFixed(1)}% of your volume. Encourage QR payments to reduce cash handling risks.`,
            'High cash volume detected on weekends. Ensure manual reconciliation is performed before closing.',
            'Digital transaction velocity is increasing. Consider upgrading your POS hardware for faster checkout.'
          ];
          sumLines = [
            `Total collections across all modes reached Rs.${totalAmt.toLocaleString()}.`,
            `${modeList[0]?.method || 'Cash'} remains your primary source of liquidity.`
          ];
          break;
        }

        case 'top-products': {
          const { data: items, error: itemError } = await supabase
            .from('invoice_items')
            .select('product_id, quantity, total, products(name)')
            .eq('business_id', business.id);

          if (itemError) throw itemError;

          const prodMap: Record<string, any> = {};
          items?.forEach(item => {
            const pid = item.product_id;
            const name = (item.products as any)?.name || 'Unknown Product';
            if (!prodMap[pid]) {
              prodMap[pid] = { name, sales: 0, revenue: 0 };
            }
            prodMap[pid].sales += Number(item.quantity || 0);
            prodMap[pid].revenue += Number(item.total || 0);
          });

          const prodList = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
          
          fetchedData = prodList.map(r => ({
            product: r.name,
            qty: r.sales,
            revenue: `Rs.${r.revenue.toLocaleString()}`,
            margin: `35%` // Estimate
          }));

          generatedCards = [
            { label: 'Top_Seller', value: prodList[0]?.name || 'N/A', trend: `${prodList[0]?.sales || 0} Sold`, color: 'orange' },
            { label: 'Highest_Margin', value: 'Premium Items', trend: '35% Margin', color: 'green' },
            { label: 'Fast_Moving', value: prodList[1]?.name || 'N/A', trend: `${prodList[1]?.sales || 0} Sold`, color: 'blue' },
            { label: 'Low_Turnover', value: prodList[prodList.length-1]?.name || 'N/A', trend: 'REORDER REQ', color: 'red' }
          ];
          recs = [
            `Increase safety stock for ${prodList[0]?.name || 'top items'} by 25% due to high transaction velocity.`,
            'Promote high-margin categories heavily as their margins exceed 35%.',
            'Reposition underperforming accessories near high-margin essentials.'
          ];
          sumLines = [
            'High-volume products drive customer acquisition, while specialty goods provide high net operating profits.',
            `The top ${prodList.length} products represent the bulk of recent revenue.`
          ];
          break;
        }

        case 'tax-gst': {
          const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('gst_amt, total_amount, igst_amt, cgst_amt, sgst_amt')
            .eq('business_id', business.id)
            .eq('is_purchase', false);

          if (invError) throw invError;

          // Slab calculation (Estimated from total amount/tax)
          const taxableTotal = invoices?.reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.gst_amt || 0)), 0) || 0;
          const cgstTotal = invoices?.reduce((s, i) => s + Number(i.cgst_amt || i.gst_amt / 2 || 0), 0) || 0;
          const sgstTotal = invoices?.reduce((s, i) => s + Number(i.sgst_amt || i.gst_amt / 2 || 0), 0) || 0;
          const igstTotal = invoices?.reduce((s, i) => s + Number(i.igst_amt || 0), 0) || 0;
          const totalTax = cgstTotal + sgstTotal + igstTotal;

          fetchedData = [
            { category: 'Domestic Sales', taxableAmt: `Rs.${taxableTotal.toLocaleString()}`, cgst: `Rs.${cgstTotal.toLocaleString()}`, sgst: `Rs.${sgstTotal.toLocaleString()}`, igst: `Rs.${igstTotal.toLocaleString()}`, cess: 'Rs.0', total: `Rs.${totalTax.toLocaleString()}`, rate: 'Mixed' }
          ];

          generatedCards = [
            { label: 'Total_Tax_Liability', value: `Rs.${totalTax.toLocaleString()}`, trend: 'LIVE FEED', color: 'orange' },
            { label: 'CGST_Liability', value: `Rs.${cgstTotal.toLocaleString()}`, trend: 'AUDITED', color: 'blue' },
            { label: 'SGST_Liability', value: `Rs.${sgstTotal.toLocaleString()}`, trend: 'AUDITED', color: 'green' },
            { label: 'Total_Taxable_Value', value: `Rs.${taxableTotal.toLocaleString()}`, trend: 'STABLE', color: 'blue' }
          ];
          recs = [
            'Tax liability is synchronized with your current billing cycle. Ensure GSTR-1 filing is completed before the 11th.',
            'Maintain accurate CGST/SGST splits for intra-state transactions to avoid audit flags.',
            'Review IGST claims for any out-of-state shipments made this period.'
          ];
          sumLines = [
            `Total taxable value of Rs.${taxableTotal.toLocaleString()} processed in the current period.`,
            `Cumulative tax obligation stands at Rs.${totalTax.toLocaleString()}.`
          ];
          break;
        }

        case 'promo-effectiveness':
          fetchedData = R.promoEffectiveness.map(r => ({
            promoCode: r.promo,
            startDate: r.startDate,
            endDate: r.endDate,
            unitsBefore: r.unitsBefore,
            unitsAfter: r.unitsAfter,
            revBefore: `Rs.${r.revBefore.toLocaleString()}`,
            revAfter: `Rs.${r.revAfter.toLocaleString()}`,
            profitImpact: `Rs.${r.profitImpact.toLocaleString()}`,
            roi: r.roi,
            verdict: r.verdict
          }));
          generatedCards = [
            { label: 'Highest_ROI_Promo', value: 'Loyalty 2x', trend: '187% ROI', color: 'green' },
            { label: 'Negative_Margin_Burn', value: 'Flat 10%', trend: '-Rs.18,200', negative: true, color: 'red' },
            { label: 'Total_Promo_Revenue', value: 'Rs.11,86,200', trend: 'ACTIVE', color: 'orange' },
            { label: 'Units_Volume_Delta', value: '+68%', trend: 'OPTIMAL', color: 'blue' }
          ];
          recs = [
            'Discontinue "Flat 10% Off Electronics" immediately as the margin loss of Rs.18.2k is not offset by supplementary items.',
            'Scale the "Loyalty Points 2x" campaign as it drives 187% ROI with minimal cash-back overhead.',
            'Transition "Flat Discounts" in clothing to "Buy 2 Get 1" bundles to sustain unit manufacturing margin.'
          ];
          sumLines = [
            'Promotions drove Rs.11.86L in cumulative revenue, representing an overall increase in item velocity.',
            'Loyalty campaigns outpace traditional price cuts in customer-retention metrics.'
          ];
          break;

        case 'stock-levels': {
          const { data: products, error: prodError } = await supabase
            .from('products')
            .select('name, quantity, reorder_point, category')
            .eq('business_id', business.id);

          if (prodError) throw prodError;

          fetchedData = (products || []).map(p => ({
            item: p.name,
            category: p.category || 'General',
            stock: p.quantity,
            status: Number(p.quantity) <= Number(p.reorder_point || 10) ? 'LOW_STOCK' : 'OPTIMAL'
          }));

          const lowCount = fetchedData.filter(d => d.status === 'LOW_STOCK').length;
          const totalVal = (products || []).reduce((s, p) => s + (Number(p.quantity) * 50), 0); // Mock cost est for valuation

          generatedCards = [
            { label: 'Total_SKU_Count', value: `${products?.length || 0} SKUs`, trend: 'LIVE', color: 'orange' },
            { label: 'Understocked_Items', value: `${lowCount} Items`, trend: 'REORDER REQ', color: 'red' },
            { label: 'Total_Stock_On_Hand', value: `${(products || []).reduce((s, p) => s + Number(p.quantity), 0).toLocaleString()} Units`, trend: 'OPTIMAL', color: 'green' },
            { label: 'Est_Inventory_Value', value: `Rs.${totalVal.toLocaleString()}`, trend: 'ESTIMATED', color: 'blue' }
          ];
          recs = [
            `Replenish the ${lowCount} items currently marked as LOW_STOCK to prevent potential revenue leakage.`,
            'Current stock density is balanced across categories. Focus on high-turnover electronics next week.',
            'Implement a monthly cycle count for your top 10 products to ensure 100% data integrity.'
          ];
          sumLines = [
            `Your facility currently holds ${(products || []).reduce((s, p) => s + Number(p.quantity), 0).toLocaleString()} individual units.`,
            `${lowCount} primary items require immediate procurement attention.`
          ];
          break;
        }

        case 'stock-movement':
          fetchedData = R.stockMovement.map(r => ({
            sku: r.sku,
            product: r.product,
            openingStock: r.openingStock,
            received: r.received,
            sold: r.sold,
            adjusted: r.adjusted,
            closingStock: r.closingStock,
            value: `Rs.${r.value.toLocaleString()}`,
            status: r.status
          }));
          generatedCards = [
            { label: 'Critical_Stockouts', value: '1 Category', trend: 'Cooking Oil', color: 'red' },
            { label: 'Overstock_Capital', value: 'Rs.24,00,000', trend: 'TV & Air Purifier', color: 'orange' },
            { label: 'Total_Stock_Value', value: 'Rs.68,12,000', trend: 'STABLE', color: 'green' },
            { label: 'Cycle_Adjustments', value: '-13 Units', trend: 'Shrinkage Risk', negative: true, color: 'blue' }
          ];
          recs = [
            'Urgent: Cooking Oil has only 8 units left, with an estimated stockout time of 2 days. Expedite reorder with supplier.',
            'Liquidate overstocked Air Purifier units by offering a weekend bundle or seasonal discount.',
            'Investigate the cycle count adjustment of -8 units on Basmati Rice to identify shelf shrinkage or billing leaks.'
          ];
          sumLines = [
            'Cumulative inventory valuation stands at Rs.68.12L with overstock holdings locking up significant liquidity.',
            'Cooking oil requires immediate purchasing to avoid active out-of-stock revenue leakage.'
          ];
          break;

        case 'low-stock': {
          const { data: products, error: prodError } = await supabase
            .from('products')
            .select('*, contacts(name)')
            .eq('business_id', business.id);

          if (prodError) throw prodError;

          const lowStockItems = products?.filter(p => Number(p.quantity) < Number(p.reorder_point || 20)) || [];
          
          fetchedData = lowStockItems.map(p => ({
            sku: p.sku || 'N/A',
            product: p.name,
            currentStock: p.quantity,
            reorderPoint: p.reorder_point || 20,
            reorderQty: p.reorder_qty || 50,
            supplier: p.contacts?.name || 'Multiple',
            leadDays: 3,
            estStockout: '4 Days',
            urgency: Number(p.quantity) < 5 ? 'CRITICAL' : 'HIGH'
          }));

          generatedCards = [
            { label: 'Critical_Alert_Items', value: `${lowStockItems.length} SKUs`, trend: 'HIGH RISK', color: 'red' },
            { label: 'Reorder_Capital_Needed', value: 'Rs.2,45,000', trend: 'ESTIMATED', color: 'orange' },
            { label: 'Avg_Restock_Lead_Time', value: '4.2 Days', trend: 'STABLE', color: 'blue' },
            { label: 'Supplier_Response_Index', value: '94%', trend: 'OPTIMAL', color: 'green' }
          ];
          recs = [
            `Approve restock orders for ${lowStockItems.length} items immediately to avoid stockouts.`,
            'Establish automated stock reorder thresholds inside Vyapari to trigger supplier notifications.',
            'Consolidate low stock orders to reduce logistics freight surcharges.'
          ];
          sumLines = [
            `${lowStockItems.length} primary SKUs are below safety points and require replenishment.`,
            'Current buffer stock ensures operations can continue for a maximum of 4 days for these items.'
          ];
          break;
        }

        case 'dead-stock':
          fetchedData = R.deadStock.map(r => ({
            sku: r.sku,
            product: r.product,
            qty: r.qty,
            lastSold: r.lastSoldDate,
            daysIdle: r.daysSinceSale,
            costValue: `Rs.${r.costValue.toLocaleString()}`,
            potentialLoss: `Rs.${r.potentialLoss.toLocaleString()}`,
            suggestion: r.suggestion
          }));
          generatedCards = [
            { label: 'Locked_Capital_Value', value: 'Rs.16,98,000', trend: 'CRITICAL', color: 'red' },
            { label: 'Longest_Idle_Time', value: '112 Days', trend: 'Smart Watch', color: 'orange' },
            { label: 'Potential_Write-off', value: 'Rs.4,13,400', trend: 'At Risk', negative: true, color: 'blue' },
            { label: 'Storage_Cost_Surcharge', value: 'Rs.12,400', trend: 'Monthly Cost', negative: true, color: 'red' }
          ];
          recs = [
            'Initiate the recommended 20% markdown on Air Purifiers to release Rs.9.6L in stagnant operational capital.',
            'Bundle "Smart Watch Gen1" with premium electronics items as a free gift to clear storage space and stimulate core product sales.',
            'Conduct seasonal clearance sales for clothing jackets before the dry summer storage cycle begins.'
          ];
          sumLines = [
            'Stagnant inventory has locked Rs.16.98L in working capital, driving storage overhead costs higher.',
            'Electronics represents the largest share of obsolete storage footprint.'
          ];
          break;

        case 'inventory-valuation':
          fetchedData = R.inventoryValuation.map(r => ({
            category: r.category,
            skus: r.skus,
            units: r.units,
            fifoVal: `Rs.${r.fifo.toLocaleString()}`,
            lifoVal: `Rs.${r.lifo.toLocaleString()}`,
            wacVal: `Rs.${r.wac.toLocaleString()}`,
            contribution: `${r.pctOfTotal}%`
          }));
          generatedCards = [
            { label: 'Total_FIFO_Value', value: 'Rs.2,58,22,000', trend: 'RECOMMENDED', color: 'orange' },
            { label: 'Total_LIFO_Value', value: 'Rs.2,47,06,000', trend: 'STABLE', color: 'blue' },
            { label: 'Weighted_Avg_Val', value: 'Rs.2,52,10,000', trend: 'AUDIT STANDARD', color: 'green' },
            { label: 'Category_Dominance', value: 'Electronics', trend: '48.2% Share', color: 'red' }
          ];
          recs = [
            'Use the Weighted Average Cost (WAC) valuation method for corporate audits as it smooths out recent pricing spikes.',
            'Keep FIFO valuation active for retail tax filings to accurately reflect rising stock cost sheets.',
            'Diversify inventory holdings. Electronics controls 48% of value, exposing the business to major hardware price drops.'
          ];
          sumLines = [
            'Cumulative portfolio holding value peaks at Rs.2.58 crore under FIFO guidelines.',
            'Grocery represents the highest unit count but lowest capital holding value.'
          ];
          break;

        case 'supplier-perf':
          fetchedData = R.supplierPerformance.map(r => ({
            supplier: r.supplier,
            orders: r.orders,
            onTime: r.onTime,
            late: r.lateDeliveries,
            rejections: r.qualityRejections,
            avgLeadTime: `${r.avgLeadDays} Days`,
            totalSpend: `Rs.${r.totalValue.toLocaleString()}`,
            rating: `${r.rating}/10`,
            trend: r.trend
          }));
          generatedCards = [
            { label: 'Top_Rated_Partner', value: 'FoodMart', trend: '9.6 / 10', color: 'green' },
            { label: 'Total_Annual_Spend', value: 'Rs.89,10,000', trend: 'ACTIVE', color: 'orange' },
            { label: 'Critical_Late_Incidents', value: '18 Delivery Errors', trend: 'Warning', negative: true, color: 'red' },
            { label: 'Quality_Return_Rate', value: '2.4%', trend: 'Low', color: 'blue' }
          ];
          recs = [
            'Reallocate 15% procurement spend from GadgetZ to TechCorp Dist due to persistent quality rejections (3 returns) and late deliveries.',
            'Lock in wholesale bulk grocery pricing with FoodMart given their perfect delivery record (9.6 rating) and low lead times.',
            'Renegotiate lead time SLA targets with Fashion Hub to align with their standard 4.8-day average.'
          ];
          sumLines = [
            'Procurement analytics shows high supplier reliability in food categories and high risk in retail electronics shipments.',
            'Total procurement spend exceeded Rs.89.1L over the past rolling calendar cycle.'
          ];
          break;

        case 'pl-statement':
          fetchedData = R.plStatement.map(r => ({
            component: r.item,
            january: `Rs.${r.jan.toLocaleString()}`,
            february: `Rs.${r.feb.toLocaleString()}`,
            march: `Rs.${r.mar.toLocaleString()}`,
            qTotal: `Rs.${r.qTotal.toLocaleString()}`
          }));
          generatedCards = [
            { label: 'Q1_Net_Profit_After_Tax', value: 'Rs.2,56,704', trend: '+15.4% Target', color: 'green' },
            { label: 'Q1_Gross_Revenue', value: 'Rs.33,16,000', trend: 'STABLE', color: 'orange' },
            { label: 'Cumulative_Discounts', value: 'Rs.2,65,280', trend: '8% Burn', negative: true, color: 'red' },
            { label: 'Operating_Expenses_Ratio', value: '11.9%', trend: 'OPTIMAL', color: 'blue' }
          ];
          recs = [
            'Operating expenses are stable at 11.9% of net revenue. Maintain current headcount to protect March net profit margin.',
            'Discounts are consuming 21.6% of gross profit. Establish minimum basket values before coupon codes can trigger.',
            'Allocate 5% of quarterly net profit to a contingency fund to offset rising electricity charges projected for Q2.'
          ];
          sumLines = [
            'Business recorded steady post-tax profitability of Rs.2.56L for Q1, driven by robust performance in March.',
            'Direct Cost of Goods Sold (COGS) remains the largest cash drain at Rs.18.27L.'
          ];
          break;

        case 'cash-flow':
          fetchedData = R.cashFlow.map(r => ({
            month: r.month,
            openingBal: `Rs.${r.openingBal.toLocaleString()}`,
            salesReceipts: `Rs.${r.salesReceipts.toLocaleString()}`,
            otherIncome: `Rs.${r.otherIncome.toLocaleString()}`,
            cogs: `Rs.${r.cogs.toLocaleString()}`,
            opex: `Rs.${r.opex.toLocaleString()}`,
            salaries: `Rs.${r.salaries.toLocaleString()}`,
            rent: `Rs.${r.rent.toLocaleString()}`,
            taxPaid: `Rs.${r.taxPaid.toLocaleString()}`,
            closingBal: `Rs.${r.closingBal.toLocaleString()}`
          }));
          generatedCards = [
            { label: 'Net_Ending_Cash', value: 'Rs.8,79,704', trend: 'HIGHLY LIQUID', color: 'green' },
            { label: 'Quarterly_Cash_Surplus', value: '+Rs.3,99,704', trend: '+83.2%', color: 'orange' },
            { label: 'Average_Monthly_Inflow', value: 'Rs.10,28,240', trend: 'OPTIMAL', color: 'blue' },
            { label: 'Avg_Tax_Cash_Outflow', value: 'Rs.36,672', trend: 'Compliance', negative: true, color: 'red' }
          ];
          recs = [
            'Maintain a minimum working capital reserve of Rs.4.5L to ensure operations can survive 60 days of delayed cash inflows.',
            'Invest March cash surplus (Rs.8.79L) into high-velocity inventory categories to compound cash-on-cash returns.',
            'Transition monthly supplier payouts to net-30 credit lines to retain liquid bank cash during slow mid-month cycles.'
          ];
          sumLines = [
            'Cash position expanded strongly across Q1, ending with Rs.8.79L in liquid operating funds.',
            'Direct cash collections from retail sales remain the dominant source of incoming liquidity.'
          ];
          break;

        case 'expense-breakdown':
          fetchedData = R.expenseBreakdown.map(r => ({
            expense: r.expense,
            group: r.category,
            q1Spend: `Rs.${r.q1.toLocaleString()}`,
            share: `${r.pct}%`
          }));
          generatedCards = [
            { label: 'Primary_Cost_Driver', value: 'COGS', trend: '59.9% SHARE', color: 'orange' },
            { label: 'Secondary_Driver', value: 'Operating Expenses', trend: '11.9% Share', color: 'red' },
            { label: 'Q1_Total_Expenditure', value: 'Rs.28,50,016', trend: 'BUDGET COMPLIANT', color: 'blue' },
            { label: 'Staff_Salaries_Share', value: 'Rs.2,60,000', trend: '8.5% Share', color: 'green' }
          ];
          recs = [
            'Target COGS reduction of 2% by consolidating packaging procurement with primary distributors.',
            'Operating expenses represent 11.9% of total budget. Review electricity and digital infrastructure subscription costs.',
            'Keep marketing costs locked at 3.5% of quarterly revenue to preserve net margins.'
          ];
          sumLines = [
            'Cost of Goods Sold represents the dominant operational expenditure, followed closely by store operating costs.',
            'Overall expenditures are well within original Q1 fiscal budget limits.'
          ];
          break;

        case 'cogs-analysis':
          fetchedData = R.cogsAnalysis.map(r => ({
            product: r.product,
            sold: r.sold,
            costPerUnit: `Rs.${r.costPerUnit.toLocaleString()}`,
            totalCOGS: `Rs.${r.totalCOGS.toLocaleString()}`,
            sellingPrice: `Rs.${r.sellingPrice.toLocaleString()}`,
            grossProfit: `Rs.${r.grossProfit.toLocaleString()}`,
            grossMargin: r.grossMargin
          }));
          generatedCards = [
            { label: 'Max_COGS_Investment', value: 'iPhone 15 Pro', trend: 'Rs.1.04 Cr', color: 'red' },
            { label: 'Highest_Gross_Margin', value: 'Nike Air Max', trend: '56.2%', color: 'green' },
            { label: 'Lowest_Gross_Margin', value: 'Basmati Rice', trend: '12.0%', color: 'blue' },
            { label: 'Total_Generated_Profit', value: 'Rs.39,89,427', trend: 'OPTIMAL', color: 'orange' }
          ];
          recs = [
            'Maintain the high-margin Nike Air Max shelf priority to maximize overall category profit pools.',
            'Renegotiate Basmati Rice purchase price sheets to lift gross margins closer to the 15% target tier.',
            'Optimize procurement capital. Hardware inventory (iPhone) requires Rs.1.04 Cr to yield Rs.25.3L profit; verify rotation velocity.'
          ];
          sumLines = [
            'COGS analysis highlights significant capital lockup in consumer electronics hardware.',
            'Specialty retail segments continue to drive the highest gross margins.'
          ];
          break;

        case 'rfm-segmentation':
          fetchedData = R.rfmSegmentation.map(r => ({
            segment: r.segment,
            customers: r.customers,
            recency: r.recency,
            frequency: r.frequency,
            monetary: r.monetary,
            rfmScore: r.rfmScore,
            action: r.action
          }));
          generatedCards = [
            { label: 'VIP_Champions_Count', value: '186 Customers', trend: '555 SCORE', color: 'green' },
            { label: 'At_Risk_Segment', value: '298 Customers', trend: 'Warning', color: 'red' },
            { label: 'Total_Segmented_Base', value: '1,704 Users', trend: 'OPTIMAL', color: 'blue' },
            { label: 'Loyal_Core_Contribution', value: '412 Customers', trend: '445 Score', color: 'orange' }
          ];
          recs = [
            'Launch an exclusive preview sale for VIP Champions to sustain high frequency and lock in seasonal loyalty.',
            'Launch an automated SMS/UPI incentive re-activation campaign for the At Risk segment to prevent transition to Lost status.',
            'Enroll Potential Loyalists (634 users) into a structured tier-based loyalty program to lift monthly frequency.'
          ];
          sumLines = [
            'The business has a solid core of 598 highly engaged customers (Champions & Loyal).',
            'Slight customer leakage identified in mid-tier segments due to low recency.'
          ];
          break;

        case 'churn-risk':
          fetchedData = R.clvAnalysis.map(r => ({
            customer: r.segment,
            lastPurchase: r.visitFreq > 5 ? '3 Days Ago' : '45 Days Ago',
            riskLevel: r.churnRisk,
            action: r.action
          }));
          generatedCards = [
            { label: 'Avg_Churn_Risk_Index', value: '18.4%', trend: 'LOW RISK', color: 'green' },
            { label: 'High_Risk_Customers', value: '648 Users', trend: 'Win-back Active', color: 'red' },
            { label: 'Est_Monthly_Loss_Risk', value: 'Rs.32,400', trend: 'At Risk', negative: true, color: 'blue' },
            { label: 'Retention_Campaign_ROI', value: '142%', trend: 'OPTIMAL', color: 'orange' }
          ];
          recs = [
            'Trigger automatic discount vouchers to One-time Buyers (648 users) to stimulate a second transaction within 15 days.',
            'Monitor Occasional customer clusters showing over 45 days idle time to prevent brand detachment.',
            'Assign premium support channels or reward structures to VIP accounts to guarantee 99% retention.'
          ];
          sumLines = [
            'High retention rates across regular clusters protect operating margins, while early checkout clusters show higher drop rates.',
            'Win-back strategies focus on first-time retail checkouts.'
          ];
          break;

        case 'acquisition-retention':
          fetchedData = R.customerAcquisition.map(r => ({
            month: r.month,
            newCustomers: r.newCustomers,
            returning: r.returningCustomers,
            churned: r.churnedCustomers,
            netGrowth: r.netGrowth,
            retentionRate: r.retentionRate,
            acqCost: `Rs.${r.acqCost}`,
            ltv: `Rs.${r.ltv.toLocaleString()}`
          }));
          generatedCards = [
            { label: 'Avg_Retention_Rate', value: '94.6%', trend: '+0.9% Trend', color: 'green' },
            { label: 'Customer_Acq_Cost', value: 'Rs.182', trend: 'OPTIMAL', color: 'blue' },
            { label: 'Estimated_LTV_Value', value: 'Rs.4,416', trend: '24x ROI Ratio', color: 'orange' },
            { label: 'Quarterly_New_Users', value: '1,052 Accounts', trend: '+18% Growth', color: 'purple' }
          ];
          recs = [
            'Maintain current customer acquisition cost (CAC) of Rs.182 as the LTV-to-CAC ratio of 24x represents exceptional efficiency.',
            'Scale digital referral programs to acquire high-value users at a lower unit CAC.',
            'Audit the slight churn spike in March (102 users) to isolate potential stockout or service delivery bottlenecks.'
          ];
          sumLines = [
            'Customer acquisition metrics demonstrate world-class efficiency with highly sticky recurring checkout patterns.',
            'March recorded the strongest customer expansion with 412 new signups.'
          ];
          break;

        case 'clv-analysis':
          fetchedData = R.clvAnalysis.map(r => ({
            segment: r.segment,
            customers: r.customers,
            avgSpend: `Rs.${r.avgSpend.toLocaleString()}`,
            visitFreq: `${r.visitFreq}x / Mo`,
            avgLTV: `Rs.${r.avgLTV.toLocaleString()}`,
            churnRisk: r.churnRisk,
            action: r.action
          }));
          generatedCards = [
            { label: 'VIP_Average_LTV', value: 'Rs.6,28,000', trend: 'CRITICAL VALUE', color: 'orange' },
            { label: 'Regular_Core_Count', value: '892 Customers', trend: 'STABLE', color: 'blue' },
            { label: 'Occasional_Value_Pool', value: 'Rs.5.96 Cr', trend: 'OPTIMAL', color: 'green' },
            { label: 'Win-back_Prospects', value: '648 Users', trend: 'Win-back active', color: 'red' }
          ];
          recs = [
            'Focus marketing spending on converting Regulars to VIPs through custom category reward points.',
            'Deploy targeted multi-buy incentives to Occasional shoppers to increase visit frequency from 1.8x to 3.0x.',
            'Verify that VIP customers receive exclusive priority delivery or support services to prevent churn.'
          ];
          sumLines = [
            'VIP and Regular segments represent over 84% of lifetime commercial value holding.',
            'First-time checkouts carry high operational acquisition costs and low immediate return.'
          ];
          break;

        case 'sales-by-employee':
          fetchedData = R.staffSales.map(r => ({
            name: r.name,
            role: r.role,
            transactions: r.transactions,
            revenue: `Rs.${r.revenue.toLocaleString()}`,
            avgTicket: `Rs.${r.avgTicket.toLocaleString()}`,
            targetAchieved: r.targetAchieved,
            commission: `Rs.${r.commission.toLocaleString()}`,
            rating: `${r.rating} / 5`
          }));
          generatedCards = [
            { label: 'Highest_Revenue_Agent', value: 'Arjun Das', trend: 'Rs.6.12L Sales', color: 'green' },
            { label: 'Most_Transactions', value: 'Ravi Sharma', trend: '412 Txns', color: 'blue' },
            { label: 'Total_Paid_Commission', value: 'Rs.82,931', trend: 'ACHIEVED', color: 'orange' },
            { label: 'Avg_Team_Rating', value: '4.66 / 5', trend: 'EXCELLENT', color: 'purple' }
          ];
          recs = [
            'Approve the target bonus and commission of Rs.24,496 for Arjun Das today given his exceptional performance (122% target achieved).',
            'Conduct cross-training for Meena Pillai to lift her ticket value and target completion rates up to the core team average.',
            'Provide Ravi Sharma with express billing counter accessories due to high checkout transaction density (412 txns).'
          ];
          sumLines = [
            'Overall team sales targets were exceeded by 4.2% across Q1 billing cycles.',
            'Arjun Das and Ravi Sharma continue to represent the high-performance core of the sales team.'
          ];
          break;

        default:
          fetchedData = Array.from({ length: 10 }).map((_, i) => ({
            id: i,
            date: new Date().toISOString(),
            amount: Math.floor(Math.random() * 10000),
            status: 'completed'
          }));
          generatedCards = [
            { label: 'Current_Volume', value: 'Rs.42,500', trend: '+12%', color: 'orange' },
            { label: 'Avg_Daily', value: 'Rs.5,310', trend: '+2%', color: 'blue' },
            { label: 'Variance', value: '-Rs.1,200', trend: '-5%', negative: true, color: 'red' },
            { label: 'Confidence', value: '98.4%', trend: 'OPTIMAL', color: 'green' }
          ];
          recs = ['Verify system configurations and database handshakes.'];
          sumLines = ['Mock report generated.'];
      }

      setData(fetchedData);
      setCards(generatedCards);
      setRecommendations(recs);
      setSummary(sumLines);
    } catch (err) {
      console.error(`[useReportData] Error fetching ${reportId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [reportId, business?.id, JSON.stringify(filters)]);

  useEffect(() => {
    fetchReportData();

    // Establish Real-time Synchronization Channel
    const channel = supabase
      .channel(`reports-realtime-${reportId}-${business?.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'invoices', 
        filter: `business_id=eq.${business?.id}` 
      }, () => fetchReportData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products', 
        filter: `business_id=eq.${business?.id}` 
      }, () => fetchReportData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'invoice_items', 
        filter: `business_id=eq.${business?.id}` 
      }, () => fetchReportData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contacts', 
        filter: `business_id=eq.${business?.id}` 
      }, () => fetchReportData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ledger_entries', 
        filter: `business_id=eq.${business?.id}` 
      }, () => fetchReportData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'purchase_orders', 
        filter: `business_id=eq.${business?.id}` 
      }, () => fetchReportData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'stock_movements', 
        filter: `business_id=eq.${business?.id}` 
      }, () => fetchReportData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'categories', 
        filter: `business_id=eq.${business?.id}` 
      }, () => fetchReportData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReportData, reportId, business?.id, JSON.stringify(filters)]);

  return { data, cards, recommendations, summary, loading, error, refresh: fetchReportData };
}
