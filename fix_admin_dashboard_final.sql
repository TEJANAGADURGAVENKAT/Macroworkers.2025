-- Final Fix for Admin Dashboard Counts
-- This script will ensure the dashboard shows correct worker and employer counts

-- 1. First, let's see what we have
SELECT '=== CURRENT STATE ===' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 2. Show current roles
SELECT '=== CURRENT ROLES ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 3. Show all profiles
SELECT '=== ALL PROFILES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- 4. Fix the role constraint issue first
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 5. Ensure all profiles have a role (set to 'worker' if missing)
UPDATE public.profiles 
SET role = 'worker' 
WHERE role IS NULL OR role = '';

-- 6. Fix any 'employee' roles to 'employer'
UPDATE public.profiles 
SET role = 'employer' 
WHERE role = 'employee';

-- 7. Set any other invalid roles to 'worker'
UPDATE public.profiles 
SET role = 'worker' 
WHERE role NOT IN ('worker', 'employer', 'admin');

-- 8. Add the correct constraint back
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('worker', 'employer', 'admin'));

-- 9. Set default value for role column
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'worker';

-- 10. Make role column NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN role SET NOT NULL;

-- 11. Ensure all auth users have profiles
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

-- 12. Update roles based on user activity
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

-- 13. Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

SELECT 'Total Profiles:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

SELECT 'Role Distribution:' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

SELECT 'Workers Count:' as info;
SELECT COUNT(*) as workers_count FROM public.profiles WHERE role = 'worker';

SELECT 'Employers Count:' as info;
SELECT COUNT(*) as employers_count FROM public.profiles WHERE role = 'employer';

SELECT 'Admins Count:' as info;
SELECT COUNT(*) as admins_count FROM public.profiles WHERE role = 'admin';

-- 14. Show final profiles
SELECT '=== FINAL PROFILES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;
