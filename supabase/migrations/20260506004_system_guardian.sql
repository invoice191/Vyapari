-- SYSTEM GUARDIAN ENHANCEMENTS

-- 1. Add owner_pin to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_pin TEXT;

-- 2. Create system_alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'security', 'inventory', 'compliance'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  details JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance audit_logs with IP and before/after values
-- (audit_logs already has details JSONB, we'll use that for before/after)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS module TEXT;

-- 4. Anomaly Detection View (Optional, but useful)
CREATE OR REPLACE VIEW user_void_anomalies AS
SELECT 
  business_id,
  user_id,
  COUNT(*) as void_count,
  date_trunc('day', created_at) as event_date
FROM audit_logs
WHERE action = 'invoice_void'
GROUP BY business_id, user_id, date_trunc('day', created_at)
HAVING COUNT(*) >= 3;

-- 5. RLS Policies for system_alerts
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view alerts" ON system_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.business_id = system_alerts.business_id 
      AND profiles.role = 'owner'
    )
  );
