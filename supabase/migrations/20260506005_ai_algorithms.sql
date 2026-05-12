-- 1. RFM Customer Segmentation Algorithm
CREATE OR REPLACE FUNCTION calculate_rfm(p_business_id UUID)
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  recency_days INT,
  frequency INT,
  monetary NUMERIC,
  r_score INT,
  f_score INT,
  m_score INT,
  rfm_segment TEXT,
  rfm_label TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      c.id AS contact_id,
      c.name AS contact_name,
      EXTRACT(DAY FROM NOW() - COALESCE(MAX(i.created_at), NOW() - INTERVAL '365 days'))::INT AS recency_days,
      COUNT(i.id)::INT AS frequency,
      COALESCE(SUM(i.total_amount), 0) AS monetary
    FROM contacts c
    LEFT JOIN invoices i ON i.contact_id = c.id
      AND i.business_id = p_business_id
      AND i.type = 'sale'
      AND i.status != 'cancelled'
    WHERE c.business_id = p_business_id
      AND c.type = 'customer'
    GROUP BY c.id, c.name
  ),
  scored AS (
    SELECT *,
      NTILE(5) OVER (ORDER BY recency_days ASC)  AS r_score,
      NTILE(5) OVER (ORDER BY frequency DESC)     AS f_score,
      NTILE(5) OVER (ORDER BY monetary DESC)      AS m_score
    FROM base
  )
  SELECT
    s.contact_id, s.contact_name, s.recency_days, s.frequency, s.monetary,
    s.r_score, s.f_score, s.m_score,
    CONCAT(s.r_score::TEXT, s.f_score::TEXT, s.m_score::TEXT) AS rfm_segment,
    CASE
      WHEN s.r_score >= 4 AND s.f_score >= 4 AND s.m_score >= 4 THEN 'Champion'
      WHEN s.r_score >= 3 AND s.f_score >= 3                  THEN 'Loyal'
      WHEN s.r_score >= 3 AND s.f_score <= 2                  THEN 'Promising'
      WHEN s.r_score <= 2 AND s.f_score >= 3                  THEN 'At Risk'
      WHEN s.r_score <= 2 AND s.f_score <= 2 AND s.m_score >= 3 THEN 'Cannot Lose'
      WHEN s.r_score = 1                                    THEN 'Lost'
      ELSE 'New'
    END AS rfm_label
  FROM scored s;
END;
$$ LANGUAGE plpgsql;

