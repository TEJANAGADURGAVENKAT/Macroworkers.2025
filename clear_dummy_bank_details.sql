-- Clear dummy bank details for workers who haven't entered real details
-- This will allow them to enter their real bank details through the form

-- Step 1: Show current bank details to identify dummy vs real data
SELECT 
  'CURRENT_BANK_DETAILS' as info,
  p.full_name,
  p.user_id,
  wbd.account_number,
  wbd.bank_name,
  wbd.account_holder_name,
  CASE 
    WHEN wbd.account_number = '812678994566' THEN 'REAL_DATA'
    WHEN wbd.account_number LIKE '1234567890%' THEN 'DUMMY_DATA'
    ELSE 'UNKNOWN'
  END as data_type
FROM public.profiles p
JOIN public.worker_bank_details wbd ON p.user_id = wbd.worker_id
WHERE p.role = 'worker'
ORDER BY p.full_name;

-- Step 2: Delete dummy bank details (keep only real data)
DELETE FROM public.worker_bank_details 
WHERE account_number LIKE '1234567890%'
  AND account_number != '812678994566'; -- Keep Kalyani's real data

-- Step 3: Verify the cleanup
SELECT 
  'AFTER_CLEANUP' as info,
  p.full_name,
  p.user_id,
  wbd.account_number,
  wbd.bank_name,
  CASE 
    WHEN wbd.account_number = '812678994566' THEN 'REAL_DATA'
    ELSE 'OTHER_DATA'
  END as data_type
FROM public.profiles p
JOIN public.worker_bank_details wbd ON p.user_id = wbd.worker_id
WHERE p.role = 'worker'
ORDER BY p.full_name;

-- Step 4: Show workers who can now add their bank details
SELECT 
  'WORKERS_CAN_ADD_BANK_DETAILS' as info,
  p.full_name,
  p.user_id,
  COUNT(ts.id) as approved_tasks,
  SUM(CAST(t.budget AS NUMERIC)) as total_amount
FROM public.profiles p
LEFT JOIN public.worker_bank_details wbd ON p.user_id = wbd.worker_id
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id AND ts.status = 'approved'
LEFT JOIN public.tasks t ON ts.task_id = t.id
WHERE p.role = 'worker'
  AND wbd.worker_id IS NULL -- No bank details yet
  AND ts.id IS NOT NULL -- Has approved tasks
GROUP BY p.full_name, p.user_id
ORDER BY total_amount DESC;
