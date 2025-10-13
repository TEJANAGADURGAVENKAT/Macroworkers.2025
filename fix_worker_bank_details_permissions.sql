-- Fix permissions for worker_bank_details table
-- The issue is that authenticated users can't SELECT from the table

-- Step 1: Grant proper permissions to authenticated users
GRANT SELECT ON public.worker_bank_details TO authenticated;
GRANT INSERT ON public.worker_bank_details TO authenticated;
GRANT UPDATE ON public.worker_bank_details TO authenticated;

-- Step 2: Grant permissions to service_role (for admin functions)
GRANT ALL ON public.worker_bank_details TO service_role;

-- Step 3: Grant permissions to anon (if needed for public access)
-- GRANT SELECT ON public.worker_bank_details TO anon;

-- Step 4: Verify the permissions were granted
SELECT 
  'UPDATED_PERMISSIONS' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'worker_bank_details' 
  AND table_schema = 'public'
  AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY grantee, privilege_type;

-- Step 5: Test if authenticated users can now query the table
-- This should work now:
SELECT 
  'TEST_QUERY' as info,
  id,
  worker_id,
  bank_name,
  account_holder_name,
  account_number
FROM public.worker_bank_details;
