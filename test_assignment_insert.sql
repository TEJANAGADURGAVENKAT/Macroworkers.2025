-- Test Task Assignment Insert
-- This script tests if assignments are being inserted correctly

-- 1. Check recent task assignments
SELECT 
  ta.id,
  ta.task_id,
  t.title,
  ta.worker_id,
  p.full_name as worker_name,
  ta.status,
  ta.assigned_at,
  ta.created_at
FROM public.task_assignments ta
JOIN public.tasks t ON ta.task_id = t.id
JOIN public.profiles p ON ta.worker_id = p.user_id
ORDER BY ta.assigned_at DESC
LIMIT 10;

-- 2. Check if there are any assignments for specific tasks
SELECT 
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count,
  COUNT(ta.id) as actual_assignments,
  STRING_AGG(p.full_name, ', ') as assigned_workers
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
LEFT JOIN public.profiles p ON ta.worker_id = p.user_id
WHERE t.title ILIKE '%backend%' OR t.title ILIKE '%mobile%'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC;

-- 3. Check for any failed assignments or errors
SELECT 
  'Recent assignments' as info,
  COUNT(*) as total_assignments,
  COUNT(CASE WHEN status = 'assigned' THEN 1 END) as active_assignments,
  COUNT(CASE WHEN assigned_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_assignments
FROM public.task_assignments;

-- 4. Test manual assignment to see if triggers work
-- First, find a task with available slots
SELECT 
  id,
  title,
  max_workers,
  assigned_count,
  (max_workers - COALESCE(assigned_count, 0)) as available_slots
FROM public.tasks 
WHERE max_workers > COALESCE(assigned_count, 0)
ORDER BY created_at DESC
LIMIT 1;

-- 5. Check if there are any workers available for testing
SELECT 
  user_id,
  full_name,
  role,
  worker_status
FROM public.profiles 
WHERE role = 'worker' 
  AND worker_status = 'active_employee'
ORDER BY created_at DESC
LIMIT 3;




