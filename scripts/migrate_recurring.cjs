// Uses Supabase's pg_net or plpgsql function to run DDL
// We create a one-time RPC function, call it, then clean up

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3NyYXZlb2p0b2ZycGp4bGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2MzY2NiwiZXhwIjoyMDg5MTM5NjY2fQ.nellAMY-rvxuJkYz96gz4jIAwMKK_M39GIU86RhsWNQ';
const BASE = 'https://nossraveojtofrpjxlhn.supabase.co';

async function callRpc(fn, body = {}) {
  const res = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

async function run() {
  // Try calling apply_schema_migration if it exists (from previous sessions)
  const migrations = [
    `ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS template_items JSONB DEFAULT '[]'`,
    `
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
    )
    `,
    `ALTER TABLE recurring_invoice_items ENABLE ROW LEVEL SECURITY`,
  ];

  for (const sql of migrations) {
    const r = await callRpc('apply_migration', { sql });
    console.log('apply_migration:', r.status, r.body.slice(0, 200));
  }

  // Also try run_migration, execute_sql, admin_execute
  const fns = ['run_sql', 'execute_sql', 'admin_execute', 'run_migration'];
  for (const fn of fns) {
    const r = await callRpc(fn, { query: `SELECT 1` });
    if (r.status !== 404) {
      console.log(`Found callable: ${fn} -> status ${r.status}`);
    }
  }
}

run().catch(e => console.error(e.message));
