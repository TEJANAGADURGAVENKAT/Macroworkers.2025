-- Fix the SEO Specialist Task assignment
-- This will create the assignment record so it shows in the employer dashboard

BEGIN;

-- 1. First check current state
SELECT 
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count,
  t.created_by
FROM public.tasks t
WHERE t.title = 'SEO Specialist Task';

-- 2. Check if there are any task_submissions with assigned status
SELECT 
  ts.id,
  ts.task_id,
  ts.worker_id,
  ts.status,
  p.full_name,
  p.email
FROM public.task_submissions ts
JOIN public.tasks t ON t.id = ts.task_id
LEFT JOIN public.profiles p ON p.user_id = ts.worker_id
WHERE t.title = 'SEO Specialist Task' AND ts.status = 'assigned';

-- 3. Migrate the assignment to task_assignments table
INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
SELECT 
  ts.task_id,
  ts.worker_id,
  'assigned',
  ts.submitted_at
FROM public.task_submissions ts
JOIN public.tasks t ON t.id = ts.task_id
WHERE t.title = 'SEO Specialist Task' AND ts.status = 'assigned'
ON CONFLICT (task_id, worker_id) DO NOTHING;

-- 4. Update the task's assigned_count and max_workers
UPDATE public.tasks 
SET 
  max_workers = COALESCE(max_workers, 5),
  assigned_count = (
    SELECT COUNT(*) 
    FROM public.task_assignments 
    WHERE task_id = tasks.id
  )
WHERE title = 'SEO Specialist Task';

-- 5. Verify the fix worked
SELECT 
  t.title,
  t.max_workers,
  t.assigned_count,
  ta.id as assignment_id,
  ta.worker_id,
  ta.status,
  ta.assigned_at,
  p.full_name,
  p.email,
  p.rating
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON ta.task_id = t.id
LEFT JOIN public.profiles p ON p.user_id = ta.worker_id
WHERE t.title = 'SEO Specialist Task';

COMMIT;
