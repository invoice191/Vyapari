CREATE TABLE IF NOT EXISTS vani_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transcript          TEXT NOT NULL,
  intent              TEXT,
  confidence          FLOAT DEFAULT 1.0,
  reply               TEXT,
  spoken_response     TEXT,
  data_sourced_from   TEXT[],
  active_entities     TEXT[],
  execution_status    TEXT DEFAULT 'answered',
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE vani_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vani_logs_business_scoped" ON vani_logs
  FOR ALL USING (business_id = auth.uid());

-- Index for fast recent log fetch
CREATE INDEX idx_vani_logs_business_date
  ON vani_logs (business_id, created_at DESC);
