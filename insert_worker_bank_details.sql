-- Insert bank details for the worker shown in the image
-- Worker: "Isukapalli Sai Tulasi" with account number "812678994566"

-- First, find the worker by name
SELECT id, user_id, full_name, email FROM public.profiles 
WHERE full_name ILIKE '%Isukapalli%' OR full_name ILIKE '%Sai Tulasi%';

-- Insert bank details for this worker
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
  -- Replace with actual worker_id from the query above
  (SELECT user_id FROM public.profiles WHERE full_name ILIKE '%Isukapalli%' LIMIT 1),
  'State Bank of India',
  'Isukapalli Sai Tulasi',
  '812678994566',
  'SBIN0001234',
  'Hyderabad',
  NULL, -- No UPI ID provided
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

-- Verify the bank details were inserted
SELECT 
  wbd.*,
  p.full_name,
  p.email
FROM public.worker_bank_details wbd
JOIN public.profiles p ON wbd.worker_id = p.user_id
WHERE p.full_name ILIKE '%Isukapalli%' OR p.full_name ILIKE '%Sai Tulasi%';
