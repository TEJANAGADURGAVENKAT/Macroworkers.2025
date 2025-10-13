-- Check if task_payment_records table exists and has proper permissions

-- Step 1: Check if table exists
SELECT 
  'TABLE_EXISTS' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'task_payment_records';

-- Step 2: Check table structure
SELECT 
  'TABLE_COLUMNS' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'task_payment_records' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check permissions
SELECT 
  'TABLE_PERMISSIONS' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'task_payment_records' 
  AND table_schema = 'public'
  AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY grantee, privilege_type;

-- Step 4: Check RLS status
SELECT 
  'RLS_STATUS' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'task_payment_records';

-- Step 5: Check existing data
SELECT 
  'EXISTING_DATA' as info,
  COUNT(*) as total_records,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed
FROM public.task_payment_records;
