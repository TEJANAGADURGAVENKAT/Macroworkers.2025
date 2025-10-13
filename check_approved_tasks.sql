-- Check which workers have approved tasks
-- This will help identify why the frontend query is not finding bank details

-- Step 1: Show all approved task submissions with worker details
SELECT 
  'APPROVED_TASKS' as info,
  ts.id as submission_id,
  ts.worker_id,
  ts.status,
  ts.reviewed_at,
  p.full_name as worker_name,
  p.user_id as worker_user_id,
  t.title as task_title,
  t.budget,
  emp.full_name as employer_name,
  emp.user_id as employer_user_id
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
JOIN public.tasks t ON ts.task_id = t.id
JOIN public.profiles emp ON ts.employer_id = emp.user_id
WHERE ts.status = 'approved'
ORDER BY ts.reviewed_at DESC;

-- Step 2: Check which workers with bank details have approved tasks
SELECT 
  'WORKERS_WITH_BANK_DETAILS_AND_APPROVED_TASKS' as info,
  p.full_name as worker_name,
  p.user_id as worker_user_id,
  wbd.account_number,
  wbd.bank_name,
  COUNT(ts.id) as approved_tasks_count,
  SUM(CAST(t.budget AS NUMERIC)) as total_amount
FROM public.profiles p
JOIN public.worker_bank_details wbd ON p.user_id = wbd.worker_id
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id AND ts.status = 'approved'
LEFT JOIN public.tasks t ON ts.task_id = t.id
WHERE p.role = 'worker'
GROUP BY p.full_name, p.user_id, wbd.account_number, wbd.bank_name
ORDER BY approved_tasks_count DESC, p.full_name;

-- Step 3: Check if there are any approved tasks at all
SELECT 
  'TOTAL_APPROVED_TASKS' as info,
  COUNT(*) as total_approved_submissions,
  COUNT(DISTINCT ts.worker_id) as unique_workers_with_approved_tasks,
  COUNT(DISTINCT ts.employer_id) as unique_employers_with_approved_tasks
FROM public.task_submissions ts
WHERE ts.status = 'approved';

-- Step 4: Show all task submission statuses
SELECT 
  'ALL_TASK_SUBMISSIONS' as info,
  status,
  COUNT(*) as count
FROM public.task_submissions
GROUP BY status
ORDER BY count DESC;
