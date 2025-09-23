-- Check the assignment data to debug why employer dashboard doesn't show worker details

-- 1. Check the specific task "i want more likes"
SELECT 
  t.id as task_id,
  t.title,
  t.created_by as task_creator,
  t.current_assignees,
  t.assignment_start_time,
  t.assignment_end_time,
  t.max_assignees
FROM public.tasks t
WHERE t.title = 'i want more likes';

-- 2. Check task submissions for this task
SELECT 
  ts.id,
  ts.task_id,
  ts.worker_id,
  ts.employer_id,
  ts.status,
  ts.submitted_at,
  p.full_name as worker_name,
  p.rating as worker_rating
FROM public.task_submissions ts
JOIN public.tasks t ON t.id = ts.task_id
LEFT JOIN public.profiles p ON p.user_id = ts.worker_id
WHERE t.title = 'i want more likes';

-- 3. Check if employer_id matches task creator
SELECT 
  t.title,
  t.created_by as task_creator,
  ts.employer_id as submission_employer_id,
  CASE 
    WHEN t.created_by = ts.employer_id THEN 'MATCH' 
    ELSE 'MISMATCH' 
  END as employer_match
FROM public.tasks t
JOIN public.task_submissions ts ON ts.task_id = t.id
WHERE t.title = 'i want more likes';

-- 4. Get the employer's user_id to check dashboard access
SELECT 
  t.title,
  t.created_by as employer_user_id,
  p.full_name as employer_name,
  p.role as employer_role
FROM public.tasks t
LEFT JOIN public.profiles p ON p.user_id = t.created_by
WHERE t.title = 'i want more likes';
