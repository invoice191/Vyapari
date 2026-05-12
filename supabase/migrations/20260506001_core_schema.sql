-- VYAPARI CORE SCHEMA
-- Businesses & Profiles
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

-- Master Data: Contacts & Products
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

-- Transactional: Invoices & Items
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
  discount_amount NUMERIC DEFAULT 0
);

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

-- Financial: Ledger & Stock
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  type TEXT NOT NULL, -- 'debit', 'credit'
  amount NUMERIC NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  balance_after NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  business_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
  quantity NUMERIC NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operational: Reminders & VANI
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  business_id UUID NOT NULL,
  status TEXT DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vani_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID,
  transcript TEXT NOT NULL,
  intent TEXT,
  confidence NUMERIC,
  was_executed BOOLEAN DEFAULT TRUE,
  response_spoken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recurring_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  template_invoice_id UUID NOT NULL REFERENCES invoices(id),
  interval TEXT NOT NULL,
  next_run_date DATE NOT NULL,
  last_run_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
