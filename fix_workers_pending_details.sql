-- Fix workers who are stuck with completed payments but no bank details
-- This script updates payment status to allow workers to add bank details

BEGIN;

-- 1. Find workers who have completed payments but no bank details
-- and update their payment status to 'pending_details'

UPDATE public.task_payment_records 
SET 
  payment_status = 'pending_details',
  updated_at = NOW()
WHERE 
  payment_status = 'completed' 
  AND worker_id IN (
    -- Find workers with completed payments but no bank details
    SELECT DISTINCT tpr.worker_id 
    FROM public.task_payment_records tpr
    LEFT JOIN public.worker_bank_details wbd ON tpr.worker_id = wbd.worker_id
    WHERE tpr.payment_status = 'completed' 
    AND wbd.id IS NULL
  );

-- 2. Also update any payments that might be in 'processing' status
-- for workers without bank details
UPDATE public.task_payment_records 
SET 
  payment_status = 'pending_details',
  updated_at = NOW()
WHERE 
  payment_status = 'processing' 
  AND worker_id IN (
    -- Find workers with processing payments but no bank details
    SELECT DISTINCT tpr.worker_id 
    FROM public.task_payment_records tpr
    LEFT JOIN public.worker_bank_details wbd ON tpr.worker_id = wbd.worker_id
    WHERE tpr.payment_status = 'processing' 
    AND wbd.id IS NULL
  );

-- 3. Show the results
SELECT 
  'Workers with pending_details status (can add bank details):' as info;
  
SELECT 
  p.full_name as worker_name,
  p.email,
  tpr.payment_status,
  tpr.amount,
  tpr.created_at as payment_created,
  CASE 
    WHEN wbd.id IS NOT NULL THEN 'Has Bank Details'
    ELSE 'No Bank Details'
  END as bank_details_status
FROM public.task_payment_records tpr
JOIN public.profiles p ON tpr.worker_id = p.user_id
LEFT JOIN public.worker_bank_details wbd ON tpr.worker_id = wbd.worker_id
WHERE tpr.payment_status = 'pending_details'
ORDER BY tpr.created_at DESC;

COMMIT;


