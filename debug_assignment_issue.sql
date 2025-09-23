-- Debug the assignment issue - check what's in task_submissions

-- 1. Check all task_submissions for the "i want more likes" task
SELECT 
  ts.*,
  t.title,
  p.full_name as worker_name
FROM public.task_submissions ts
JOIN public.tasks t ON t.id = ts.task_id
LEFT JOIN public.profiles p ON p.user_id = ts.worker_id
WHERE t.title = 'i want more likes';

-- 2. Check all task_submissions with status 'assigned' 
SELECT 
  ts.*,
  t.title,
  p.full_name as worker_name
FROM public.task_submissions ts
JOIN public.tasks t ON t.id = ts.task_id
LEFT JOIN public.profiles p ON p.user_id = ts.worker_id
WHERE ts.status = 'assigned';

-- 3. Reset current_assignees count to match actual data
UPDATE public.tasks 
SET current_assignees = (
  SELECT COUNT(*) 
  FROM public.task_submissions 
  WHERE task_id = tasks.id AND status = 'assigned'
);

-- 4. Check the updated counts
SELECT 
  t.title,
  t.current_assignees,
  (SELECT COUNT(*) FROM public.task_submissions WHERE task_id = t.id AND status = 'assigned') as actual_assigned_count
FROM public.tasks t
WHERE t.title = 'i want more likes';
