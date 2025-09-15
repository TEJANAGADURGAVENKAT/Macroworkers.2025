-- Fix RLS Policies - Simple Version (No Recursion)
-- This script fixes Row Level Security policies without causing infinite recursion

-- 1. First, let's see what policies exist
SELECT '=== CURRENT RLS POLICIES ===' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admin can access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read basic profile info" ON public.profiles;

-- 3. Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. Create a simple policy that allows all authenticated users to read profiles
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Create a policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create a policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Enable RLS again
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. Test the queries
SELECT '=== TESTING QUERIES AFTER SIMPLE RLS FIX ===' as info;

SELECT 'Workers Count:' as test;
SELECT COUNT(*) as workers_count 
FROM public.profiles 
WHERE role = 'worker';

SELECT 'Employers Count:' as test;
SELECT COUNT(*) as employers_count 
FROM public.profiles 
WHERE role = 'employer';

SELECT 'Admins Count:' as test;
SELECT COUNT(*) as admins_count 
FROM public.profiles 
WHERE role = 'admin';

-- 9. Show final role distribution
SELECT '=== FINAL ROLE DISTRIBUTION ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 10. Test a simple select to make sure it works
SELECT '=== TEST SIMPLE SELECT ===' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

