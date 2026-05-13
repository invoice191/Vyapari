import { 
  BarChart3, TrendingUp, Package, Users, 
  CreditCard, Clock, MapPin, AlertCircle,
  BarChart, PieChart, LineChart, Table,
  Download, Filter, RefreshCw, AlertTriangle, Lightbulb, BarChart2,
  Percent, FileText, Landmark, ShieldAlert, BadgePercent, Coins
} from 'lucide-react';

export type ReportCategory = 
  | '-- Sales Reports'
  | '-- Inventory Reports'
  | '-- Financial Reports'
  | '-- Customer Insights'
  | '-- Performance Metrics';

export type ReportId = 
  | 'daily-sales'
  | 'hourly-sales'
  | 'payment-modes'
  | 'top-products'
  | 'tax-gst'
  | 'promo-effectiveness'
  | 'stock-levels'
  | 'stock-movement'
  | 'low-stock'
  | 'dead-stock'
  | 'inventory-valuation'
  | 'supplier-perf'
  | 'pl-statement'
  | 'cash-flow'
  | 'expense-breakdown'
  | 'cogs-analysis'
  | 'rfm-segmentation'
  | 'churn-risk'
  | 'acquisition-retention'
  | 'clv-analysis'
  | 'sales-by-employee';

export interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  icon: any;
  category: ReportCategory;
  type: 'chart' | 'table' | 'hybrid';
  columns?: string[];
  insightKey?: string;
  filters?: ('payment' | 'category' | 'status' | 'threshold' | 'gst_slab' | 'segment')[];
}

