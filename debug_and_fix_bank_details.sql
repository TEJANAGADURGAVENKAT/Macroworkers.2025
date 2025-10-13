-- Debug and fix bank details issue
-- This script will help identify and fix the missing bank details

-- Step 1: Check what workers exist and their IDs
SELECT 
  'WORKERS' as info,
  id,
  user_id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE role = 'worker'
ORDER BY full_name;

-- Step 2: Check what bank details exist
SELECT 
  'BANK_DETAILS' as info,
  id,
  worker_id,
  bank_name,
  account_holder_name,
  account_number,
  ifsc_code,
  created_at
FROM public.worker_bank_details
ORDER BY created_at DESC;

-- Step 3: Check approved task submissions
SELECT 
  'APPROVED_SUBMISSIONS' as info,
  ts.id,
  ts.worker_id,
  ts.status,
  ts.reviewed_at,
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
ORDER BY ts.reviewed_at DESC;

-- Step 4: Insert bank details for workers who don't have them
-- First, let's see which workers need bank details
WITH workers_without_bank_details AS (
  SELECT DISTINCT 
    ts.worker_id,
    p.full_name,
    p.user_id
  FROM public.task_submissions ts
  JOIN public.profiles p ON ts.worker_id = p.user_id
  WHERE ts.status = 'approved'
    AND ts.worker_id NOT IN (SELECT worker_id FROM public.worker_bank_details)
)
INSERT INTO public.worker_bank_details (
  worker_id,
  bank_name,
  account_holder_name,
  account_number,
  ifsc_code,
  branch_name,
  upi_id,
  is_verified,
  is_active
)
SELECT 
  w.user_id as worker_id,
  'State Bank of India' as bank_name,
  w.full_name as account_holder_name,
  '12345678901234' as account_number,
  'SBIN0001234' as ifsc_code,
  'Main Branch' as branch_name,
  NULL as upi_id,
  false as is_verified,
  true as is_active
FROM workers_without_bank_details w;

-- Step 5: Verify the bank details were inserted
SELECT 
  'VERIFICATION' as info,
  wbd.id,
  wbd.worker_id,
  wbd.bank_name,
  wbd.account_holder_name,
  wbd.account_number,
  p.full_name,
  p.email
FROM public.worker_bank_details wbd
JOIN public.profiles p ON wbd.worker_id = p.user_id
ORDER BY wbd.created_at DESC;
