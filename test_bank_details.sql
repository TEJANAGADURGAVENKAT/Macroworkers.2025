-- Test script to insert sample bank details for testing
-- Run this AFTER running the main create_payment_bank_details_tables.sql script

-- First, let's see what workers exist
SELECT id, user_id, full_name, role FROM public.profiles WHERE role = 'worker' LIMIT 5;

-- Insert sample bank details for the first worker (if any exist)
INSERT INTO public.worker_bank_details (
  worker_id,
  bank_name,
  account_holder_name,
  account_number,
  ifsc_code,
  branch_name,
  upi_id
) VALUES (
  (SELECT user_id FROM public.profiles WHERE role = 'worker' LIMIT 1),
  'State Bank of India',
  'Test Worker',
  '12345678901234',
  'SBIN0001234',
  'Main Branch, Delhi',
  'testworker@paytm'
) ON CONFLICT (worker_id) DO UPDATE SET
  bank_name = EXCLUDED.bank_name,
  account_holder_name = EXCLUDED.account_holder_name,
  account_number = EXCLUDED.account_number,
  ifsc_code = EXCLUDED.ifsc_code,
  branch_name = EXCLUDED.branch_name,
  upi_id = EXCLUDED.upi_id;

-- Check if the bank details were inserted
SELECT 
  wbd.*,
  p.full_name,
  p.email
FROM public.worker_bank_details wbd
JOIN public.profiles p ON wbd.worker_id = p.user_id
ORDER BY wbd.created_at DESC;
