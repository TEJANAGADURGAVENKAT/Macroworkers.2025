-- Migrate existing assignments from task_submissions to task_assignments
-- This will move all 'assigned' status records to the new table

BEGIN;

-- 1. First, let's see what we have in task_submissions with 'assigned' status
SELECT 
  ts.task_id,
  ts.worker_id,
  ts.status,
  ts.submitted_at,
  t.title,
  p.full_name
FROM public.task_submissions ts
JOIN public.tasks t ON t.id = ts.task_id
LEFT JOIN public.profiles p ON p.user_id = ts.worker_id
WHERE ts.status = 'assigned';

-- 2. Migrate assigned records from task_submissions to task_assignments
INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
SELECT 
  task_id,
  worker_id,
  'assigned',
  submitted_at
FROM public.task_submissions
WHERE status = 'assigned'
ON CONFLICT (task_id, worker_id) DO NOTHING;

-- 3. Update tasks.assigned_count based on task_assignments
UPDATE public.tasks 
SET assigned_count = (
  SELECT COUNT(*) 
  FROM public.task_assignments 
  WHERE task_id = tasks.id
);

-- 4. Update tasks.max_workers to have a default value if NULL
UPDATE public.tasks 
SET max_workers = 5 
WHERE max_workers IS NULL;

-- 5. Verify the migration
SELECT 
  t.title,
  t.max_workers,
  t.assigned_count,
  ta.worker_id,
  ta.status,
  ta.assigned_at,
  p.full_name as worker_name,
  p.email
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON ta.task_id = t.id
LEFT JOIN public.profiles p ON p.user_id = ta.worker_id
WHERE t.assigned_count > 0
ORDER BY t.created_at DESC;

COMMIT;
