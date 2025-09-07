-- Direct fix for worker profiles - populate with real registration data
-- This will ensure all workers show their real names, emails, and phone numbers

BEGIN;

-- First, ensure the email and phone columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Delete any existing profiles that have generated names (like "Worker 793f843c")
DELETE FROM public.profiles 
WHERE full_name LIKE 'Worker %' 
   OR full_name IS NULL 
   OR full_name = '';

-- Create fresh profiles for ALL users in auth.users
INSERT INTO public.profiles (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'Worker ' || SUBSTRING(au.id::text, 1, 8)
  ) as full_name,
  au.email,
  au.raw_user_meta_data->>'phone' as phone,
  COALESCE(au.raw_user_meta_data->>'role', 'worker') as role,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL;

-- Update ALL existing profiles with real data from auth.users
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'Worker ' || SUBSTRING(profiles.user_id::text, 1, 8)
  ),
  email = au.email,
  phone = au.raw_user_meta_data->>'phone',
  role = COALESCE(profiles.role, au.raw_user_meta_data->>'role', 'worker'),
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id;

-- Ensure all workers who have submitted tasks have complete profiles
INSERT INTO public.profiles (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT DISTINCT 
  ts.worker_id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'Worker ' || SUBSTRING(ts.worker_id::text, 1, 8)
  ) as full_name,
  au.email,
  au.raw_user_meta_data->>'phone' as phone,
  'worker' as role,
  NOW(),
  NOW()
FROM public.task_submissions ts
LEFT JOIN public.profiles p ON ts.worker_id = p.user_id
LEFT JOIN auth.users au ON ts.worker_id = au.id
WHERE p.id IS NULL;

-- Final update to ensure all profiles have real data
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'Worker ' || SUBSTRING(profiles.user_id::text, 1, 8)
  ),
  email = COALESCE(profiles.email, au.email),
  phone = COALESCE(profiles.phone, au.raw_user_meta_data->>'phone'),
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id
  AND (profiles.full_name LIKE 'Worker %' OR profiles.full_name IS NULL OR profiles.full_name = '');

COMMIT;


