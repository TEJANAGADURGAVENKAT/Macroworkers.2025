-- Verify worker bank details and their IDs
-- This will help debug the frontend query issue

-- Step 1: Show all workers with their user_ids
SELECT 
  'WORKERS' as info,
  id,
  user_id,
  full_name,
  email
FROM public.profiles 
WHERE role = 'worker'
ORDER BY full_name;

-- Step 2: Show all bank details with worker information
SELECT 
  'BANK_DETAILS' as info,
  wbd.id,
  wbd.worker_id,
  wbd.bank_name,
  wbd.account_holder_name,
  wbd.account_number,
  wbd.ifsc_code,
  p.full_name as profile_full_name,
  p.user_id as profile_user_id
FROM public.worker_bank_details wbd
JOIN public.profiles p ON wbd.worker_id = p.user_id
ORDER BY p.full_name;

-- Step 3: Check approved task submissions with worker details
SELECT 
  'APPROVED_SUBMISSIONS' as info,
  ts.id,
  ts.worker_id,
  ts.status,
  p.full_name as worker_name,
  p.user_id as worker_user_id,
  t.title as task_title,
  emp.full_name as employer_name,
  emp.user_id as employer_user_id
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
JOIN public.tasks t ON ts.task_id = t.id
JOIN public.profiles emp ON ts.employer_id = emp.user_id
WHERE ts.status = 'approved'
ORDER BY p.full_name, ts.reviewed_at DESC;

-- Step 4: Cross-reference to find the issue
SELECT 
  'CROSS_REFERENCE' as info,
  ts.worker_id as submission_worker_id,
  p.full_name as worker_name,
  p.user_id as profile_user_id,
  wbd.worker_id as bank_worker_id,
  CASE 
    WHEN wbd.worker_id IS NOT NULL THEN 'HAS_BANK_DETAILS'
    ELSE 'NO_BANK_DETAILS'
  END as bank_status,
  wbd.account_holder_name,
  wbd.account_number
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
LEFT JOIN public.worker_bank_details wbd ON ts.worker_id = wbd.worker_id
WHERE ts.status = 'approved'
ORDER BY p.full_name;
