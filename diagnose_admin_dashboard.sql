-- Diagnose Admin Dashboard Data Issues
-- This script will help identify why the dashboard is showing 0 counts

-- 1. Check all profiles and their roles
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

-- 2. Count workers and employers
SELECT '=== ROLE COUNTS ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role;

-- 3. Check specific worker count
SELECT '=== WORKERS COUNT ===' as info;
SELECT COUNT(*) as workers_count 
FROM public.profiles 
WHERE role = 'worker';

-- 4. Check specific employer count
SELECT '=== EMPLOYERS COUNT ===' as info;
SELECT COUNT(*) as employers_count 
FROM public.profiles 
WHERE role = 'employer';

-- 5. Check tasks count
SELECT '=== TASKS COUNT ===' as info;
SELECT COUNT(*) as tasks_count 
FROM public.tasks;

-- 6. Check submissions count
SELECT '=== SUBMISSIONS COUNT ===' as info;
SELECT COUNT(*) as submissions_count 
FROM public.task_submissions;

-- 7. Check if there are any profiles without roles
SELECT '=== PROFILES WITHOUT ROLES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE role IS NULL OR role = '';

-- 8. Check auth users vs profiles
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

-- 9. Check for any constraint issues
SELECT '=== CONSTRAINT CHECK ===' as info;
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('tasks', 'task_submissions', 'profiles')
ORDER BY tc.table_name, kcu.column_name;
