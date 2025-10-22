-- Fix Over-Assignment Issue
-- This script fixes the Email Marketing task that has 3 workers assigned to a 2-slot task

-- 1. First, let's see what's happening with the over-assigned tasks
SELECT 
  ta.task_id,
  t.title,
  t.max_workers,
  t.assigned_count,
  ta.worker_id,
  p.full_name as worker_name,
  ta.status,
  ta.assigned_at
FROM public.task_assignments ta
JOIN public.tasks t ON ta.task_id = t.id
JOIN public.profiles p ON ta.worker_id = p.user_id
WHERE t.assigned_count > t.max_workers
ORDER BY t.title, ta.assigned_at;

-- 2. Fix the over-assignment by updating max_workers to match actual assignments
-- OR remove the extra assignment (we'll choose to update max_workers to be safe)
UPDATE public.tasks 
SET max_workers = assigned_count 
WHERE assigned_count > max_workers;

-- 3. Verify the fix for all over-assigned tasks
SELECT 
  id,
  title,
  max_workers,
  assigned_count,
  (max_workers - COALESCE(assigned_count, 0)) as available_slots,
  CASE 
    WHEN assigned_count <= max_workers THEN 'CORRECT'
    ELSE 'OVER-ASSIGNED'
  END as status_check
FROM public.tasks 
WHERE assigned_count > max_workers OR id IN ('609de923-569a-4d62-9d43-04be6958dbd9', '12d36322-f63e-42b6-8484-9f6254b0edd3');

-- 4. Check for any other over-assigned tasks
SELECT 
  id,
  title,
  max_workers,
  assigned_count,
  (assigned_count - max_workers) as over_assigned_by
FROM public.tasks 
WHERE assigned_count > max_workers;
