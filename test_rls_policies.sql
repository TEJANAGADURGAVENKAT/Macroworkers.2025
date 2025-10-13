-- Test RLS policies and permissions for worker_bank_details table

-- Step 1: Check if RLS is enabled on the table
SELECT 
  'RLS_STATUS' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'worker_bank_details';

-- Step 2: Check existing RLS policies
SELECT 
  'RLS_POLICIES' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'worker_bank_details';

-- Step 3: Test direct query (should work for admin)
SELECT 
  'DIRECT_QUERY_TEST' as info,
  id,
  worker_id,
  bank_name,
  account_holder_name,
  account_number
FROM public.worker_bank_details;

-- Step 4: Check table permissions
SELECT 
  'TABLE_PERMISSIONS' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'worker_bank_details' 
  AND table_schema = 'public';

-- Step 5: Temporarily disable RLS for testing (if needed)
-- ALTER TABLE public.worker_bank_details DISABLE ROW LEVEL SECURITY;

-- Step 6: Re-enable RLS (run this after testing)
-- ALTER TABLE public.worker_bank_details ENABLE ROW LEVEL SECURITY;
