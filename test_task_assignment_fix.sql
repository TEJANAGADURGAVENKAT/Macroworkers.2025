-- Test script to verify task assignment fix
-- Run this after applying the RLS policy fix

-- 1. Check if task_assignments table is accessible
SELECT 'Table exists:' as test, EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'task_assignments'
) as result;

-- 2. Check RLS policies
SELECT 'RLS Policies:' as test, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'task_assignments';

-- 3. Check if we can select from the table (this should work for authenticated users)
SELECT 'Can select:' as test, COUNT(*) as record_count
FROM public.task_assignments;

-- 4. Check tasks with assignment info
SELECT 
  'Task assignment info:' as test,
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count,
  COUNT(ta.id) as actual_assignments
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
LIMIT 5;

-- 5. Check if there are any existing assignments
SELECT 'Existing assignments:' as test, COUNT(*) as total_assignments
FROM public.task_assignments;

-- 6. Test insert permission (this will show if RLS allows inserts)
-- Note: This will only work if you're authenticated as a worker
-- Uncomment the line below to test (replace 'your-user-id' with actual user ID)
-- INSERT INTO public.task_assignments (task_id, worker_id, status) VALUES ((SELECT id FROM public.tasks LIMIT 1), 'your-user-id', 'assigned');
