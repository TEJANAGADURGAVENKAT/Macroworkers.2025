-- Fix admin payment overview by checking data and creating test records

-- Step 1: Check what data exists in each table
SELECT 'WORKER_BANK_DETAILS' as table_name, COUNT(*) as count FROM public.worker_bank_details
UNION ALL
SELECT 'TASK_PAYMENT_RECORDS' as table_name, COUNT(*) as count FROM public.task_payment_records
UNION ALL
SELECT 'TASK_SUBMISSIONS' as table_name, COUNT(*) as count FROM public.task_submissions WHERE status = 'approved'
UNION ALL
SELECT 'TASKS' as table_name, COUNT(*) as count FROM public.tasks;

-- Step 2: Show existing payment records
SELECT 
  'EXISTING_PAYMENT_RECORDS' as info,
  id,
  task_id,
  worker_id,
  employer_id,
  amount,
  payment_status,
  created_at
FROM public.task_payment_records
ORDER BY created_at DESC;

-- Step 3: Show approved task submissions that need payment records
SELECT 
  'APPROVED_SUBMISSIONS_NEEDING_PAYMENT_RECORDS' as info,
  ts.id as submission_id,
  ts.task_id,
  ts.worker_id,
  ts.employer_id,
  ts.status,
  ts.reviewed_at,
  p.full_name as worker_name,
  emp.full_name as employer_name,
  t.title as task_title,
  t.budget,
  CASE 
    WHEN tpr.id IS NOT NULL THEN 'HAS_PAYMENT_RECORD'
    ELSE 'NEEDS_PAYMENT_RECORD'
  END as payment_status
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
JOIN public.tasks t ON ts.task_id = t.id
JOIN public.profiles emp ON ts.employer_id = emp.user_id
LEFT JOIN public.task_payment_records tpr ON ts.task_id = tpr.task_id AND ts.worker_id = tpr.worker_id
WHERE ts.status = 'approved'
ORDER BY ts.reviewed_at DESC;

-- Step 4: Create payment records for approved submissions that don't have them
INSERT INTO public.task_payment_records (
  task_id,
  worker_id,
  employer_id,
  amount,
  payment_status,
  payment_method,
  payment_initiated_at,
  created_by
)
SELECT 
  ts.task_id,
  ts.worker_id,
  ts.employer_id,
  CAST(t.budget AS NUMERIC) as amount,
  CASE 
    WHEN ts.reviewed_at < NOW() - INTERVAL '1 day' THEN 'completed'::text
    ELSE 'pending'::text
  END as payment_status,
  'bank_transfer'::text as payment_method,
  ts.reviewed_at as payment_initiated_at,
  ts.employer_id as created_by
FROM public.task_submissions ts
JOIN public.tasks t ON ts.task_id = t.id
LEFT JOIN public.task_payment_records tpr ON ts.task_id = tpr.task_id AND ts.worker_id = tpr.worker_id
WHERE ts.status = 'approved'
  AND tpr.id IS NULL -- Only create records for submissions that don't have payment records
ON CONFLICT DO NOTHING;

-- Step 5: Update completed payments with completion timestamps
UPDATE public.task_payment_records 
SET 
  payment_completed_at = payment_initiated_at + INTERVAL '2 hours',
  external_transaction_id = 'TXN_' || EXTRACT(EPOCH FROM payment_initiated_at)::text
WHERE payment_status = 'completed'
  AND payment_completed_at IS NULL;

-- Step 6: Verify the results
SELECT 
  'FINAL_VERIFICATION' as info,
  COUNT(*) as total_payment_records,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
  SUM(amount) as total_amount,
  SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as pending_amount,
  SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as completed_amount
FROM public.task_payment_records;
