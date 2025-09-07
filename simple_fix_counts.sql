-- Simple Fix for Admin Dashboard Counts
-- This script fixes the data without adding constraints

-- 1. Check current roles (show all existing roles first)
SELECT '=== CURRENT ROLES ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 2. Show all profiles with their current roles
SELECT '=== ALL PROFILES WITH ROLES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- 3. Fix any profiles with NULL or empty roles
UPDATE public.profiles 
SET role = 'worker' 
WHERE role IS NULL OR role = '';

-- 4. Fix any profiles with 'employee' role to 'employer'
UPDATE public.profiles 
SET role = 'employer' 
WHERE role = 'employee';

-- 5. Keep admin role as is, fix any other invalid roles to 'worker' as default
UPDATE public.profiles 
SET role = 'worker' 
WHERE role NOT IN ('worker', 'employer', 'admin');

-- 6. Ensure all users have profiles
INSERT INTO public.profiles (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'User ' || SUBSTRING(au.id::text, 1, 8)
  ) as full_name,
  au.email,
  au.raw_user_meta_data->>'phone' as phone,
  COALESCE(au.raw_user_meta_data->>'role', 'worker') as role,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL;

-- 7. Update roles based on user activity
-- Users who created tasks are employers
UPDATE public.profiles 
SET role = 'employer' 
WHERE user_id IN (
  SELECT DISTINCT created_by 
  FROM public.tasks 
  WHERE created_by IS NOT NULL
) AND role != 'admin';

-- Users who submitted tasks are workers (but don't override employers or admins)
UPDATE public.profiles 
SET role = 'worker' 
WHERE user_id IN (
  SELECT DISTINCT worker_id 
  FROM public.task_submissions 
  WHERE worker_id IS NOT NULL
) AND role NOT IN ('employer', 'admin');

-- 8. Verify the counts
SELECT '=== VERIFICATION ===' as info;

SELECT 'Workers Count:' as info;
SELECT COUNT(*) as workers_count FROM public.profiles WHERE role = 'worker';

SELECT 'Employers Count:' as info;
SELECT COUNT(*) as employers_count FROM public.profiles WHERE role = 'employer';

SELECT 'Admin Count:' as info;
SELECT COUNT(*) as admin_count FROM public.profiles WHERE role = 'admin';

SELECT 'Total Profiles:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

SELECT 'Final Role Distribution:' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;
