-- Test script to verify bank details can be fetched correctly

-- 1. Check all workers with bank details
SELECT 
  p.id as profile_id,
  p.user_id,
  p.full_name,
  p.email,
  wbd.bank_name,
  wbd.account_holder_name,
  wbd.account_number,
  wbd.ifsc_code,
  wbd.branch_name,
  wbd.upi_id,
  wbd.is_verified,
  wbd.created_at
FROM public.profiles p
LEFT JOIN public.worker_bank_details wbd ON p.user_id = wbd.worker_id
WHERE p.role = 'worker'
ORDER BY wbd.created_at DESC;

-- 2. Check if there are any approved task submissions
SELECT 
  ts.id,
  ts.task_id,
  ts.worker_id,
  ts.status,
  ts.reviewed_at,
  p.full_name as worker_name,
  t.title as task_title,
  t.budget,
  emp.full_name as employer_name
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
JOIN public.tasks t ON ts.task_id = t.id
JOIN public.profiles emp ON ts.employer_id = emp.user_id
WHERE ts.status = 'approved'
ORDER BY ts.reviewed_at DESC;

-- 3. Check payment records
SELECT 
  tpr.*,
  p.full_name as worker_name,
  emp.full_name as employer_name,
  t.title as task_title
FROM public.task_payment_records tpr
LEFT JOIN public.profiles p ON tpr.worker_id = p.user_id
LEFT JOIN public.profiles emp ON tpr.employer_id = emp.user_id
LEFT JOIN public.tasks t ON tpr.task_id = t.id
ORDER BY tpr.created_at DESC;
