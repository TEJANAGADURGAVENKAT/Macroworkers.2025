-- Fix missing worker profiles for users who have submitted tasks
-- This ensures that all workers who submit tasks have proper profiles

BEGIN;

-- Create profiles for workers who exist in auth.users but not in profiles
INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'Worker ' || SUBSTRING(au.id::text, 1, 8)
  ) as full_name,
  'worker' as role,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL;

-- Create profiles for workers who have submitted tasks but don't have profiles
INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
SELECT DISTINCT 
  ts.worker_id,
  'Worker ' || SUBSTRING(ts.worker_id::text, 1, 8) as full_name,
  'worker' as role,
  NOW(),
  NOW()
FROM public.task_submissions ts
LEFT JOIN public.profiles p ON ts.worker_id = p.user_id
WHERE p.id IS NULL;

-- Update existing worker profiles to ensure they have proper names
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    full_name,
    'Worker ' || SUBSTRING(user_id::text, 1, 8)
  ),
  role = COALESCE(role, 'worker'),
  updated_at = NOW()
WHERE role = 'worker' AND (full_name IS NULL OR full_name = '');

COMMIT;

