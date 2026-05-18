-- Vyapari Database Migration: 20260517001_multi_choice_real_world_solutions.sql
-- Description: Implement database layers for multi-choice settlement, credit risk markups, credit notes, collaborative sync disputes, and payment split installment triggers.

BEGIN;

-- 1. Create Core Enums for Merchant Choice Routing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_path') THEN
        CREATE TYPE settlement_path AS ENUM ('standard', 'liquid_discount', 'factored_bank', 'split_installments', 'debt_endorsement');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'itc_compliance_status') THEN
        CREATE TYPE itc_compliance_status AS ENUM ('unverified', 'matched', 'mismatched', 'held_escrow');
    END IF;
END$$;

-- 2. Extend Invoices Table with User-Agency Choice Fields
ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS preferred_settlement settlement_path DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS factoring_partner_id UUID,
    ADD COLUMN IF NOT EXISTS installment_intervals INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS endorsed_to_business_id UUID,
    ADD COLUMN IF NOT EXISTS risk_markup_percentage NUMERIC(5, 2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS risk_premium_amount NUMERIC(15, 2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS secure_escrow_hold BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS itc_status itc_compliance_status DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS tax_escrow_held_amount NUMERIC(15, 2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS gstr_2b_matching_id VARCHAR(100);

-- 3. Create Installments Splits Table for Micro-Installment Term Options
CREATE TABLE IF NOT EXISTS invoice_payment_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    split_number INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create B2B Credit Notes Table for Partial Acceptance Offsets
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    items_adjusted JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'applied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Extend Peer Drafts (The Mesh Sync Buffer) for Collaborative Dispute Negotiation
ALTER TABLE peer_drafts 
    ADD COLUMN IF NOT EXISTS accepted_items JSONB,
    ADD COLUMN IF NOT EXISTS buyer_proposed_adjustments JSONB,
    ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
    ADD COLUMN IF NOT EXISTS revision_counter INTEGER DEFAULT 0;

-- 6. Trigger Function to Automatically Build Payment Splits on Split Invoices
CREATE OR REPLACE FUNCTION auto_generate_payment_splits()
RETURNS TRIGGER AS $$
DECLARE
    v_split_amount NUMERIC;
    v_counter INTEGER := 1;
    v_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only run if split installments are selected and intervals > 1
    IF NEW.preferred_settlement = 'split_installments' AND NEW.installment_intervals > 1 THEN
        v_split_amount := NEW.total / NEW.installment_intervals;
        
        -- Delete any existing splits to prevent duplicate records
        DELETE FROM invoice_payment_splits WHERE invoice_id = NEW.id;
        
        -- Generate split installment records
        WHILE v_counter <= NEW.installment_intervals LOOP
            v_due_date := NEW.created_at + (v_counter * INTERVAL '7 days'); -- Weekly interval splits
            INSERT INTO invoice_payment_splits (invoice_id, split_number, due_date, amount, status)
            VALUES (NEW.id, v_counter, v_due_date, v_split_amount, 'unpaid');
            v_counter := v_counter + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Define Table Trigger
DROP TRIGGER IF EXISTS trigger_auto_splits ON invoices;
CREATE TRIGGER trigger_auto_splits
    AFTER INSERT OR UPDATE OF preferred_settlement, installment_intervals
    ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_payment_splits();

-- 8. Enable Row Level Security (RLS) on newly created tables
ALTER TABLE invoice_payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

-- 9. Define RLS Policies for invoice payment splits
CREATE POLICY invoice_payment_splits_isolation ON invoice_payment_splits
    FOR ALL
    USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE business_id = auth.uid() OR target_business_id = auth.uid()
        )
    );

-- 10. Define RLS Policies for credit notes
CREATE POLICY credit_notes_isolation ON credit_notes
    FOR ALL
    USING (
        business_id = auth.uid() OR target_business_id = auth.uid()
    );

COMMIT;
