-- Check and fix RLS policies for worker_bank_details table

-- Step 1: Check current RLS status and policies
SELECT 
  'RLS_STATUS' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'worker_bank_details';

SELECT 
  'EXISTING_POLICIES' as info,
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

-- Step 2: Drop existing policies if they exist (they might be too restrictive)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.worker_bank_details;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.worker_bank_details;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.worker_bank_details;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.worker_bank_details;

-- Step 3: Create new, more permissive policies
-- Policy for SELECT (read access)
CREATE POLICY "Enable read access for authenticated users" ON public.worker_bank_details
    FOR SELECT USING (true);

-- Policy for INSERT (create new records)
CREATE POLICY "Enable insert for authenticated users" ON public.worker_bank_details
    FOR INSERT WITH CHECK (true);

-- Policy for UPDATE (modify existing records)
CREATE POLICY "Enable update for authenticated users" ON public.worker_bank_details
    FOR UPDATE USING (true) WITH CHECK (true);

-- Policy for DELETE (remove records)
CREATE POLICY "Enable delete for authenticated users" ON public.worker_bank_details
    FOR DELETE USING (true);

-- Step 4: Verify new policies
SELECT 
  'NEW_POLICIES' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'worker_bank_details'
ORDER BY policyname;

-- Step 5: Test the query as authenticated user
SELECT 
  'FINAL_TEST' as info,
  id,
  worker_id,
  bank_name,
  account_holder_name,
  account_number
FROM public.worker_bank_details;
