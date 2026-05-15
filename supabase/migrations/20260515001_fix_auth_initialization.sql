-- FIX FOR AUTH INITIALIZATION AND MISSING COLUMNS
-- This migration ensures that new accounts can be created and initialized correctly.

-- 1. Add missing columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Create the initialization RPC used by AuthContext
CREATE OR REPLACE FUNCTION initialize_new_business(
  p_business_name TEXT,
  p_full_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
  v_profile JSONB;
  v_business JSONB;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Safety check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if profile already exists to avoid duplicates
  SELECT business_id INTO v_business_id FROM public.profiles WHERE id = v_user_id;
  
  IF v_business_id IS NULL THEN
    -- 1. Create a new Business record
    INSERT INTO public.businesses (name, owner_name, onboarding_completed)
    VALUES (p_business_name, p_full_name, FALSE)
    RETURNING id INTO v_business_id;

    -- 2. Create/Update the Profile record
    INSERT INTO public.profiles (id, business_id, full_name, role)
    VALUES (v_user_id, v_business_id, p_full_name, 'owner')
    ON CONFLICT (id) DO UPDATE 
    SET business_id = EXCLUDED.business_id, 
        full_name = EXCLUDED.full_name
    RETURNING row_to_json(profiles.*)::JSONB INTO v_profile;
  ELSE
    -- If profile already exists, just get it
    SELECT row_to_json(profiles.*)::JSONB INTO v_profile FROM public.profiles WHERE id = v_user_id;
  END IF;

  -- 3. Get the Business record
  SELECT row_to_json(businesses.*)::JSONB INTO v_business
  FROM public.businesses WHERE id = v_business_id;

  -- 4. Return both as expected by AuthContext.tsx
  RETURN jsonb_build_object(
    'profile', v_profile,
    'business', v_business
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Optional: Add a trigger to handle new users automatically if metadata is present
-- This acts as a secondary safety net in case the frontend RPC call fails or is skipped.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Only run if metadata is present and profile doesn't exist
  IF NEW.raw_user_meta_data IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Create business
    INSERT INTO public.businesses (name, owner_name, onboarding_completed)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Owner'),
      FALSE
    )
    RETURNING id INTO v_business_id;

    -- Create profile
    INSERT INTO public.profiles (id, business_id, full_name, role)
    VALUES (
      NEW.id,
      v_business_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Owner'),
      'owner'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Create missing tables used in onboarding
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  prefix TEXT NOT NULL,
  current_value INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, type)
);

CREATE TABLE IF NOT EXISTS public.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 10,
  unit TEXT DEFAULT 'pcs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies
DO $$ BEGIN
  CREATE POLICY "Users can manage their own business sequences" ON public.invoice_sequences
    FOR ALL USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their own business stock" ON public.stock
    FOR ALL USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

