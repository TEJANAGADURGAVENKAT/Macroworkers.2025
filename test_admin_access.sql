-- Test admin access to payment data
-- This will verify if the admin can access all the data needed for the overview

-- Step 1: Test basic access to task_payment_records
SELECT 
  'BASIC_ACCESS_TEST' as info,
  COUNT(*) as total_records,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_count,
  SUM(amount) as total_amount
FROM public.task_payment_records;

-- Step 2: Test the exact query structure that admin overview uses
SELECT 
  'ADMIN_QUERY_STRUCTURE_TEST' as info,
  tpr.id,
  tpr.amount,
  tpr.payment_status,
  t.title,
  wp.full_name as worker_name,
  ep.full_name as employer_name,
  wbd.bank_name,
  wbd.account_number
FROM public.task_payment_records tpr
LEFT JOIN public.tasks t ON tpr.task_id = t.id
LEFT JOIN public.profiles wp ON tpr.worker_id = wp.user_id
LEFT JOIN public.profiles ep ON tpr.employer_id = ep.user_id
LEFT JOIN public.worker_bank_details wbd ON tpr.worker_id = wbd.worker_id;

-- Step 3: Test permissions for different roles
-- This should work if permissions are correct
SELECT 
  'PERMISSION_TEST' as info,
  'admin_can_select' as test_type,
  COUNT(*) as accessible_records
FROM public.task_payment_records;
