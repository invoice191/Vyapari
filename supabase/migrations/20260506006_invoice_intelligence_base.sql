-- SECTION I5: DB Migration - Columns & Tables

-- Feature 5: Recurring invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurrence_interval TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurrence_next_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_via TEXT DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS recurring_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  template_invoice_id UUID NOT NULL,
  interval TEXT NOT NULL,
  next_run_date DATE NOT NULL,
  last_run_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  auto_send_whatsapp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature 14: Invoice timeline
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS partial_paid_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS partial_paid_amount NUMERIC DEFAULT 0;

-- Feature 15: Split payments
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

-- Feature 16: Internal notes
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Required for Feature 10 (margin alerts) — ensure cost_price is in invoice_items
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cost_price NUMERIC;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_contact_date
  ON invoices (business_id, contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice
  ON invoice_payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_run
  ON recurring_schedule (next_run_date, is_active);


-- SECTION I1: Smart Products Search & Autocomplete Function
DROP FUNCTION IF EXISTS search_products_smart(UUID, TEXT, INT);
CREATE OR REPLACE FUNCTION search_products_smart(
  p_business_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 8
) RETURNS TABLE (
  product_id UUID, name TEXT, unit_price NUMERIC,
  cost_price NUMERIC, quantity NUMERIC, unit TEXT,
  tax_rate NUMERIC, bill_frequency INT,
  stock_status TEXT
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
  SELECT
    p.id, p.name, p.selling_price, p.cost_price,
    p.quantity, p.unit, p.gst_rate,
    COALESCE(f.freq, 0)::INT AS bill_frequency,
    CASE
      WHEN p.quantity = 0 THEN 'out_of_stock'
      WHEN p.quantity <= p.reorder_level THEN 'low_stock'
      ELSE 'in_stock'
    END AS stock_status
  FROM products p
  LEFT JOIN frequency f ON f.product_id = p.id
  WHERE p.business_id = p_business_id
    AND p.name ILIKE '%' || p_query || '%'
  ORDER BY
    CASE WHEN LOWER(p.name) LIKE LOWER(p_query) || '%' THEN 0 ELSE 1 END,
    COALESCE(f.freq, 0) DESC,
    p.name ASC
  LIMIT p_limit;
END; $$ LANGUAGE plpgsql;


-- SECTION I1: Duplicate Invoice Detector Function
DROP FUNCTION IF EXISTS check_duplicate_invoice(UUID, UUID, NUMERIC, INT);
CREATE OR REPLACE FUNCTION check_duplicate_invoice(
  p_business_id UUID,
  p_contact_id UUID,
  p_total_amount NUMERIC,
  p_item_count INT
) RETURNS TABLE (
  invoice_id UUID, invoice_number TEXT,
  created_at TIMESTAMPTZ, total_amount NUMERIC,
  similarity_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id, i.invoice_number, i.created_at, i.total_amount,
    (
      CASE WHEN ABS(i.total_amount - p_total_amount) < p_total_amount * 0.05
           THEN 50 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id)
                = p_item_count THEN 30 ELSE 0 END +
      CASE WHEN i.created_at > NOW() - INTERVAL '2 hours' THEN 20 ELSE 0 END
    )::INT AS similarity_score
  FROM invoices i
  WHERE i.business_id = p_business_id
    AND i.contact_id = p_contact_id
    AND i.created_at > NOW() - INTERVAL '24 hours'
    AND i.status != 'cancelled'
  GROUP BY i.id, i.invoice_number, i.created_at, i.total_amount
  HAVING (
    CASE WHEN ABS(i.total_amount - p_total_amount) < p_total_amount * 0.05
         THEN 50 ELSE 0 END +
    CASE WHEN (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id)
              = p_item_count THEN 30 ELSE 0 END +
    CASE WHEN i.created_at > NOW() - INTERVAL '2 hours' THEN 20 ELSE 0 END
  ) >= 50
  ORDER BY i.created_at DESC;
END; $$ LANGUAGE plpgsql;


-- SECTION I1: Customer Credit & Status Function
DROP FUNCTION IF EXISTS get_customer_credit_status(UUID, UUID);
CREATE OR REPLACE FUNCTION get_customer_credit_status(
  p_business_id UUID, p_contact_id UUID
) RETURNS TABLE (
  contact_name TEXT, outstanding_amount NUMERIC,
  credit_limit NUMERIC, available_credit NUMERIC,
  credit_used_pct NUMERIC, last_invoice_number TEXT,
  last_invoice_amount NUMERIC, last_invoice_days_ago INT,
  avg_payment_days NUMERIC, payment_label TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.name,
    COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'pending'), 0) AS outstanding,
    COALESCE(c.credit_limit, 0),
    GREATEST(0, COALESCE(c.credit_limit, 0) -
      COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'pending'), 0)),
    CASE WHEN COALESCE(c.credit_limit, 0) > 0
         THEN ROUND(COALESCE(SUM(i.total_amount) FILTER
           (WHERE i.status = 'pending'), 0) / c.credit_limit * 100, 0)
         ELSE 0 END,
    (SELECT invoice_number FROM invoices
     WHERE contact_id = p_contact_id AND business_id = p_business_id
     ORDER BY created_at DESC LIMIT 1),
    (SELECT total_amount FROM invoices
     WHERE contact_id = p_contact_id AND business_id = p_business_id
     ORDER BY created_at DESC LIMIT 1),
    EXTRACT(DAY FROM NOW() - (
      SELECT i_sub.created_at FROM invoices i_sub
      WHERE i_sub.contact_id = p_contact_id AND i_sub.business_id = p_business_id
      ORDER BY i_sub.created_at DESC LIMIT 1))::INT,
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM i.updated_at - i.created_at))
      FILTER (WHERE i.status = 'paid'), 1), 30),
    CASE
      WHEN COALESCE(AVG(EXTRACT(DAY FROM i.updated_at - i.created_at))
           FILTER (WHERE i.status = 'paid'), 8) <= 7 THEN 'Excellent payer'
      WHEN COALESCE(AVG(EXTRACT(DAY FROM i.updated_at - i.created_at))
           FILTER (WHERE i.status = 'paid'), 8) <= 15 THEN 'Good payer'
      WHEN COALESCE(AVG(EXTRACT(DAY FROM i.updated_at - i.created_at))
           FILTER (WHERE i.status = 'paid'), 8) <= 30 THEN 'Average payer'
      ELSE 'Slow payer'
    END
  FROM contacts c
  LEFT JOIN invoices i ON i.contact_id = c.id AND i.business_id = p_business_id
  WHERE c.id = p_contact_id AND c.business_id = p_business_id
  GROUP BY c.id, c.name, c.credit_limit;
END; $$ LANGUAGE plpgsql;
