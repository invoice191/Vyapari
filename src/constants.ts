
// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
export const C = {
  orange: "#FF6B35", peach: "#FFF0E6", white: "#FFFFFF",
  gray50: "#F8F9FA", gray100: "#F1F3F4", gray200: "#E0E0E0",
  dark: "#2D3436", mid: "#636E72", light: "#B2BEC3",
  green: "#00B894", yellow: "#FDCB6E", red: "#D63031",
  blue: "#0984E3", purple: "#6C5CE7",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
export const salesData = [
  { time: "Mon", revenue: 42000, prev: 38000, target: 45000 },
  { time: "Tue", revenue: 58000, prev: 52000, target: 45000 },
  { time: "Wed", revenue: 51000, prev: 47000, target: 45000 },
  { time: "Thu", revenue: 67000, prev: 61000, target: 45000 },
  { time: "Fri", revenue: 73000, prev: 65000, target: 45000 },
  { time: "Sat", revenue: 89000, prev: 78000, target: 45000 },
  { time: "Sun", revenue: 62000, prev: 55000, target: 45000 },
];

export const categoryData = [
  { name: "Electronics", value: 34, color: C.orange },
  { name: "Clothing", value: 28, color: C.blue },
  { name: "Groceries", value: 22, color: C.green },
  { name: "Home & Garden", value: 10, color: C.purple },
  { name: "Others", value: 6, color: C.yellow },
];

export const productMatrix = [
  { name: "iPhone 15", sales: 85, margin: 22, inventory: 120 },
  { name: "Nike Shoes", sales: 72, margin: 45, inventory: 200 },
  { name: "Rice 5kg", sales: 95, margin: 12, inventory: 500 },
  { name: "Samsung TV", sales: 45, margin: 30, inventory: 60 },
  { name: "Jeans", sales: 60, margin: 55, inventory: 150 },
  { name: "Coffee", sales: 88, margin: 65, inventory: 300 },
  { name: "Laptop", sales: 30, margin: 18, inventory: 45 },
  { name: "Headphones", sales: 55, margin: 40, inventory: 90 },
];

export const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`, sales: Math.floor(Math.random() * 15000 + 2000),
  orders: Math.floor(Math.random() * 80 + 10),
}));

export const forecastData = [
  { month: "Jan", actual: 420000, predicted: null, lower: null, upper: null },
  { month: "Feb", actual: 380000, predicted: null, lower: null, upper: null },
  { month: "Mar", actual: 510000, predicted: null, lower: null, upper: null },
  { month: "Apr", actual: 480000, predicted: null, lower: null, upper: null },
  { month: "May", actual: 530000, predicted: null, lower: null, upper: null },
  { month: "Jun", actual: 590000, predicted: null, lower: null, upper: null },
  { month: "Jul", actual: null, predicted: 620000, lower: 580000, upper: 660000 },
  { month: "Aug", actual: null, predicted: 650000, lower: 600000, upper: 700000 },
  { month: "Sep", actual: null, predicted: 700000, lower: 640000, upper: 760000 },
];

export const invoices = [
  { id: "INV-2024-001", customer: "Ravi Enterprises", date: "2024-01-15", amount: 45200, status: "Paid", method: "UPI" },
  { id: "INV-2024-002", customer: "Meera Textiles", date: "2024-01-16", amount: 128500, status: "Pending", method: "Bank Transfer" },
  { id: "INV-2024-003", customer: "Kumar Electronics", date: "2024-01-17", amount: 67800, status: "Paid", method: "Cash" },
  { id: "INV-2024-004", customer: "Priya Retail Co.", date: "2024-01-18", amount: 23400, status: "Overdue", method: "Card" },
  { id: "INV-2024-005", customer: "Sundar Traders", date: "2024-01-19", amount: 89000, status: "Paid", method: "UPI" },
  { id: "INV-2024-006", customer: "Vijay Stores", date: "2024-01-20", amount: 34600, status: "Pending", method: "Cash" },
  { id: "INV-2024-007", customer: "Ananya Fashion", date: "2024-01-21", amount: 156000, status: "Paid", method: "Card" },
];

export const ocrQueue = [
  { id: 1, name: "invoice_jan_2024.pdf", status: "Completed", confidence: 96, vendor: "TechCorp", amount: "₹45,200" },
  { id: 2, name: "purchase_order_123.jpg", status: "Processing", confidence: null, vendor: "—", amount: "—" },
  { id: 3, name: "receipt_store_24.png", status: "Completed", confidence: 89, vendor: "MegaMart", amount: "₹2,340" },
  { id: 4, name: "bill_supplier_x.pdf", status: "Failed", confidence: null, vendor: "—", amount: "—" },
  { id: 5, name: "invoice_feb_001.pdf", status: "Pending", confidence: null, vendor: "—", amount: "—" },
];

export const R = {
  dailySales: [
    { date: "Jan 01", day: "Mon", txns: 312, gross: 148200, disc: 8400, net: 139800, tax: 14820, profit: 38200, avg: 448 },
    { date: "Jan 02", day: "Tue", txns: 408, gross: 196500, disc: 11200, net: 185300, tax: 19650, profit: 52100, avg: 454 },
    { date: "Jan 03", day: "Wed", txns: 356, gross: 172300, disc: 9100, net: 163200, tax: 17230, profit: 44800, avg: 458 },
    { date: "Jan 04", day: "Thu", txns: 490, gross: 231400, disc: 14300, net: 217100, tax: 23140, profit: 61200, avg: 443 },
    { date: "Jan 05", day: "Fri", txns: 534, gross: 258700, disc: 15600, net: 243100, tax: 25870, profit: 68400, avg: 455 },
    { date: "Jan 06", day: "Sat", txns: 712, gross: 342100, disc: 21300, net: 320800, tax: 34210, profit: 91500, avg: 450 },
    { date: "Jan 07", day: "Sun", txns: 580, gross: 278400, disc: 17400, net: 261000, tax: 27840, profit: 73200, avg: 450 },
  ],
  hourly: [
    { hour: "8 AM", orders: 18, sales: 6200, avgTicket: 344, peakFlag: false },
    { hour: "9 AM", orders: 34, sales: 12400, avgTicket: 365, peakFlag: false },
    { hour: "10 AM", orders: 56, sales: 21300, avgTicket: 380, peakFlag: false },
    { hour: "11 AM", orders: 78, sales: 30100, avgTicket: 386, peakFlag: true },
    { hour: "12 PM", orders: 92, sales: 38500, avgTicket: 419, peakFlag: true },
    { hour: "1 PM", orders: 104, sales: 45200, avgTicket: 435, peakFlag: true },
    { hour: "2 PM", orders: 88, sales: 38900, avgTicket: 442, peakFlag: true },
    { hour: "3 PM", orders: 75, sales: 31400, avgTicket: 419, peakFlag: false },
    { hour: "4 PM", orders: 68, sales: 27800, avgTicket: 409, peakFlag: false },
    { hour: "5 PM", orders: 95, sales: 41200, avgTicket: 434, peakFlag: true },
    { hour: "6 PM", orders: 110, sales: 49800, avgTicket: 453, peakFlag: true },
    { hour: "7 PM", orders: 124, sales: 58300, avgTicket: 470, peakFlag: true },
    { hour: "8 PM", orders: 98, sales: 43100, avgTicket: 440, peakFlag: true },
    { hour: "9 PM", orders: 54, sales: 22600, avgTicket: 419, peakFlag: false },
    { hour: "10 PM", orders: 22, sales: 8900, avgTicket: 405, peakFlag: false },
  ],
  paymentModes: [
    { method: "UPI / QR", txns: 1842, amount: 418300, pct: 38.2, avgTicket: 227, growth: 24.1, color: C.orange },
    { method: "Credit Card", txns: 976, amount: 312400, pct: 28.5, avgTicket: 320, growth: 8.4, color: C.blue },
    { method: "Cash", txns: 1203, amount: 198600, pct: 18.1, avgTicket: 165, growth: -12.3, color: C.green },
    { method: "Debit Card", txns: 654, amount: 124800, pct: 11.4, avgTicket: 191, growth: 3.8, color: C.purple },
    { method: "Net Banking", txns: 124, amount: 41200, pct: 3.8, avgTicket: 332, growth: 15.6, color: C.yellow },
  ],
  taxSummary: [
    { category: "Electronics", taxableAmt: 520000, cgst: 46800, sgst: 46800, igst: 0, cess: 5200, total: 98800, rate: "18%" },
    { category: "Clothing", taxableAmt: 310000, cgst: 15500, sgst: 15500, igst: 0, cess: 0, total: 31000, rate: "5%" },
    { category: "Groceries", taxableAmt: 180000, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0, rate: "0%" },
    { category: "Home & Garden", taxableAmt: 145000, cgst: 8700, sgst: 8700, igst: 0, cess: 0, total: 17400, rate: "12%" },
    { category: "Beverages", taxableAmt: 92000, cgst: 8280, sgst: 8280, igst: 0, cess: 920, total: 17480, rate: "18%+Cess" },
  ],
  promoEffectiveness: [
    { promo: "Flat 10% Off — Electronics", startDate: "Jan 1", endDate: "Jan 7", unitsBefore: 245, unitsAfter: 389, revBefore: 245000, revAfter: 350100, profitImpact: -18200, roi: "68%", verdict: "Profitable" },
    { promo: "Buy 2 Get 1 — Clothing", startDate: "Jan 8", endDate: "Jan 14", unitsBefore: 312, unitsAfter: 588, revBefore: 156000, revAfter: 210000, profitImpact: 12400, roi: "142%", verdict: "Highly Profitable" },
    { promo: "Weekend Flash Sale 20%", startDate: "Jan 13", endDate: "Jan 14", unitsBefore: 180, unitsAfter: 290, revBefore: 90000, revAfter: 116000, profitImpact: -4200, roi: "52%", verdict: "Marginal" },
    { promo: "Loyalty Points 2x", startDate: "Jan 15", endDate: "Jan 31", unitsBefore: 890, unitsAfter: 1020, revBefore: 445000, revAfter: 510000, profitImpact: 38000, roi: "187%", verdict: "Highly Profitable" },
  ],
  stockMovement: [
    { sku: "EL-001", product: "iPhone 15 Pro", openingStock: 80, received: 100, sold: 145, adjusted: -2, closingStock: 33, value: 3300000, status: "Low Stock" },
    { sku: "CL-204", product: "Nike Air Max", openingStock: 200, received: 150, sold: 238, adjusted: 0, closingStock: 112, value: 560000, status: "Normal" },
    { sku: "GR-089", product: "Basmati Rice 5kg", openingStock: 500, received: 300, sold: 512, adjusted: -8, closingStock: 280, value: 140000, status: "Normal" },
    { sku: "EL-112", product: "Samsung 55\" TV", openingStock: 40, received: 30, sold: 34, adjusted: 0, closingStock: 36, value: 1440000, status: "Overstock" },
    { sku: "CL-445", product: "Levi's 501 Jeans", openingStock: 150, received: 100, sold: 167, adjusted: -3, closingStock: 80, value: 400000, status: "Normal" },
    { sku: "GR-201", product: "Cooking Oil 1L", openingStock: 80, received: 50, sold: 122, adjusted: 0, closingStock: 8, value: 12000, status: "Critical" },
    { sku: "HG-034", product: "Air Purifier", openingStock: 60, received: 0, sold: 12, adjusted: 0, closingStock: 48, value: 960000, status: "Overstock" },
  ],
  lowStock: [
    { sku: "GR-201", product: "Cooking Oil 1L", current: 8, reorderPt: 50, reorderQty: 200, supplier: "Agro Pvt Ltd", leadDays: 3, estStockout: "2 days", urgency: "Critical" },
    { sku: "EL-001", product: "iPhone 15 Pro", current: 33, reorderPt: 40, reorderQty: 100, supplier: "TechCorp Dist.", leadDays: 7, estStockout: "6 days", urgency: "High" },
    { sku: "GR-445", product: "Sugar 1kg", current: 22, reorderPt: 100, reorderQty: 500, supplier: "FoodMart", leadDays: 2, estStockout: "4 days", urgency: "High" },
    { sku: "EL-890", product: "USB-C Cable", current: 15, reorderPt: 50, reorderQty: 200, supplier: "GadgetZ", leadDays: 5, estStockout: "8 days", urgency: "Medium" },
    { sku: "CL-112", product: "Cotton T-Shirt M", current: 28, reorderPt: 60, reorderQty: 150, supplier: "Fashion Hub", leadDays: 4, estStockout: "10 days", urgency: "Medium" },
  ],
  deadStock: [
    { sku: "HG-034", product: "Air Purifier AP-200", qty: 48, lastSoldDate: "Oct 15, 2023", daysSinceSale: 97, costValue: 960000, potentialLoss: 192000, suggestion: "Discount 20%" },
    { sku: "EL-445", product: "Smart Watch Gen1", qty: 32, lastSoldDate: "Sep 30, 2023", daysSinceSale: 112, costValue: 480000, potentialLoss: 144000, suggestion: "Bundle Offer" },
    { sku: "CL-009", product: "Winter Jacket XL", qty: 24, lastSoldDate: "Nov 1, 2023", daysSinceSale: 80, costValue: 144000, potentialLoss: 43200, suggestion: "End-of-season Sale" },
    { sku: "HG-201", product: "Blender BL-100", qty: 19, lastSoldDate: "Oct 20, 2023", daysSinceSale: 92, costValue: 114000, potentialLoss: 34200, suggestion: "Discount 15%" },
  ],
  inventoryValuation: [
    { category: "Electronics", skus: 42, units: 1240, fifo: 12400000, lifo: 11800000, wac: 12100000, pctOfTotal: 48.2 },
    { category: "Clothing", skus: 86, units: 4320, fifo: 6480000, lifo: 6200000, wac: 6340000, pctOfTotal: 25.1 },
    { category: "Groceries", skus: 124, units: 18600, fifo: 2790000, lifo: 2680000, wac: 2735000, pctOfTotal: 10.7 },
    { category: "Home & Garden", skus: 58, units: 2100, fifo: 3780000, lifo: 3600000, wac: 3690000, pctOfTotal: 14.4 },
    { category: "Beverages", skus: 34, units: 5400, fifo: 432000, lifo: 418000, wac: 425000, pctOfTotal: 1.6 },
  ],
  supplierPerformance: [
    { supplier: "TechCorp Dist.", orders: 24, onTime: 22, lateDeliveries: 2, qualityRejections: 0, avgLeadDays: 6.2, totalValue: 4200000, rating: 9.2, trend: "↑" },
    { supplier: "Fashion Hub", orders: 38, onTime: 34, lateDeliveries: 4, qualityRejections: 2, avgLeadDays: 4.8, totalValue: 2100000, rating: 8.4, trend: "→" },
    { supplier: "Agro Pvt Ltd", orders: 56, onTime: 50, lateDeliveries: 6, qualityRejections: 1, avgLeadDays: 2.4, totalValue: 890000, rating: 8.0, trend: "↓" },
    { supplier: "GadgetZ", orders: 18, onTime: 15, lateDeliveries: 3, qualityRejections: 3, avgLeadDays: 5.6, totalValue: 680000, rating: 7.1, trend: "↓" },
    { supplier: "FoodMart", orders: 72, onTime: 69, lateDeliveries: 3, qualityRejections: 0, avgLeadDays: 1.8, totalValue: 1240000, rating: 9.6, trend: "↑" },
  ],
  plStatement: [
    { item: "Gross Revenue", jan: 1095300, feb: 980200, mar: 1240500, qTotal: 3316000, type: "revenue" },
    { item: "Less: Discounts", jan: -87624, feb: -78416, mar: -99240, qTotal: -265280, type: "deduction" },
    { item: "Net Revenue", jan: 1007676, feb: 901784, mar: 1141260, qTotal: 3050720, type: "subtotal" },
    { item: "Cost of Goods Sold", jan: -602000, feb: -540000, mar: -685000, qTotal: -1827000, type: "deduction" },
    { item: "Gross Profit", jan: 405676, feb: 361784, mar: 456260, qTotal: 1223720, type: "subtotal" },
    { item: "Operating Expenses", jan: -120000, feb: -118000, mar: -125000, qTotal: -363000, type: "deduction" },
    { item: "Staff Salaries", jan: -85000, feb: -85000, mar: -90000, qTotal: -260000, type: "deduction" },
    { item: "Rent & Utilities", jan: -42000, feb: -42000, mar: -42000, qTotal: -126000, type: "deduction" },
    { item: "Marketing Spend", jan: -28000, feb: -35000, mar: -45000, qTotal: -108000, type: "deduction" },
    { item: "Net Operating Profit", jan: 130676, feb: 81784, mar: 154260, qTotal: 366720, type: "total" },
    { item: "Tax (30%)", jan: -39203, feb: -24535, mar: -46278, qTotal: -110016, type: "deduction" },
    { item: "Net Profit After Tax", jan: 91473, feb: 57249, mar: 107982, qTotal: 256704, type: "grandtotal" },
  ],
  cashFlow: [
    { month: "Jan", openingBal: 480000, salesReceipts: 1007676, otherIncome: 12000, cogs: -602000, opex: -120000, salaries: -85000, rent: -42000, taxPaid: -39203, closingBal: 611473 },
    { month: "Feb", openingBal: 611473, salesReceipts: 901784, otherIncome: 8000, cogs: -540000, opex: -118000, salaries: -85000, rent: -42000, taxPaid: -24535, closingBal: 711722 },
    { month: "Mar", openingBal: 711722, salesReceipts: 1141260, otherIncome: 15000, cogs: -685000, opex: -125000, salaries: -90000, rent: -42000, taxPaid: -46278, closingBal: 879704 },
  ],
  expenseBreakdown: [
    { expense: "Cost of Goods Sold", q1: 1827000, pct: 59.9, category: "COGS", color: C.orange },
    { expense: "Staff Salaries", q1: 260000, pct: 8.5, category: "HR", color: C.blue },
    { expense: "Rent & Utilities", q1: 126000, pct: 4.1, category: "Infrastructure", color: C.purple },
    { expense: "Marketing & Ads", q1: 108000, pct: 3.5, category: "Marketing", color: C.green },
    { expense: "Operating Expenses", q1: 363000, pct: 11.9, category: "Operations", color: C.yellow },
    { expense: "Taxes", q1: 110016, pct: 3.6, category: "Compliance", color: C.red },
    { expense: "Miscellaneous", q1: 58000, pct: 1.9, category: "Other", color: C.light },
  ],
  cogsAnalysis: [
    { product: "iPhone 15 Pro", sold: 145, costPerUnit: 72000, totalCOGS: 10440000, sellingPrice: 89999, grossProfit: 2534855, grossMargin: "24.3%" },
    { product: "Nike Air Max", sold: 238, costPerUnit: 2800, totalCOGS: 666400, sellingPrice: 4999, grossProfit: 856762, grossMargin: "56.2%" },
    { product: "Basmati Rice 5kg", sold: 512, costPerUnit: 88, totalCOGS: 45056, sellingPrice: 100, grossProfit: 6144, grossMargin: "12.0%" },
    { product: "Samsung 55\" TV", sold: 34, costPerUnit: 28000, totalCOGS: 952000, sellingPrice: 39999, grossProfit: 407966, grossMargin: "30.0%" },
    { product: "Levi's 501 Jeans", sold: 167, costPerUnit: 900, totalCOGS: 150300, sellingPrice: 2000, grossProfit: 183700, grossMargin: "55.0%" },
  ],
  customerAcquisition: [
    { month: "Jan", newCustomers: 342, returningCustomers: 1505, churnedCustomers: 89, netGrowth: 253, retentionRate: "94.4%", acqCost: 180, ltv: 4200 },
    { month: "Feb", newCustomers: 298, returningCustomers: 1620, churnedCustomers: 76, netGrowth: 222, retentionRate: "95.3%", acqCost: 195, ltv: 4450 },
    { month: "Mar", newCustomers: 412, returningCustomers: 1748, churnedCustomers: 102, netGrowth: 310, retentionRate: "94.1%", acqCost: 172, ltv: 4600 },
  ],
  clvAnalysis: [
    { segment: "VIP (>₹50K spent)", customers: 124, avgSpend: 78400, visitFreq: 8.2, avgLTV: 628000, churnRisk: "Very Low", action: "Loyalty Rewards" },
    { segment: "Regular (₹10K–50K)", customers: 892, avgSpend: 24600, visitFreq: 4.1, avgLTV: 156800, churnRisk: "Low", action: "Upsell Campaign" },
    { segment: "Occasional (<₹10K)", customers: 1840, avgSpend: 5400, visitFreq: 1.8, avgLTV: 32400, churnRisk: "Medium", action: "Re-engagement" },
    { segment: "One-time Buyer", customers: 648, avgSpend: 1200, visitFreq: 1.0, avgLTV: 4800, churnRisk: "High", action: "Win-back Offer" },
  ],
  rfmSegmentation: [
    { segment: "Champions", customers: 186, recency: "< 7 days", frequency: "> 10 orders", monetary: "> ₹50K", rfmScore: "555", action: "Reward & Retain", color: C.green },
    { segment: "Loyal Customers", customers: 412, recency: "< 30 days", frequency: "5–10 orders", monetary: "₹15K–50K", rfmScore: "445", action: "Upsell Premium", color: C.blue },
    { segment: "Potential Loyalists", customers: 634, recency: "< 45 days", frequency: "2–5 orders", monetary: "₹5K–15K", rfmScore: "334", action: "Loyalty Program", color: C.orange },
    { segment: "At Risk", customers: 298, recency: "60–90 days", frequency: "2–4 orders", monetary: "₹8K–20K", rfmScore: "223", action: "Re-activation Email", color: C.yellow },
    { segment: "Lost Customers", customers: 174, recency: "> 90 days", frequency: "< 2 orders", monetary: "< ₹5K", rfmScore: "111", action: "Win-back Offer", color: C.red },
  ],
  staffSales: [
    { name: "Ravi Sharma", role: "Sr. Cashier", transactions: 412, revenue: 520800, avgTicket: 1264, targetAchieved: "104%", commission: 15624, rating: 4.8 },
    { name: "Priya Nair", role: "Cashier", transactions: 356, revenue: 434700, avgTicket: 1221, targetAchieved: "97%", commission: 13041, rating: 4.6 },
    { name: "Arjun Das", role: "Sales Exec", transactions: 289, revenue: 612400, avgTicket: 2119, targetAchieved: "122%", commission: 24496, rating: 4.9 },
    { name: "Meena Pillai", role: "Cashier", transactions: 334, revenue: 398200, avgTicket: 1192, targetAchieved: "89%", commission: 11946, rating: 4.3 },
    { name: "Suresh Babu", role: "Sales Exec", transactions: 198, revenue: 445600, avgTicket: 2250, targetAchieved: "111%", commission: 17824, rating: 4.7 },
  ],
};

export const usersData = [
  { id: "USR-001", name: "Arjun Sharma", email: "arjun@vyapari.in", role: "Super Admin", shop: "All Shops", status: "Active", lastLogin: "2m ago", avatar: "AS" },
  { id: "USR-002", name: "Priya Patel", email: "priya@vyapari.in", role: "Admin", shop: "Mumbai, Pune", status: "Active", lastLogin: "1h ago", avatar: "PP" },
  { id: "USR-003", name: "Rahul Gupta", email: "rahul@vyapari.in", role: "Manager", shop: "Mumbai - Main", status: "Active", lastLogin: "3h ago", avatar: "RG" },
  { id: "USR-004", name: "Sneha Iyer", email: "sneha@vyapari.in", role: "Analyst", shop: "All Shops", status: "Active", lastLogin: "Yesterday", avatar: "SI" },
  { id: "USR-005", name: "Vijay Kumar", email: "vijay@vyapari.in", role: "Cashier", shop: "Mumbai - Main", status: "Inactive", lastLogin: "3 days ago", avatar: "VK" },
  { id: "USR-006", name: "Ananya Reddy", email: "ananya@vyapari.in", role: "Manager", shop: "Pune - East", status: "Active", lastLogin: "5h ago", avatar: "AR" },
  { id: "USR-007", name: "Kiran Desai", email: "kiran@vyapari.in", role: "Cashier", shop: "Nashik - Outlet", status: "Suspended", lastLogin: "1 week ago", avatar: "KD" },
];

export const REGISTERED_SHOPS = [
  "RAVI ENTERPRISES",
  "MEERA TEXTILES",
  "KUMAR ELECTRONICS",
  "PRIYA RETAIL CO.",
  "SUNDAR TRADERS",
  "VIJAY STORES",
  "ANANYA FASHION",
  "MEGA MART",
  "TECH CORP",
  "FASHION HUB",
  "AGRO PVT LTD",
  "GADGETZ",
  "FOOD MART"
];

export const auditLogsData = [
  { id: "AUD-5892", user: "Arjun Sharma", avatar: "AS", role: "Super Admin", action: "User Created", module: "User Management", target: "sneha@vyapari.in", oldVal: "—", newVal: "Analyst role", ip: "103.24.56.78", timestamp: "2024-01-21 14:32:05", severity: "Info" },
  { id: "AUD-5891", user: "Priya Patel", avatar: "PP", role: "Admin", action: "Invoice Voided", module: "Invoices", target: "INV-2024-007", oldVal: "Paid ₹1,56,000", newVal: "Voided", ip: "103.24.56.79", timestamp: "2024-01-21 13:17:42", severity: "Warning" },
  { id: "AUD-5890", user: "Rahul Gupta", avatar: "RG", role: "Manager", action: "Price Changed", module: "Inventory", target: "iPhone 15 Pro", oldVal: "₹1,00,000", newVal: "₹95,000", ip: "192.168.1.12", timestamp: "2024-01-21 11:55:20", severity: "Warning" },
  { id: "AUD-5889", user: "Arjun Sharma", avatar: "AS", role: "Super Admin", action: "Settings Updated", module: "Settings", target: "GST Rate", oldVal: "12%", newVal: "18%", ip: "103.24.56.78", timestamp: "2024-01-21 10:30:00", severity: "Info" },
  { id: "AUD-5888", user: "Kiran Desai", avatar: "KD", role: "Cashier", action: "Login Failed", module: "Authentication", target: "kiran@vyapari.in", oldVal: "—", newVal: "3 failed attempts", ip: "45.67.89.10", timestamp: "2024-01-21 09:45:33", severity: "Critical" },
  { id: "AUD-5887", user: "Sneha Iyer", avatar: "SI", role: "Analyst", action: "Report Exported", module: "Reports", target: "Sales Summary Jan 2024", oldVal: "—", newVal: "PDF downloaded", ip: "103.24.56.80", timestamp: "2024-01-21 09:12:15", severity: "Info" },
  { id: "AUD-5886", user: "Priya Patel", avatar: "PP", role: "Admin", action: "User Suspended", module: "User Management", target: "kiran@vyapari.in", oldVal: "Active", newVal: "Suspended", ip: "103.24.56.79", timestamp: "2024-01-21 08:58:44", severity: "Warning" },
  { id: "AUD-5885", user: "Rahul Gupta", avatar: "RG", role: "Manager", action: "Inventory Adjusted", module: "Inventory", target: "Rice 5kg (GR-089)", oldVal: "500 units", newVal: "480 units", ip: "192.168.1.12", timestamp: "2024-01-20 18:22:10", severity: "Info" },
  { id: "AUD-5884", user: "System", avatar: "SY", role: "System", action: "Backup Completed", module: "System", target: "Daily Backup", oldVal: "—", newVal: "vyapari_backup_20240120.zip", ip: "Internal", timestamp: "2024-01-20 02:00:01", severity: "Info" },
  { id: "AUD-5883", user: "Arjun Sharma", avatar: "AS", role: "Super Admin", action: "Integration Connected", module: "Settings", target: "Razorpay", oldVal: "Not Connected", newVal: "Connected", ip: "103.24.56.78", timestamp: "2024-01-19 16:44:30", severity: "Info" },
];
