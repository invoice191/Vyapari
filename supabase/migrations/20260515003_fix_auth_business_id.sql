-- ============================================================
-- VYAPARI AUTHENTICATION HELPER FIX
-- Description: Adds the missing get_auth_business_id function used by RLS
-- Run this in: https://supabase.com/dashboard/project/nossraveojtofrpjxlhn/sql/new
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_auth_business_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT business_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execution permissions to ensure the function can be called by the API
GRANT EXECUTE ON FUNCTION public.get_auth_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_business_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_auth_business_id() TO service_role;

-- Verify the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_auth_business_id';
