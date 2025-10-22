-- Test Task Slots System
-- This script tests if the slot counting system is working correctly

-- 1. Check current task slot information
SELECT 
  id,
  title,
  max_workers,
  assigned_count,
  (max_workers - COALESCE(assigned_count, 0)) as available_slots
FROM public.tasks 
WHERE max_workers > 1
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check task assignments for these tasks
SELECT 
  ta.task_id,
  t.title,
  ta.worker_id,
  p.full_name as worker_name,
  ta.status,
  ta.assigned_at
FROM public.task_assignments ta
JOIN public.tasks t ON ta.task_id = t.id
JOIN public.profiles p ON ta.worker_id = p.user_id
WHERE t.max_workers > 1
ORDER BY ta.assigned_at DESC;

-- 3. Test the slot info function
SELECT * FROM get_task_slot_info(
  (SELECT id FROM public.tasks WHERE max_workers > 1 LIMIT 1)
);

-- 4. Check if triggers are working by looking at recent assignments
SELECT 
  'Recent Assignments' as info,
  COUNT(*) as total_assignments,
  COUNT(CASE WHEN status = 'assigned' THEN 1 END) as active_assignments
FROM public.task_assignments 
WHERE assigned_at > NOW() - INTERVAL '1 hour';

-- 5. Verify task counts are correct
SELECT 
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as status_check
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
WHERE t.max_workers > 1
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC;