export const REPORT_CONFIG: ReportDefinition[] = [
  // Sales Reports
  {
    id: 'daily-sales',
    title: 'Daily Sales Summary',
    description: "Consolidated view of a single day's selling activity - invoices, gross sales, discounts, taxes and net collections by hour and channel.",
    icon: BarChart3,
    category: '-- Sales Reports',
    type: 'hybrid',
    columns: ['Date', 'Invoices', 'Gross Sales', 'Discounts', 'Tax', 'Net Sales'],
    filters: ['payment', 'threshold']
  },
  {
    id: 'hourly-sales',
    title: 'Hourly Sales Analysis',
    description: 'Hour-by-hour breakdown of transactions and revenue to identify peak and lean periods for staffing and promotions.',
    icon: Clock,
    category: '-- Sales Reports',
    type: 'hybrid',
    columns: ['Hour', 'Transactions', 'Units Sold', 'Revenue', 'Avg. Ticket']
  },
  {
    id: 'payment-modes',
    title: 'Payment Mode Distribution',
    description: 'Share of collections across cash, card, UPI, wallets and credit to monitor payment-mix trends and reconciliation.',
    icon: CreditCard,
    category: '-- Sales Reports',
    type: 'hybrid',
    columns: ['Payment Mode', 'Transactions', 'Amount', 'Share %'],
    filters: ['payment']
  },
  {
    id: 'top-products',
    title: 'Top Performing Products',
    description: 'Ranking of best-selling SKUs by units and revenue with margin contribution to guide buying and shelf-space decisions.',
    icon: Package,
    category: '-- Sales Reports',
    type: 'table',
    columns: ['Rank', 'SKU', 'Product', 'Units', 'Revenue', 'Margin %']
  },
  {
    id: 'tax-gst',
    title: 'Tax / GST Summary',
    description: 'Slab-wise breakup of taxable sales, CGST, SGST and IGST liabilities for the period to support GST filing.',
    icon: FileText,
    category: '-- Sales Reports',
    type: 'table',
    columns: ['GST Slab', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax'],
    filters: ['gst_slab']
  },
  {
    id: 'promo-effectiveness',
    title: 'Promo Effectiveness',
    description: 'Incremental sales, redemption rate and ROI for each active promotion to evaluate campaign performance.',
    icon: BadgePercent,
    category: '-- Sales Reports',
    type: 'table',
    columns: ['Promo', 'Redemptions', 'Discount Given', 'Incremental Sales', 'ROI']
  },

  // Inventory Reports
  {
    id: 'stock-levels',
    title: 'Current Stock Status',
    description: 'Live snapshot of on-hand quantity, reserved stock and available-to-sell across all SKUs and warehouses.',
    icon: Package,
    category: '-- Inventory Reports',
    type: 'table',
    columns: ['SKU', 'Product', 'On Hand', 'Reserved', 'Available', 'Reorder Lvl'],
    filters: ['category', 'threshold']
  },
  {
    id: 'stock-movement',
    title: 'Stock Movement History',
    description: 'Chronological log of all inward, outward, transfer and adjustment movements for traceability and audit.',
    icon: TrendingUp,
    category: '-- Inventory Reports',
    type: 'table',
    columns: ['Date', 'SKU', 'Type', 'Qty', 'Reference', 'Balance']
  },
  {
    id: 'low-stock',
    title: 'Low Stock Alert',
    description: 'Items at or below reorder threshold with suggested order quantity based on average daily demand and lead time.',
    icon: ShieldAlert,
    category: '-- Inventory Reports',
    type: 'table',
    columns: ['SKU', 'Product', 'Available', 'Reorder Lvl', 'Avg Daily Sale', 'Suggested Qty'],
    filters: ['category', 'threshold']
  },
  {
    id: 'dead-stock',
    title: 'Dead Stock Analysis',
    description: 'SKUs with zero or negligible movement over a defined window, with locked-in capital and disposal recommendations.',
    icon: AlertCircle,
    category: '-- Inventory Reports',
    type: 'table',
    columns: ['SKU', 'Product', 'Days No Sale', 'Qty', 'Stock Value', 'Action'],
    filters: ['category', 'threshold']
  },
  {
    id: 'inventory-valuation',
    title: 'Inventory Valuation',
    description: 'Closing stock value by category using FIFO/Weighted-Average cost - used for balance sheet and COGS reconciliation.',
    icon: BarChart,
    category: '-- Inventory Reports',
    type: 'hybrid',
    columns: ['Category', 'SKUs', 'Units', 'Cost Value', 'Retail Value', 'Method']
  },
  {
    id: 'supplier-perf',
    title: 'Supplier Performance',
    description: 'Vendor scorecard covering on-time delivery, fill-rate, quality rejections and price variance.',
    icon: Coins,
    category: '-- Inventory Reports',
    type: 'table',
    columns: ['Supplier', 'Orders', 'On-Time %', 'Fill Rate', 'Rejection %', 'Score']
  },

  // Financial Reports
  {
    id: 'pl-statement',
    title: 'Profit & Loss Statement',
    description: 'Statement of revenue, cost of goods sold, operating expenses and net profit for the reporting period.',
    icon: Landmark,
    category: '-- Financial Reports',
    type: 'table',
    columns: ['Particulars', 'Current Period', 'Previous Period', 'Change %']
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow Statement',
    description: 'Movement of cash across operating, investing and financing activities for the period with closing balance.',
    icon: TrendingUp,
    category: '-- Financial Reports',
    type: 'table',
    columns: ['Activity', 'Inflows', 'Outflows', 'Net Cash']
  },
  {
    id: 'expense-breakdown',
    title: 'Expense Breakdown',
    description: 'Categorised view of operating expenses with variance against budget to identify overspend.',
    icon: PieChart,
    category: '-- Financial Reports',
    type: 'hybrid',
    columns: ['Category', 'Budget', 'Actual', 'Variance', 'Variance %']
  },
  {
    id: 'cogs-analysis',
    title: 'COGS Analysis',
    description: 'Cost of goods sold by category and SKU with movement in cost and impact on margin.',
    icon: BarChart,
    category: '-- Financial Reports',
    type: 'table',
    columns: ['Category', 'Revenue', 'COGS', 'Gross Profit', 'GP %']
  },

  // Customer Insights
  {
    id: 'rfm-segmentation',
    title: 'Customer RFM Clusters',
    description: 'Segmentation of customers by Recency, Frequency and Monetary value into actionable behavioural clusters.',
    icon: Users,
    category: '-- Customer Insights',
    type: 'hybrid',
    columns: ['Segment', 'Customers', 'Avg Recency', 'Avg Frequency', 'Avg Spend'],
    filters: ['segment']
  },
  {
    id: 'churn-risk',
    title: 'Churn Prediction Report',
    description: 'ML-scored list of customers most likely to churn in the next 30 days with key drivers and suggested interventions.',
    icon: AlertCircle,
    category: '-- Customer Insights',
    type: 'table',
    columns: ['Customer', 'Last Purchase', 'Churn Probability', 'Predicted LTV Loss', 'Suggested Action']
  },
  {
    id: 'acquisition-retention',
    title: 'Acquisition & Retention',
    description: 'Monthly cohort analysis of new vs returning customers, retention curves and net customer growth.',
    icon: LineChart,
    category: '-- Customer Insights',
    type: 'table',
    columns: ['Cohort', 'New', 'Returning', 'Retention M+1', 'Retention M+3']
  },
  {
    id: 'clv-analysis',
    title: 'CLV Analysis',
    description: 'Predicted Customer Lifetime Value by segment with average order value, purchase frequency and projected horizon.',
    icon: BarChart2,
    category: '-- Customer Insights',
    type: 'table',
    columns: ['Segment', 'AOV', 'Purchase Freq.', 'Avg Lifespan', 'Predicted CLV']
  },

  // Performance Metrics
  {
    id: 'sales-by-employee',
    title: 'Sales by Employee',
    description: 'Employee-wise sales, units, conversion and average ticket size to evaluate front-line performance.',
    icon: Users,
    category: '-- Performance Metrics',
    type: 'hybrid',
    columns: ['Employee', 'Invoices', 'Units', 'Revenue', 'Avg Ticket', 'vs Target']
  }
];

export const REPORT_TREE = [
  {
    cat: '-- Sales Reports' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === '-- Sales Reports')
  },
  {
    cat: '-- Inventory Reports' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === '-- Inventory Reports')
  },
  {
    cat: '-- Financial Reports' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === '-- Financial Reports')
  },
  {
    cat: '-- Customer Insights' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === '-- Customer Insights')
  },
  {
    cat: '-- Performance Metrics' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === '-- Performance Metrics')
  }
];
