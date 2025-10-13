-- Debug the existing payment record to see why admin overview isn't showing it

-- Step 1: Show the existing payment record
SELECT 
  'EXISTING_PAYMENT_RECORD' as info,
  id,
  task_id,
  worker_id,
  employer_id,
  amount,
  payment_status,
  payment_method,
  payment_initiated_at,
  payment_completed_at,
  created_at
FROM public.task_payment_records
ORDER BY created_at DESC;

-- Step 2: Check if the related records exist
SELECT 
  'RELATED_TASK' as info,
  t.id,
  t.title,
  t.budget,
  t.created_by
FROM public.task_payment_records tpr
JOIN public.tasks t ON tpr.task_id = t.id;

-- Step 3: Check worker profile
SELECT 
  'RELATED_WORKER' as info,
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  p.role
FROM public.task_payment_records tpr
JOIN public.profiles p ON tpr.worker_id = p.user_id;

-- Step 4: Check employer profile
SELECT 
  'RELATED_EMPLOYER' as info,
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  p.role
FROM public.task_payment_records tpr
JOIN public.profiles p ON tpr.employer_id = p.user_id;

-- Step 5: Check worker bank details
SELECT 
  'RELATED_BANK_DETAILS' as info,
  wbd.id,
  wbd.worker_id,
  wbd.bank_name,
  wbd.account_holder_name,
  wbd.account_number,
  wbd.ifsc_code
FROM public.task_payment_records tpr
LEFT JOIN public.worker_bank_details wbd ON tpr.worker_id = wbd.worker_id;

-- Step 6: Test the exact query that admin overview uses
SELECT 
  'ADMIN_QUERY_TEST' as info,
  tpr.id,
  tpr.task_id,
  tpr.worker_id,
  tpr.employer_id,
  tpr.amount,
  tpr.payment_status,
  t.title as task_title,
  wp.full_name as worker_name,
  wp.email as worker_email,
  ep.full_name as employer_name,
  ep.email as employer_email,
  wbd.bank_name,
  wbd.account_holder_name,
  wbd.account_number
FROM public.task_payment_records tpr
LEFT JOIN public.tasks t ON tpr.task_id = t.id
LEFT JOIN public.profiles wp ON tpr.worker_id = wp.user_id
LEFT JOIN public.profiles ep ON tpr.employer_id = ep.user_id
LEFT JOIN public.worker_bank_details wbd ON tpr.worker_id = wbd.worker_id;
