-- Fix missing worker profiles
-- This will create profiles for users who exist in auth.users but not in profiles table

BEGIN;

-- Create profiles for users who exist in auth.users but not in profiles
INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'Worker ' || SUBSTRING(au.id::text, 1, 8)
  ) as full_name,
  COALESCE(
    au.raw_user_meta_data->>'role',
    'worker'
  ) as role,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL;

-- Update existing profiles to ensure they have proper role assignments
UPDATE public.profiles 
SET role = 'worker' 
WHERE role IS NULL OR role = '';

-- Ensure all users who have submitted tasks have profiles
INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
SELECT DISTINCT
  ts.worker_id,
  'Worker ' || SUBSTRING(ts.worker_id::text, 1, 8),
  'worker',
  NOW(),
  NOW()
FROM public.task_submissions ts
LEFT JOIN public.profiles p ON ts.worker_id = p.user_id
WHERE p.id IS NULL;

COMMIT;
