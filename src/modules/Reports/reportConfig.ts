import { 
  BarChart3, TrendingUp, Package, Users, 
  CreditCard, Clock, MapPin, AlertCircle,
  BarChart, PieChart, LineChart, Table,
  Download, Filter, RefreshCw, AlertTriangle, Lightbulb, BarChart2,
  Percent, FileText, Landmark, ShieldAlert, BadgePercent, Coins
} from 'lucide-react';

export type ReportCategory = 
  | 'Sales Records'
  | 'Stock Records'
  | 'Money Records'
  | 'Customer Tips'
  | 'Staff & Speed';

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
    title: "Today's Sales",
    description: "A simple look at today's sales, discounts, and taxes collected.",
    icon: BarChart3,
    category: 'Sales Records',
    type: 'hybrid',
    columns: ['Date', 'Invoices', 'Gross Sales', 'Discounts', 'Tax', 'Net Sales'],
    filters: ['payment', 'threshold']
  },
  {
    id: 'hourly-sales',
    title: 'Sales by Hour',
    description: 'See which hours of the day are busiest to help you manage your staff better.',
    icon: Clock,
    category: 'Sales Records',
    type: 'hybrid',
    columns: ['Hour', 'Transactions', 'Units Sold', 'Revenue', 'Avg. Ticket']
  },
  {
    id: 'payment-modes',
    title: 'How Customers Pay',
    description: 'See if people are paying more by Cash, Card, or UPI.',
    icon: CreditCard,
    category: 'Sales Records',
    type: 'hybrid',
    columns: ['Payment Mode', 'Transactions', 'Amount', 'Share %'],
    filters: ['payment']
  },
  {
    id: 'top-products',
    title: 'Best Selling Items',
    description: 'Your top items that are making the most money.',
    icon: Package,
    category: 'Sales Records',
    type: 'table',
    columns: ['Rank', 'Item Code', 'Product', 'Units', 'Revenue', 'Margin %']
  },
  {
    id: 'tax-gst',
    title: 'GST Reports',
    description: 'A simple summary of GST collected to help you with your filings.',
    icon: FileText,
    category: 'Sales Records',
    type: 'table',
    columns: ['GST Slab', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax'],
    filters: ['gst_slab']
  },
  {
    id: 'promo-effectiveness',
    title: 'Promo Effectiveness',
    description: 'Incremental sales, redemption rate and ROI for each active promotion to evaluate campaign performance.',
    icon: BadgePercent,
    category: 'Sales Records',
    type: 'table',
    columns: ['Promo', 'Redemptions', 'Discount Given', 'Incremental Sales', 'ROI']
  },

  // Inventory Reports
  {
    id: 'stock-levels',
    title: 'My Stock List',
    description: 'See exactly how much of each item you have left in the shop.',
    icon: Package,
    category: 'Stock Records',
    type: 'table',
    columns: ['Item Code', 'Product', 'On Hand', 'Reserved', 'Available', 'Reorder Lvl'],
    filters: ['category', 'threshold']
  },
  {
    id: 'stock-movement',
    title: 'Stock History Log',
    description: 'A record of every item that came in or went out of your shop.',
    icon: TrendingUp,
    category: 'Stock Records',
    type: 'table',
    columns: ['Date', 'Item Code', 'Type', 'Qty', 'Reference', 'Balance']
  },
  {
    id: 'low-stock',
    title: 'Low Stock Alerts',
    description: 'Items that are almost finished. Buy these soon!',
    icon: ShieldAlert,
    category: 'Stock Records',
    type: 'table',
    columns: ['Item Code', 'Product', 'Available', 'Reorder Lvl', 'Avg Daily Sale', 'Suggested Qty'],
    filters: ['category', 'threshold']
  },
  {
    id: 'dead-stock',
    title: 'Old Stock List',
    description: "Items that haven't sold in a long time. Try giving a discount!",
    icon: AlertCircle,
    category: 'Stock Records',
    type: 'table',
    columns: ['Item Code', 'Product', 'Days No Sale', 'Qty', 'Stock Value', 'Action'],
    filters: ['category', 'threshold']
  },
  {
    id: 'inventory-valuation',
    title: 'Stock Value',
    description: 'Total value of everything you have in your shop right now.',
    icon: BarChart,
    category: 'Stock Records',
    type: 'hybrid',
    columns: ['Category', 'Items', 'Units', 'Cost Value', 'Retail Value', 'Method']
  },
  {
    id: 'supplier-perf',
    title: 'Supplier Quality',
    description: 'See which suppliers deliver on time and which ones give you trouble.',
    icon: Coins,
    category: 'Stock Records',
    type: 'table',
    columns: ['Supplier', 'Orders', 'On-Time %', 'Fill Rate', 'Rejection %', 'Score']
  },

  // Financial Reports
  {
    id: 'pl-statement',
    title: 'Profit & Loss',
    description: 'A simple list of how much you earned and how much you spent.',
    icon: Landmark,
    category: 'Money Records',
    type: 'table',
    columns: ['Details', 'This Month', 'Last Month', 'Change %']
  },
  {
    id: 'cash-flow',
    title: 'Money In & Out',
    description: 'Track how cash is moving in and out of your business.',
    icon: TrendingUp,
    category: 'Money Records',
    type: 'table',
    columns: ['Activity', 'Money In', 'Money Out', 'Balance']
  },
  {
    id: 'expense-breakdown',
    title: 'Spend History',
    description: 'See where your money is going - Rent, Salary, Bills, etc.',
    icon: PieChart,
    category: 'Money Records',
    type: 'hybrid',
    columns: ['Category', 'Budget', 'Actual', 'Variance', 'Variance %']
  },
  {
    id: 'cogs-analysis',
    title: 'Item Costs',
    description: 'How much you are spending to buy the items you sell.',
    icon: BarChart,
    category: 'Money Records',
    type: 'table',
    columns: ['Category', 'Revenue', 'Cost', 'Profit', 'Profit %']
  },

  // Customer Insights
  {
    id: 'rfm-segmentation',
    title: 'Customer Types',
    description: 'Group your customers into VIPs, Regulars, and New ones.',
    icon: Users,
    category: 'Customer Tips',
    type: 'hybrid',
    columns: ['Type', 'Customers', 'Last Visit', 'Visit Frequency', 'Avg Spend'],
    filters: ['segment']
  },
  {
    id: 'churn-risk',
    title: 'Losing Customers',
    description: 'Customers who haven’t visited in a while. Invite them back!',
    icon: AlertCircle,
    category: 'Customer Tips',
    type: 'table',
    columns: ['Customer', 'Last Purchase', 'Risk Level', 'Potential Loss', 'Advice']
  },
  {
    id: 'acquisition-retention',
    title: 'New vs Old Customers',
    description: 'See if you are getting new customers or if old ones are coming back.',
    icon: LineChart,
    category: 'Customer Tips',
    type: 'table',
    columns: ['Month', 'New', 'Old', 'Came Back', 'Stayed']
  },
  {
    id: 'clv-analysis',
    title: 'Customer Lifetime Value',
    description: 'See which customers are worth the most to your shop in the long run.',
    icon: BarChart2,
    category: 'Customer Tips',
    type: 'table',
    columns: ['Type', 'Avg Order', 'Visit Freq.', 'Life Span', 'Total Value']
  },

  // Performance Metrics
  {
    id: 'sales-by-employee',
    title: 'Staff Sales',
    description: 'See how much each staff member is selling.',
    icon: Users,
    category: 'Staff & Speed',
    type: 'hybrid',
    columns: ['Staff Name', 'Bills', 'Items', 'Total Money', 'Avg Bill', 'Target Status']
  }
];

export const REPORT_TREE = [
  {
    cat: 'Sales Records' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === 'Sales Records')
  },
  {
    cat: 'Stock Records' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === 'Stock Records')
  },
  {
    cat: 'Money Records' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === 'Money Records')
  },
  {
    cat: 'Customer Tips' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === 'Customer Tips')
  },
  {
    cat: 'Staff & Speed' as ReportCategory,
    items: REPORT_CONFIG.filter(r => r.category === 'Staff & Speed')
  }
];
