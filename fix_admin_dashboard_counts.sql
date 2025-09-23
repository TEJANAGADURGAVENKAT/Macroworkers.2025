-- Fix Admin Dashboard Counts
-- This script addresses common issues that cause the dashboard to show 0 counts

-- 1. First, let's see what roles currently exist
SELECT '=== CURRENT ROLES ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role;

-- 2. Check for any invalid roles
SELECT '=== INVALID ROLES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE role NOT IN ('worker', 'employer') OR role IS NULL;

-- 3. Fix any profiles with NULL or empty roles
UPDATE public.profiles 
SET role = 'worker' 
WHERE role IS NULL OR role = '';

-- 4. Fix any profiles with invalid roles (like 'employee' instead of 'employer')
UPDATE public.profiles 
SET role = 'employer' 
WHERE role = 'employee';

-- 5. Fix any other invalid roles to 'worker' as default
UPDATE public.profiles 
SET role = 'worker' 
WHERE role NOT IN ('worker', 'employer');

-- 6. Now we can safely add the constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('worker', 'employer'));

-- 7. Ensure all users have profiles
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

-- 8. Update roles based on user activity
-- Users who created tasks are employers
UPDATE public.profiles 
SET role = 'employer' 
WHERE user_id IN (
  SELECT DISTINCT created_by 
  FROM public.tasks 
  WHERE created_by IS NOT NULL
);

-- Users who submitted tasks are workers (but don't override employers)
UPDATE public.profiles 
SET role = 'worker' 
WHERE user_id IN (
  SELECT DISTINCT worker_id 
  FROM public.task_submissions 
  WHERE worker_id IS NOT NULL
) AND role != 'employer';

-- 9. Verify the counts
SELECT '=== VERIFICATION ===' as info;

SELECT 'Workers Count:' as info;
SELECT COUNT(*) as workers_count FROM public.profiles WHERE role = 'worker';

SELECT 'Employers Count:' as info;
SELECT COUNT(*) as employers_count FROM public.profiles WHERE role = 'employer';

SELECT 'Total Profiles:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

SELECT 'All Profiles with Roles:' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;
