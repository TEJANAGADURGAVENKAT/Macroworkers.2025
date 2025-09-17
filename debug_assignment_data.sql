-- Debug assignment data to see what's in the database

-- 1. Check task_assignments table
SELECT 
  ta.id,
  ta.task_id,
  ta.worker_id,
  ta.status,
  ta.assigned_at,
  t.title as task_title,
  p.full_name as worker_name,
  p.email as worker_email
FROM public.task_assignments ta
JOIN public.tasks t ON t.id = ta.task_id
LEFT JOIN public.profiles p ON p.user_id = ta.worker_id
ORDER BY ta.assigned_at DESC;

-- 2. Check task_submissions with assigned status
SELECT 
  ts.id,
  ts.task_id,
  ts.worker_id,
  ts.status,
  ts.submitted_at,
  t.title as task_title,
  p.full_name as worker_name
FROM public.task_submissions ts
JOIN public.tasks t ON t.id = ts.task_id
LEFT JOIN public.profiles p ON p.user_id = ts.worker_id
WHERE ts.status = 'assigned'
ORDER BY ts.submitted_at DESC;

-- 3. Check tasks with assigned counts
SELECT 
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count,
  t.created_by
FROM public.tasks t
WHERE t.assigned_count > 0 OR t.max_workers IS NOT NULL
ORDER BY t.created_at DESC;

-- 4. Check specific task (SEO Specialist Task)
SELECT 
  t.*,
  (SELECT COUNT(*) FROM public.task_assignments WHERE task_id = t.id) as actual_assignments
FROM public.tasks t
WHERE t.title LIKE '%SEO%'
LIMIT 1;
