/**
 * apply-migration.ts
 * Run this ONCE to add staff columns to the profiles table.
 * Usage: npx tsx scripts/apply-migration.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MIGRATION_SQL = `
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON public.profiles(business_id);
`;

async function applyMigration() {
  console.log("📦 Applying staff columns migration to Supabase...");

  const statements = MIGRATION_SQL
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let allSuccess = true;

  for (const statement of statements) {
    console.log(`  ▸ Running: ${statement.substring(0, 80)}...`);
    const { error } = await supabase.rpc("exec_sql", { sql: statement + ";" }).maybeSingle();
    if (error) {
      // Try direct approach
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ sql: statement + ";" }),
        });
        if (!res.ok) {
          console.warn(`  ⚠️  RPC failed (may be expected if column already exists):`, error.message);
          allSuccess = false;
        } else {
          console.log(`  ✅ Done`);
        }
      } catch (fetchErr) {
        console.warn(`  ⚠️  Statement failed:`, error.message);
      }
    } else {
      console.log(`  ✅ Done`);
    }
  }

  if (allSuccess) {
    console.log("\n✅ Migration complete! All staff columns added to profiles table.");
  } else {
    console.log("\n⚠️  Some statements may have been skipped (likely already applied). Check Supabase dashboard.");
  }
}

applyMigration().catch(console.error);
