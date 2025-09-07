-- Test Dashboard Queries
-- This script tests the exact queries that the Admin Dashboard uses

-- Test 1: Basic profiles count
SELECT '=== TEST 1: BASIC PROFILES COUNT ===' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Test 2: Workers count (exact query from dashboard)
SELECT '=== TEST 2: WORKERS COUNT ===' as info;
SELECT COUNT(*) as workers_count 
FROM public.profiles 
WHERE role = 'worker';

-- Test 3: Employers count (exact query from dashboard)
SELECT '=== TEST 3: EMPLOYERS COUNT ===' as info;
SELECT COUNT(*) as employers_count 
FROM public.profiles 
WHERE role = 'employer';

-- Test 4: Admins count (exact query from dashboard)
SELECT '=== TEST 4: ADMINS COUNT ===' as info;
SELECT COUNT(*) as admins_count 
FROM public.profiles 
WHERE role = 'admin';

-- Test 5: Tasks count
SELECT '=== TEST 5: TASKS COUNT ===' as info;
SELECT COUNT(*) as tasks_count FROM public.tasks;

-- Test 6: Submissions count
SELECT '=== TEST 6: SUBMISSIONS COUNT ===' as info;
SELECT COUNT(*) as submissions_count FROM public.task_submissions;

-- Test 7: Show all profiles with roles
SELECT '=== TEST 7: ALL PROFILES WITH ROLES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- Test 8: Role distribution summary
SELECT '=== TEST 8: ROLE DISTRIBUTION ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;