-- 2. Stock Velocity + Stockout Prediction Algorithm
CREATE OR REPLACE FUNCTION get_stock_velocity(p_business_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  current_stock NUMERIC,
  avg_daily_sales NUMERIC,
  days_until_stockout NUMERIC,
  stockout_date DATE,
  velocity_label TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_sales AS (
    SELECT
      ii.product_id,
      SUM(ii.quantity) / 30.0 AS avg_daily_sales
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE i.business_id = p_business_id
      AND i.type = 'sale'
      AND i.status != 'cancelled'
      AND i.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY ii.product_id
  )
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.quantity AS current_stock,
    COALESCE(ds.avg_daily_sales, 0) AS avg_daily_sales,
    CASE
      WHEN COALESCE(ds.avg_daily_sales, 0) = 0 THEN 999
      ELSE ROUND(p.quantity / ds.avg_daily_sales)
    END AS days_until_stockout,
    CASE
      WHEN COALESCE(ds.avg_daily_sales, 0) = 0 THEN NULL
      ELSE (NOW() + (p.quantity / ds.avg_daily_sales * INTERVAL '1 day'))::DATE
    END AS stockout_date,
    CASE
      WHEN COALESCE(ds.avg_daily_sales, 0) = 0 THEN 'No sales'
      WHEN p.quantity / ds.avg_daily_sales <= 3  THEN 'Critical'
      WHEN p.quantity / ds.avg_daily_sales <= 7  THEN 'Low'
      WHEN p.quantity / ds.avg_daily_sales <= 14 THEN 'Watch'
      ELSE 'Healthy'
    END AS velocity_label
  FROM products p
  LEFT JOIN daily_sales ds ON ds.product_id = p.id
  WHERE p.business_id = p_business_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Anomaly Detection (Z-Score) Algorithm
CREATE OR REPLACE FUNCTION detect_anomalies(p_business_id UUID)
RETURNS TABLE (
  anomaly_type TEXT,
  reference_id UUID,
  description TEXT,
  severity TEXT,
  detected_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Invoice amount anomalies (Z-score > 2)
  RETURN QUERY
  WITH customer_stats AS (
    SELECT
      i.contact_id,
      AVG(i.total_amount) AS avg_amount,
      STDDEV(i.total_amount) AS std_amount
    FROM invoices i
    WHERE i.business_id = p_business_id AND i.type = 'sale' AND i.status != 'cancelled'
    GROUP BY i.contact_id
    HAVING COUNT(*) >= 3  -- need at least 3 invoices for meaningful stats
  )
  SELECT
    'high_invoice_amount'::TEXT,
    i.id,
    FORMAT('%s: ₹%s (avg: ₹%s)', c.name,
      ROUND(i.total_amount), ROUND(cs.avg_amount)) AS description,
    CASE
      WHEN (i.total_amount - cs.avg_amount) / NULLIF(cs.std_amount, 0) > 3
        THEN 'High'
      ELSE 'Medium'
    END AS severity,
    i.created_at
  FROM invoices i
  JOIN customer_stats cs ON cs.contact_id = i.contact_id
  JOIN contacts c ON c.id = i.contact_id
  WHERE i.business_id = p_business_id
    AND i.created_at >= NOW() - INTERVAL '7 days'
    AND cs.std_amount > 0
    AND (i.total_amount - cs.avg_amount) / cs.std_amount > 2;

  -- Daily revenue anomalies
  RETURN QUERY
  WITH daily AS (
    SELECT DATE(created_at) AS day, SUM(total_amount) AS revenue
    FROM invoices
    WHERE business_id = p_business_id
      AND type = 'sale'
      AND status != 'cancelled'
      AND created_at >= NOW() - INTERVAL '60 days'
    GROUP BY DATE(created_at)
  ),
  stats AS (
    SELECT AVG(revenue) AS avg_rev, STDDEV(revenue) AS std_rev FROM daily
    WHERE day < CURRENT_DATE
  )
  SELECT
    'revenue_spike'::TEXT,
    gen_random_uuid(),
    FORMAT('Today revenue ₹%s vs avg ₹%s',
      ROUND((SELECT COALESCE(revenue, 0) FROM daily WHERE day = CURRENT_DATE)),
      ROUND(avg_rev)) AS description,
    'Medium'::TEXT,
    NOW()
  FROM stats
  WHERE std_rev > 0
    AND EXISTS (SELECT 1 FROM daily WHERE day = CURRENT_DATE)
    AND ABS(
      (SELECT COALESCE(revenue, 0) FROM daily WHERE day = CURRENT_DATE) - avg_rev
    ) / std_rev > 2;
END;
$$ LANGUAGE plpgsql;

-- 4. Customer Lifetime Value (CLV) Algorithm
CREATE OR REPLACE FUNCTION calculate_clv(p_business_id UUID)
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  avg_order_value NUMERIC,
  purchase_frequency NUMERIC,  -- orders per month
  customer_lifespan_months NUMERIC,
  clv NUMERIC,
  clv_tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      c.id AS contact_id,
      c.name AS contact_name,
      AVG(i.total_amount) AS avg_order_value,
      COUNT(i.id)::NUMERIC /
        NULLIF(EXTRACT(MONTH FROM NOW() - MIN(i.created_at)), 0)
        AS purchase_frequency,
      EXTRACT(MONTH FROM NOW() - MIN(i.created_at)) AS lifespan_months
    FROM contacts c
    JOIN invoices i ON i.contact_id = c.id
    WHERE c.business_id = p_business_id
      AND c.type = 'customer'
      AND i.type = 'sale'
      AND i.status != 'cancelled'
    GROUP BY c.id, c.name
    HAVING COUNT(i.id) >= 2
  )
  SELECT
    s.contact_id,
    s.contact_name,
    ROUND(s.avg_order_value, 2),
    ROUND(s.purchase_frequency, 2),
    s.lifespan_months,
    ROUND(s.avg_order_value * s.purchase_frequency * GREATEST(s.lifespan_months, 1), 2) AS clv,
    CASE
      WHEN s.avg_order_value * s.purchase_frequency * GREATEST(s.lifespan_months, 1) >= 100000
        THEN 'Platinum'
      WHEN s.avg_order_value * s.purchase_frequency * GREATEST(s.lifespan_months, 1) >= 50000
        THEN 'Gold'
      WHEN s.avg_order_value * s.purchase_frequency * GREATEST(s.lifespan_months, 1) >= 10000
        THEN 'Silver'
      ELSE 'Bronze'
    END AS clv_tier
  FROM stats s;
END;
$$ LANGUAGE plpgsql;

-- 5. Pricing Gap Detector Algorithm
CREATE OR REPLACE FUNCTION detect_pricing_gaps(p_business_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  category TEXT,
  current_margin_pct NUMERIC,
  category_avg_margin_pct NUMERIC,
  gap_pct NUMERIC,
  suggested_price NUMERIC,
  potential_gain_monthly NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH product_margins AS (
    SELECT
      p.id,
      p.name,
      p.category,
      p.selling_price,
      p.cost_price,
      CASE WHEN p.selling_price > 0
        THEN ROUND(((p.selling_price - p.cost_price) / p.selling_price) * 100, 1)
        ELSE 0
      END AS margin_pct,
      -- avg units sold per month
      COALESCE((
        SELECT SUM(ii.quantity) / 1.0
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        WHERE ii.product_id = p.id
          AND i.status != 'cancelled'
          AND i.created_at >= NOW() - INTERVAL '30 days'
      ), 0) AS monthly_units
    FROM products p
    WHERE p.business_id = p_business_id
      AND p.cost_price > 0
  ),
  category_avg AS (
    SELECT pm.category, AVG(pm.margin_pct) AS avg_margin
    FROM product_margins pm
    GROUP BY pm.category
  )
  SELECT
    pm.id,
    pm.name,
    pm.category,
    pm.margin_pct AS current_margin_pct,
    ROUND(ca.avg_margin, 1) AS category_avg_margin_pct,
    ROUND(ca.avg_margin - pm.margin_pct, 1) AS gap_pct,
    -- suggested price to hit category avg margin
    ROUND(pm.cost_price / (1 - ca.avg_margin / 100), 2) AS suggested_price,
    -- potential extra income if price adjusted
    ROUND(pm.monthly_units *
      (pm.cost_price / (1 - ca.avg_margin/100) - pm.selling_price), 2
    ) AS potential_gain_monthly
  FROM product_margins pm
  JOIN category_avg ca ON ca.category = pm.category
  WHERE pm.margin_pct < ca.avg_margin - 5  -- only flag if 5% below avg
  ORDER BY potential_gain_monthly DESC;
END;
$$ LANGUAGE plpgsql;
