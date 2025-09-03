-- Debug Admin Dashboard Counts
-- This script will help identify why the dashboard shows 0 for workers and employers

-- 1. Check if profiles table exists and has data
SELECT '=== PROFILES TABLE CHECK ===' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 2. Show all profiles with their roles
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

-- 3. Count by role
SELECT '=== ROLE COUNTS ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 4. Check for specific roles
SELECT '=== WORKERS COUNT ===' as info;
SELECT COUNT(*) as workers_count 
FROM public.profiles 
WHERE role = 'worker';

SELECT '=== EMPLOYERS COUNT ===' as info;
SELECT COUNT(*) as employers_count 
FROM public.profiles 
WHERE role = 'employer';

SELECT '=== ADMINS COUNT ===' as info;
SELECT COUNT(*) as admins_count 
FROM public.profiles 
WHERE role = 'admin';

-- 5. Check for any NULL or empty roles
SELECT '=== NULL/EMPTY ROLES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
WHERE role IS NULL OR role = '';

-- 6. Check auth users vs profiles
SELECT '=== AUTH USERS VS PROFILES ===' as info;
SELECT 
  'Auth Users' as type,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Profiles' as type,
  COUNT(*) as count
FROM public.profiles;

-- 7. Test the exact queries the dashboard uses
SELECT '=== DASHBOARD QUERY TEST ===' as info;

-- Test workers query
SELECT 'Workers Query Result:' as test;
SELECT COUNT(*) as workers_count 
FROM public.profiles 
WHERE role = 'worker';

-- Test employers query  
SELECT 'Employers Query Result:' as test;
SELECT COUNT(*) as employers_count 
FROM public.profiles 
WHERE role = 'employer';

-- Test tasks query
SELECT 'Tasks Query Result:' as test;
SELECT COUNT(*) as tasks_count 
FROM public.tasks;

-- Test submissions query
SELECT 'Submissions Query Result:' as test;
SELECT COUNT(*) as submissions_count 
FROM public.task_submissions;
