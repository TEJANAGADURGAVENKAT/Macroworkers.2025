-- Test the complete assignment system
-- Run this to see the full workflow

BEGIN;

-- 1. Migrate existing assignments from task_submissions to task_assignments
INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
SELECT 
  ts.task_id,
  ts.worker_id,
  'assigned',
  ts.submitted_at
FROM public.task_submissions ts
WHERE ts.status = 'assigned'
ON CONFLICT (task_id, worker_id) DO NOTHING;

-- 2. Update all tasks with proper max_workers and assigned_count
UPDATE public.tasks 
SET 
  max_workers = CASE 
    WHEN max_workers IS NULL THEN 5 
    ELSE max_workers 
  END,
  assigned_count = (
    SELECT COUNT(*) 
    FROM public.task_assignments 
    WHERE task_id = tasks.id
  );

-- 3. Verify the complete system
SELECT 
  'TASK OVERVIEW' as section,
  t.title,
  t.max_workers,
  t.assigned_count,
  CASE 
    WHEN t.assigned_count >= t.max_workers THEN 'FULL'
    ELSE 'AVAILABLE'
  END as availability_status
FROM public.tasks t
ORDER BY t.created_at DESC
LIMIT 5;

-- 4. Show assigned worker details
SELECT 
  'WORKER ASSIGNMENTS' as section,
  t.title as task_title,
  ta.worker_id,
  ta.status,
  ta.assigned_at,
  p.full_name as worker_name,
  p.email as worker_email,
  p.rating as worker_rating
FROM public.task_assignments ta
JOIN public.tasks t ON t.id = ta.task_id
LEFT JOIN public.profiles p ON p.user_id = ta.worker_id
ORDER BY ta.assigned_at DESC;

COMMIT;
