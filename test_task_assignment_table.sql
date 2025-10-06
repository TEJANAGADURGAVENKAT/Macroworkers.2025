-- Test script to check task_assignments table and RLS policies
-- Run this to diagnose the 400 error

-- 1. Check if task_assignments table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'task_assignments'
) as table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'task_assignments'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'task_assignments';

-- 4. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'task_assignments';

-- 5. Test basic insert (this should work for admin)
-- Note: Replace 'your-user-id' with actual user ID
/*
INSERT INTO public.task_assignments (task_id, worker_id, status)
VALUES (
  (SELECT id FROM public.tasks LIMIT 1),
  'your-user-id',
  'assigned'
);
*/

-- 6. Check existing assignments
SELECT COUNT(*) as total_assignments FROM public.task_assignments;

-- 7. Check tasks with assignment counts
SELECT 
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count,
  COUNT(ta.id) as actual_assignments
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
LIMIT 10;
