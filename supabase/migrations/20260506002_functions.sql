-- VYAPARI FUNCTIONS
-- 1. Smart Product Search (Inventory Velocity Based)
CREATE OR REPLACE FUNCTION search_products_smart(
  p_business_id UUID, p_query TEXT, p_limit INT DEFAULT 8
) RETURNS TABLE (
  product_id UUID, name TEXT, selling_price NUMERIC, cost_price NUMERIC,
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
  SELECT p.id, p.name, p.selling_price, p.cost_price, p.quantity, p.unit,
    p.gst_rate, COALESCE(f.freq, 0)::INT,
    CASE WHEN p.quantity=0 THEN 'out_of_stock'
         WHEN p.quantity<=p.reorder_point THEN 'low_stock'
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

-- 2. Safe Stock Deduction (Race-condition safe)
CREATE OR REPLACE FUNCTION deduct_stock_safe(
  p_product_id UUID, p_quantity NUMERIC, p_invoice_id UUID
) RETURNS BOOLEAN AS $$
DECLARE v_current NUMERIC;
BEGIN
  SELECT quantity INTO v_current FROM products
  WHERE id = p_product_id FOR UPDATE;
  
  IF v_current < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: % available, % requested', v_current, p_quantity;
  END IF;
  
  UPDATE products SET quantity = quantity - p_quantity WHERE id = p_product_id;
  
  INSERT INTO stock_movements (product_id, business_id, type, quantity, reference_id, reference_type)
  SELECT p_product_id, business_id, 'out', p_quantity, p_invoice_id, 'invoice'
  FROM products WHERE id = p_product_id;
  
  RETURN TRUE;
END; $$ LANGUAGE plpgsql;

-- 3. Customer Credit Intelligence
CREATE OR REPLACE FUNCTION get_customer_credit_status(
  p_business_id UUID, p_contact_id UUID
) RETURNS TABLE (
  contact_name TEXT,
  outstanding_amount NUMERIC,
  credit_limit NUMERIC,
  available_credit NUMERIC,
  credit_used_pct NUMERIC,
  last_invoice_number TEXT,
  last_invoice_amount NUMERIC,
  last_invoice_days_ago INT,
  avg_payment_days NUMERIC,
  payment_label TEXT
) AS $$
DECLARE
  v_name TEXT;
  v_limit NUMERIC;
  v_out NUMERIC;
  v_last_no TEXT;
  v_last_amt NUMERIC;
  v_last_days INT;
  v_avg_days NUMERIC;
BEGIN
  -- Basic Info
  SELECT name, credit_limit INTO v_name, v_limit FROM contacts WHERE id = p_contact_id;
  
  -- Outstanding (Pending/Partial Sale Invoices)
  SELECT COALESCE(SUM(total_amount - partial_paid_amount), 0) INTO v_out 
  FROM invoices 
  WHERE business_id = p_business_id AND contact_id = p_contact_id 
    AND status IN ('pending', 'partial') AND type = 'sale';
    
  -- Last Invoice
  SELECT invoice_number, total_amount, (EXTRACT(DAY FROM (NOW() - created_at)))::INT
  INTO v_last_no, v_last_amt, v_last_days
  FROM invoices
  WHERE business_id = p_business_id AND contact_id = p_contact_id
  ORDER BY created_at DESC LIMIT 1;
  
  -- Avg Payment Time
  SELECT AVG(EXTRACT(DAY FROM (updated_at - created_at)))
  INTO v_avg_days
  FROM invoices
  WHERE business_id = p_business_id AND contact_id = p_contact_id
    AND status = 'paid' AND type = 'sale';
    
  RETURN QUERY SELECT 
    v_name,
    v_out,
    v_limit,
    GREATEST(0, v_limit - v_out),
    CASE WHEN v_limit > 0 THEN LEAST(100, (v_out / v_limit) * 100) ELSE 0 END,
    v_last_no,
    v_last_amt,
    v_last_days,
    v_avg_days,
    CASE 
      WHEN v_avg_days IS NULL THEN 'New customer'
      WHEN v_avg_days <= 15 THEN 'Excellent payer'
      WHEN v_avg_days <= 30 THEN 'Good payer'
      ELSE 'Slow payer'
    END;
END; $$ LANGUAGE plpgsql;

-- 4. Duplicate Invoice Check
CREATE OR REPLACE FUNCTION check_duplicate_invoice(
  p_business_id UUID, p_contact_id UUID, p_amount NUMERIC, p_item_count INT
) RETURNS TABLE (
  invoice_number TEXT, total_amount NUMERIC, created_at TIMESTAMPTZ, similarity_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.invoice_number, i.total_amount, i.created_at,
    CASE 
      WHEN i.total_amount = p_amount THEN 100
      ELSE (100 - ABS(100 * (i.total_amount - p_amount) / NULLIF(p_amount, 0)))::INT
    END as sim
  FROM invoices i
  WHERE i.business_id = p_business_id 
    AND i.contact_id = p_contact_id
    AND i.created_at >= NOW() - INTERVAL '30 minutes'
    AND i.status != 'cancelled'
  ORDER BY sim DESC LIMIT 1;
END; $$ LANGUAGE plpgsql;

-- 5. Bill Like Last Time (Template fetcher)
CREATE OR REPLACE FUNCTION get_last_invoice_template(
  p_business_id UUID, p_contact_id UUID
) RETURNS TABLE (
  product_id UUID, product_name TEXT, quantity NUMERIC, unit_price NUMERIC, tax_rate NUMERIC, unit TEXT
) AS $$
DECLARE v_inv_id UUID;
BEGIN
  SELECT id INTO v_inv_id FROM invoices 
  WHERE business_id = p_business_id AND contact_id = p_contact_id
  ORDER BY created_at DESC LIMIT 1;
  
  RETURN QUERY
  SELECT ii.product_id, ii.product_name, ii.quantity, ii.unit_price, ii.tax_rate, p.unit
  FROM invoice_items ii
  LEFT JOIN products p ON p.id = ii.product_id
  WHERE ii.invoice_id = v_inv_id;
END; $$ LANGUAGE plpgsql;

-- 6. Sequential Invoice Number Generator
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
  
  RETURN v_prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_number::TEXT, 4, '0');
END; $$ LANGUAGE plpgsql;

-- 7. GST Breakdown Calculator
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

-- 8. Dashboard Summary RPC
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_business_id UUID)
RETURNS TABLE (
  today_revenue NUMERIC,
  today_invoice_count INT,
  overdue_count INT,
  active_invoices_count INT,
  low_stock_count INT
) AS $$
BEGIN
  RETURN QUERY
  WITH inv_stats AS (
    SELECT
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE AND status != 'cancelled' THEN total_amount ELSE 0 END), 0) as rev,
      COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE AND status != 'cancelled' THEN 1 END)::INT as cnt,
      COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END)::INT as ovrd,
      COUNT(CASE WHEN status IN ('pending', 'partial') THEN 1 END)::INT as actv
    FROM invoices
    WHERE business_id = p_business_id
  ),
  prod_stats AS (
    SELECT COUNT(*)::INT as low
    FROM products
    WHERE business_id = p_business_id AND quantity <= reorder_point
  )
  SELECT i.rev, i.cnt, i.ovrd, i.actv, p.low
  FROM inv_stats i, prod_stats p;
END; $$ LANGUAGE plpgsql;

-- 9. Consolidated Analytics RPC
CREATE OR REPLACE FUNCTION get_consolidated_analytics(p_business_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'summary', (SELECT row_to_json(s) FROM get_dashboard_summary(p_business_id) s),
    'recent_sales', (SELECT jsonb_agg(row_to_json(r)) FROM (SELECT * FROM invoices WHERE business_id = p_business_id ORDER BY created_at DESC LIMIT 5) r),
    'top_products', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT p.name, SUM(ii.quantity) as total_sold FROM invoice_items ii JOIN products p ON p.id = ii.product_id WHERE p.business_id = p_business_id GROUP BY p.name ORDER BY total_sold DESC LIMIT 5) t)
  ) INTO v_result;
  RETURN v_result;
END; $$ LANGUAGE plpgsql;
