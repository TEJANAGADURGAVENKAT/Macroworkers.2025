-- Fix assignment display by migrating data from task_submissions to task_assignments
-- This will make the worker details appear in employer dashboard

BEGIN;

-- 1. First, let's see what's currently in task_submissions with 'assigned' status
SELECT 
  ts.id,
  ts.task_id,
  ts.worker_id,
  ts.status,
  ts.submitted_at,
  t.title,
  p.full_name,
  p.email
FROM public.task_submissions ts
JOIN public.tasks t ON t.id = ts.task_id
LEFT JOIN public.profiles p ON p.user_id = ts.worker_id
WHERE ts.status = 'assigned'
ORDER BY ts.submitted_at DESC;

-- 2. Migrate all 'assigned' records from task_submissions to task_assignments
INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
SELECT 
  ts.task_id,
  ts.worker_id,
  'assigned',
  ts.submitted_at
FROM public.task_submissions ts
WHERE ts.status = 'assigned'
ON CONFLICT (task_id, worker_id) DO NOTHING;

-- 3. Update all tasks to have proper max_workers and assigned_count
UPDATE public.tasks 
SET 
  max_workers = COALESCE(max_workers, 5),
  assigned_count = (
    SELECT COUNT(*) 
    FROM public.task_assignments 
    WHERE task_id = tasks.id
  );

-- 4. Specifically fix the SEO Specialist Task
UPDATE public.tasks 
SET 
  max_workers = 5,
  assigned_count = (
    SELECT COUNT(*) 
    FROM public.task_assignments 
    WHERE task_id = tasks.id
  )
WHERE title = 'SEO Specialist Task';

-- 5. Verify the migration worked
SELECT 
  'FINAL RESULT' as check_type,
  t.title,
  t.max_workers,
  t.assigned_count,
  ta.id as assignment_id,
  ta.worker_id,
  ta.status,
  ta.assigned_at,
  p.full_name as worker_name,
  p.email as worker_email,
  p.rating as worker_rating
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON ta.task_id = t.id
LEFT JOIN public.profiles p ON p.user_id = ta.worker_id
WHERE t.title = 'SEO Specialist Task'
OR t.assigned_count > 0
ORDER BY t.created_at DESC;

COMMIT;
