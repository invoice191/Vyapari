export interface Product {
  id: string;
  name: string;
  sku?: string;
  category_id?: string;
  selling_price: number;
  cost_price: number;
  reorder_point: number;
  description?: string;
  quantity: number;
  image_url?: string;
  is_active?: boolean;
  category?: string;
}

export interface StockLog {
  id: string;
  product_id: string;
  quantity: number;
  type: 'in' | 'out';
  note?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  business_id: string;
  contact_id?: string;
  total_amount: number;
  partial_paid_amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled';
  type: 'sale' | 'purchase';
  invoice_date: string;
  due_date?: string;
  items?: InvoiceItem[];
  created_at: string;
  payment_status?: string;
  tax_amount?: number;
  contacts?: any;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  details: any;
  user_id: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  reference_id?: string;
}

export interface DSSInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'action';
  title: string;
  description: string;
  impact: string;
  priority: 'High' | 'Medium' | 'Low';
  engine: string;
}

export interface DSSRecommendation {
  id: string;
  type: string;
  title: string;
  body: string;
  impact: string;
  action: string;
}

export interface ParsedInvoiceCommand {
  contact_name: string | null;
  items: Array<{ name: string; quantity: number; unit: string }>;
}

export interface PaymentRiskScore {
  score: number;
  reason: string;
  recommendation: string;
}

export interface ForecastSummary {
  text: string;
}
