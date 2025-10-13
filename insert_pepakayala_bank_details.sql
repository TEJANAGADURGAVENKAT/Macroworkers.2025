-- Insert bank details for Pepakayala Kalyani (the worker shown in console logs)

-- First, find the worker
SELECT 
  'FINDING_WORKER' as step,
  id,
  user_id,
  full_name,
  email
FROM public.profiles 
WHERE full_name ILIKE '%Pepakayala%' 
   OR full_name ILIKE '%Kalyani%';

-- Insert bank details for Pepakayala Kalyani
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
) VALUES (
  (SELECT user_id FROM public.profiles WHERE full_name ILIKE '%Pepakayala%' LIMIT 1),
  'State Bank of India',
  'Pepakayala Kalyani',
  '98765432101234',
  'SBIN0009876',
  'Hyderabad Main Branch',
  'kalyani@paytm',
  false,
  true
) ON CONFLICT (worker_id) DO UPDATE SET
  bank_name = EXCLUDED.bank_name,
  account_holder_name = EXCLUDED.account_holder_name,
  account_number = EXCLUDED.account_number,
  ifsc_code = EXCLUDED.ifsc_code,
  branch_name = EXCLUDED.branch_name,
  upi_id = EXCLUDED.upi_id,
  updated_at = now();

-- Verify the insertion
SELECT 
  'VERIFICATION' as step,
  wbd.id,
  wbd.worker_id,
  wbd.bank_name,
  wbd.account_holder_name,
  wbd.account_number,
  wbd.ifsc_code,
  wbd.branch_name,
  wbd.upi_id,
  p.full_name,
  p.email
FROM public.worker_bank_details wbd
JOIN public.profiles p ON wbd.worker_id = p.user_id
WHERE p.full_name ILIKE '%Pepakayala%';
