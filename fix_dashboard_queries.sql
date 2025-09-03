-- Fix Dashboard Queries
-- This script will test the exact queries the Admin Dashboard uses

-- 1. First, let's see what's actually in the database
SELECT '=== DATABASE ACTUAL DATA ===' as info;
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

-- 3. Test the EXACT queries the dashboard uses
SELECT '=== DASHBOARD QUERY TESTS ===' as info;

-- Test 1: Workers count (exact dashboard query)
SELECT 'Workers Count Test:' as test_name;
SELECT COUNT(*) as workers_count 
FROM public.profiles 
WHERE role = 'worker';

-- Test 2: Employers count (exact dashboard query)
SELECT 'Employers Count Test:' as test_name;
SELECT COUNT(*) as employers_count 
FROM public.profiles 
WHERE role = 'employer';

-- Test 3: Admins count (exact dashboard query)
SELECT 'Admins Count Test:' as test_name;
SELECT COUNT(*) as admins_count 
FROM public.profiles 
WHERE role = 'admin';

-- 4. Show role distribution
SELECT '=== ROLE DISTRIBUTION ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 5. Check for any case sensitivity issues
SELECT '=== CASE SENSITIVITY CHECK ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 6. Check for any whitespace issues
SELECT '=== WHITESPACE CHECK ===' as info;
SELECT 
  'role_length_' || LENGTH(role) as role_info,
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;
