-- Temporarily disable RLS to test if that's blocking the frontend query
-- WARNING: Only run this for testing, then re-enable RLS

-- Step 1: Check current RLS status
SELECT 
  'CURRENT_RLS_STATUS' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'worker_bank_details';

-- Step 2: Disable RLS temporarily
ALTER TABLE public.worker_bank_details DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify RLS is disabled
SELECT 
  'RLS_DISABLED' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'worker_bank_details';

-- Step 4: Test query (should work now)
SELECT 
  'TEST_QUERY_AFTER_DISABLING_RLS' as info,
  id,
  worker_id,
  bank_name,
  account_holder_name,
  account_number
FROM public.worker_bank_details;

-- IMPORTANT: Re-enable RLS after testing
-- ALTER TABLE public.worker_bank_details ENABLE ROW LEVEL SECURITY;
