-- VYAPARI RLS POLICIES
-- Enable RLS on all public tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE FORMAT('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Policy helper: get_business_id()
-- All policies use: (business_id = (SELECT business_id FROM profiles WHERE id = auth.uid()))

-- 1. Businesses (Access for members)
CREATE POLICY "Users can view their own business" ON businesses
  FOR SELECT USING (id = (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- 2. Profiles (Self access)
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- 3. Scoped Tables (Standard business_id filter)
-- contacts, products, invoices, invoice_items, ledger_entries, stock_movements, 
-- invoice_reminders, vani_logs, recurring_schedule, audit_logs

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN VALUES 
    ('contacts'), ('products'), ('invoices'), ('invoice_items'), 
    ('ledger_entries'), ('stock_movements'), ('invoice_reminders'), 
    ('vani_logs'), ('recurring_schedule'), ('audit_logs'),
    ('invoice_payments')
  LOOP
    EXECUTE FORMAT('CREATE POLICY "Tenant isolation select" ON %I FOR SELECT USING (business_id = (SELECT business_id FROM profiles WHERE id = auth.uid()))', tbl);
    EXECUTE FORMAT('CREATE POLICY "Tenant isolation insert" ON %I FOR INSERT WITH CHECK (business_id = (SELECT business_id FROM profiles WHERE id = auth.uid()))', tbl);
    EXECUTE FORMAT('CREATE POLICY "Tenant isolation update" ON %I FOR UPDATE USING (business_id = (SELECT business_id FROM profiles WHERE id = auth.uid()))', tbl);
    EXECUTE FORMAT('CREATE POLICY "Tenant isolation delete" ON %I FOR DELETE USING (business_id = (SELECT business_id FROM profiles WHERE id = auth.uid()))', tbl);
  END LOOP;
END $$;
