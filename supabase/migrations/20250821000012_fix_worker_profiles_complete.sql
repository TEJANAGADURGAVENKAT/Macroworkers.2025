-- Comprehensive fix for worker profiles
-- This ensures all workers have their real registration data displayed

BEGIN;

-- First, ensure the email and phone columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create profiles for ALL users in auth.users who don't have profiles
INSERT INTO public.profiles (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'Worker ' || SUBSTRING(au.id::text, 1, 8)
  ) as full_name,
  au.email,
  au.raw_user_meta_data->>'phone' as phone,
  COALESCE(au.raw_user_meta_data->>'role', 'worker') as role,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL;

-- Update existing profiles with missing data from auth.users
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    profiles.full_name,
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'Worker ' || SUBSTRING(profiles.user_id::text, 1, 8)
  ),
  email = COALESCE(profiles.email, au.email),
  phone = COALESCE(profiles.phone, au.raw_user_meta_data->>'phone'),
  role = COALESCE(profiles.role, au.raw_user_meta_data->>'role', 'worker'),
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id;

-- Ensure all workers who have submitted tasks have profiles
INSERT INTO public.profiles (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT DISTINCT 
  ts.worker_id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
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

-- Update profiles for workers who have submitted tasks but have incomplete data
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    profiles.full_name,
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'Worker ' || SUBSTRING(profiles.user_id::text, 1, 8)
  ),
  email = COALESCE(profiles.email, au.email),
  phone = COALESCE(profiles.phone, au.raw_user_meta_data->>'phone'),
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id
  AND (profiles.full_name IS NULL OR profiles.full_name = '' OR profiles.email IS NULL OR profiles.phone IS NULL);

COMMIT;


