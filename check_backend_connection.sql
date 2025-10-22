-- =====================================================
-- CHECK BACKEND CONNECTION ISSUES
-- =====================================================
-- This script helps identify if there are any database connection issues

-- Check if Supabase is accessible
SELECT 
  'SUPABASE CONNECTION TEST' as test_type,
  NOW() as current_time,
  'Connection successful!' as status;

-- Check if all required tables exist
SELECT 
  'TABLE EXISTENCE CHECK' as test_type,
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'tasks', 
    'task_assignments', 
    'profiles', 
    'task_payment_records',
    'worker_bank_details',
    'transaction_proofs'
  )
ORDER BY table_name;

-- Check if triggers are working
SELECT 
  'TRIGGER STATUS CHECK' as test_type,
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE '%task_slot%'
ORDER BY trigger_name;

-- Check current slot counts
SELECT 
  'CURRENT SLOT COUNTS' as test_type,
  id,
  title,
  max_workers,
  assigned_count,
  completed_slots,
  CASE 
    WHEN assigned_count > max_workers THEN 'OVER-ASSIGNED'
    WHEN assigned_count = max_workers THEN 'FULL'
    ELSE 'AVAILABLE'
  END as status
FROM tasks 
ORDER BY created_at DESC 
LIMIT 5;

-- Check for any data inconsistencies
SELECT 
  'DATA CONSISTENCY CHECK' as test_type,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN assigned_count > max_workers THEN 1 END) as over_assigned,
  COUNT(CASE WHEN assigned_count < 0 THEN 1 END) as negative_assigned,
  COUNT(CASE WHEN max_workers IS NULL OR max_workers = 0 THEN 1 END) as invalid_max_workers
FROM tasks;




