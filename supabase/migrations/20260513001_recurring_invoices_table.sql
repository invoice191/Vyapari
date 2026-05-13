-- ============================================================
-- Migration: Create recurring_invoices table
-- This is the proper dedicated table for Recurring Templates
-- (separate from the old recurring_schedule table)
-- ============================================================

CREATE TABLE IF NOT EXISTS recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused')),
  next_invoice_date DATE NOT NULL,
  last_invoiced_at TIMESTAMPTZ,
  total_created INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores the individual line items for each template
CREATE TABLE IF NOT EXISTS recurring_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_invoice_id UUID NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_business
  ON recurring_invoices (business_id, status);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_date
  ON recurring_invoices (next_invoice_date)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_recurring_invoice_items_parent
  ON recurring_invoice_items (recurring_invoice_id);

-- Enable RLS
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their business recurring invoices"
  ON recurring_invoices
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their business recurring invoice items"
  ON recurring_invoice_items
  FOR ALL
  USING (
    recurring_invoice_id IN (
      SELECT ri.id FROM recurring_invoices ri
      JOIN profiles p ON p.business_id = ri.business_id
      WHERE p.id = auth.uid()
    )
  );
