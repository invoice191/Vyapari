-- VANI conversation log (track every command for analytics)
CREATE TABLE IF NOT EXISTS vani_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID,
  transcript TEXT NOT NULL,
  intent TEXT,
  confidence NUMERIC,
  was_executed BOOLEAN DEFAULT TRUE,
  was_confirmed BOOLEAN,
  language_detected TEXT,
  response_spoken TEXT,
  execution_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vani_logs_business_date ON vani_logs (business_id, created_at DESC);

-- Reminders (set by VANI)
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID,
  message TEXT NOT NULL,
  remind_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',  -- pending | sent | dismissed
  created_by TEXT DEFAULT 'vani',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reminders_business_status ON reminders (business_id, status);
