-- VYAPARI MASTER SCHEMA v10.0.0

-- BUSINESSES
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  state_code TEXT DEFAULT '27',
  upi_id TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_counter INT DEFAULT 1,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  plan TEXT DEFAULT 'free',
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id),
  full_name TEXT,
  role TEXT DEFAULT 'owner',
  phone TEXT,
  avatar_url TEXT,
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACTS (customers + suppliers)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'customer',
  phone TEXT,
  email TEXT,
  gstin TEXT,
  address TEXT,
  state_code TEXT,
  credit_limit NUMERIC DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  birth_date DATE,
  anniversary_date DATE,
  tags TEXT[],
  notes TEXT,
  clv_tier TEXT DEFAULT 'Bronze',
  rfm_segment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_business_type ON contacts (business_id, type);
CREATE INDEX IF NOT EXISTS idx_contacts_business_name ON contacts (business_id, name);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  quantity NUMERIC DEFAULT 0,
  reorder_level NUMERIC DEFAULT 5,
  tax_rate NUMERIC DEFAULT 18,
  hsn_code TEXT,
  supplier_id UUID REFERENCES contacts(id),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_business_name ON products (business_id, name);
CREATE INDEX IF NOT EXISTS idx_products_business_category ON products (business_id, category);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  invoice_number TEXT,
  contact_id UUID REFERENCES contacts(id),
  type TEXT NOT NULL DEFAULT 'sale',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_mode TEXT DEFAULT 'cash',
  payment_reference TEXT,
  total_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  partial_paid_amount NUMERIC DEFAULT 0,
  due_date DATE,
  notes TEXT,
  internal_notes TEXT,
  is_formal BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_interval TEXT,
  recurrence_next_date DATE,
  recurrence_parent_id UUID REFERENCES invoices(id),
  created_via TEXT DEFAULT 'manual',
  sent_at TIMESTAMPTZ,
  partial_paid_at TIMESTAMPTZ,
  risk_flag BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_business_status ON invoices (business_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_business_contact ON invoices (business_id, contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_business_type ON invoices (business_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_status ON invoices (due_date, status) WHERE status IN ('pending','partial');

-- Invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- generate_invoice_number function
CREATE OR REPLACE FUNCTION generate_invoice_number(p_business_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_number INT;
BEGIN
  SELECT invoice_prefix, invoice_counter INTO v_prefix, v_number
  FROM businesses WHERE id = p_business_id FOR UPDATE;
  UPDATE businesses SET invoice_counter = invoice_counter + 1
  WHERE id = p_business_id;
  RETURN v_prefix || '-' || LPAD(v_number::TEXT, 4, '0');
END; $$ LANGUAGE plpgsql;

-- INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  hsn_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC GENERATED ALWAYS AS
    ((quantity * unit_price) - discount_amount) STORED
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items (product_id);

-- INVOICE PAYMENTS
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_mode TEXT NOT NULL,
  payment_reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments (invoice_id);

-- INVOICE COMMENTS
CREATE TABLE IF NOT EXISTS invoice_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoice_comments_invoice ON invoice_comments (invoice_id, created_at DESC);

-- STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  business_id UUID NOT NULL,
  type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business ON stock_movements (business_id, created_at DESC);

-- LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  balance_after NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_contact ON ledger_entries (business_id, contact_id, created_at DESC);

-- STOCK VELOCITY
CREATE TABLE IF NOT EXISTS stock_velocity (
  product_id UUID PRIMARY KEY REFERENCES products(id),
  business_id UUID NOT NULL,
  avg_daily_sales NUMERIC DEFAULT 0,
  days_until_stockout NUMERIC DEFAULT 9999,
  velocity_trend TEXT DEFAULT 'stable',
  urgency TEXT DEFAULT 'healthy',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COST PRICE HISTORY
CREATE TABLE IF NOT EXISTS cost_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  business_id UUID NOT NULL,
  old_cost_price NUMERIC,
  new_cost_price NUMERIC,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'manual'
);

-- AI CACHE
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry ON ai_cache (expires_at);

-- COMMUNICATION LOG
CREATE TABLE IF NOT EXISTS communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  contact_id UUID,
  channel TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  message_preview TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- VANI LOGS
CREATE TABLE IF NOT EXISTS vani_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID,
  transcript TEXT NOT NULL,
  intent TEXT,
  confidence NUMERIC,
  was_executed BOOLEAN DEFAULT TRUE,
  language_detected TEXT,
  response_spoken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTOMATION RULES
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_category TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  ai_assisted BOOLEAN DEFAULT FALSE,
  trigger_count INT DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTOMATION LOG
CREATE TABLE IF NOT EXISTS automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  rule_id UUID REFERENCES automation_rules(id),
  rule_name TEXT,
  trigger_event TEXT,
  reference_id UUID,
  reference_type TEXT,
  actions_taken JSONB,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  rolled_back_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- WHATSAPP QUEUE
CREATE TABLE IF NOT EXISTS whatsapp_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  contact_id UUID,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'manual',
  reference_id UUID,
  reference_type TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  attempt_count INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_pending ON whatsapp_queue (status, scheduled_for) WHERE status = 'pending';

-- RFM RESULTS
CREATE TABLE IF NOT EXISTS rfm_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  contact_name TEXT,
  recency_days INT,
  frequency INT,
  monetary NUMERIC,
  r_score INT, f_score INT, m_score INT,
  rfm_segment TEXT,
  segment_label TEXT,
  segment_color TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, contact_id)
);

-- LOYALTY POINTS
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  points INT NOT NULL,
  reason TEXT,
  invoice_id UUID REFERENCES invoices(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RECURRING SCHEDULE
CREATE TABLE IF NOT EXISTS recurring_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  template_invoice_id UUID NOT NULL REFERENCES invoices(id),
  interval TEXT NOT NULL,
  next_run_date DATE NOT NULL,
  last_run_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  auto_send_whatsapp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHIFT LOGS
CREATE TABLE IF NOT EXISTS shift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES profiles(id),
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  notes TEXT
);

-- REMINDERS
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID,
  message TEXT NOT NULL,
  remind_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_by TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VENDOR OCR PROFILES
CREATE TABLE IF NOT EXISTS vendor_ocr_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  vendor_name TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  scan_count INT DEFAULT 0,
  avg_confidence NUMERIC DEFAULT 0,
  is_trusted BOOLEAN DEFAULT FALSE,
  bill_fingerprint JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FESTIVAL CALENDAR
CREATE TABLE IF NOT EXISTS festival_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_name TEXT NOT NULL,
  festival_date DATE NOT NULL,
  region TEXT DEFAULT 'all'
);

-- OCR SCANS LOG
CREATE TABLE IF NOT EXISTS ocr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  vendor_name TEXT,
  overall_confidence NUMERIC,
  fields_extracted INT,
  fields_manually_corrected INT DEFAULT 0,
  file_type TEXT,
  was_approved BOOLEAN DEFAULT FALSE,
  scan_date TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard summary view
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  business_id,
  COALESCE(SUM(CASE WHEN DATE(created_at)=CURRENT_DATE AND type='sale'
    AND status!='cancelled' THEN total_amount END),0) AS today_revenue,
  COUNT(CASE WHEN DATE(created_at)=CURRENT_DATE AND type='sale'
    AND status!='cancelled' THEN 1 END) AS today_invoice_count,
  COUNT(CASE WHEN status='pending' AND due_date < CURRENT_DATE
    AND type='sale' THEN 1 END) AS overdue_count,
  COALESCE(SUM(CASE WHEN status='pending' AND due_date < CURRENT_DATE
    AND type='sale' THEN total_amount END),0) AS overdue_amount
FROM invoices
GROUP BY business_id;

-- search_products_smart function
CREATE OR REPLACE FUNCTION search_products_smart(
  p_business_id UUID, p_query TEXT, p_limit INT DEFAULT 8
) RETURNS TABLE (
  product_id UUID, name TEXT, unit_price NUMERIC, cost_price NUMERIC,
  quantity NUMERIC, unit TEXT, tax_rate NUMERIC,
  bill_frequency INT, stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH frequency AS (
    SELECT ii.product_id, COUNT(*)::INT AS freq
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE i.business_id = p_business_id
      AND i.created_at >= NOW() - INTERVAL '90 days'
    GROUP BY ii.product_id
  )
  SELECT p.id, p.name, p.unit_price, p.cost_price, p.quantity, p.unit,
    p.tax_rate, COALESCE(f.freq, 0),
    CASE WHEN p.quantity=0 THEN 'out_of_stock'
         WHEN p.quantity<=p.reorder_level THEN 'low_stock'
         ELSE 'in_stock' END
  FROM products p
  LEFT JOIN frequency f ON f.product_id = p.id
  WHERE p.business_id = p_business_id
    AND p.name ILIKE '%' || p_query || '%'
    AND p.is_active = TRUE
  ORDER BY
    CASE WHEN LOWER(p.name) LIKE LOWER(p_query)||'%' THEN 0 ELSE 1 END,
    COALESCE(f.freq,0) DESC, p.name ASC
  LIMIT p_limit;
END; $$ LANGUAGE plpgsql;

-- calculate_gst_breakdown function
CREATE OR REPLACE FUNCTION calculate_gst_breakdown(
  p_amount NUMERIC, p_tax_rate NUMERIC,
  p_business_gstin TEXT, p_customer_gstin TEXT DEFAULT NULL
) RETURNS TABLE (
  taxable_amount NUMERIC, is_interstate BOOLEAN,
  cgst_rate NUMERIC, cgst_amount NUMERIC,
  sgst_rate NUMERIC, sgst_amount NUMERIC,
  igst_rate NUMERIC, igst_amount NUMERIC,
  total_tax NUMERIC
) AS $$
DECLARE
  v_interstate BOOLEAN;
  v_half_rate NUMERIC;
BEGIN
  v_interstate := p_customer_gstin IS NOT NULL AND
    LEFT(p_business_gstin,2) != LEFT(p_customer_gstin,2);
  v_half_rate := p_tax_rate / 2;
  RETURN QUERY SELECT
    p_amount,
    v_interstate,
    CASE WHEN v_interstate THEN 0 ELSE v_half_rate END,
    CASE WHEN v_interstate THEN 0 ELSE ROUND(p_amount*v_half_rate/100,2) END,
    CASE WHEN v_interstate THEN 0 ELSE v_half_rate END,
    CASE WHEN v_interstate THEN 0 ELSE ROUND(p_amount*v_half_rate/100,2) END,
    CASE WHEN v_interstate THEN p_tax_rate ELSE 0 END,
    CASE WHEN v_interstate THEN ROUND(p_amount*p_tax_rate/100,2) ELSE 0 END,
    ROUND(p_amount*p_tax_rate/100,2);
END; $$ LANGUAGE plpgsql;

-- deduct_stock_safe function
CREATE OR REPLACE FUNCTION deduct_stock_safe(
  p_product_id UUID, p_quantity NUMERIC, p_invoice_id UUID
) RETURNS BOOLEAN AS $$
DECLARE v_current NUMERIC;
BEGIN
  SELECT quantity INTO v_current FROM products
  WHERE id = p_product_id FOR UPDATE;
  IF v_current < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: % available, % requested',
      v_current, p_quantity;
  END IF;
  UPDATE products SET quantity = quantity - p_quantity
  WHERE id = p_product_id;
  INSERT INTO stock_movements (product_id, business_id, type,
    quantity, reference_id, reference_type)
  SELECT p_product_id, business_id, 'out',
    p_quantity, p_invoice_id, 'invoice'
  FROM products WHERE id = p_product_id;
  RETURN TRUE;
END; $$ LANGUAGE plpgsql;

-- Enable RLS on all tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE FORMAT('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;
