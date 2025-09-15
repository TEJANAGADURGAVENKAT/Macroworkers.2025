-- Fix RLS Policies for Admin Dashboard
-- This script fixes Row Level Security policies that might be blocking admin access

-- 1. Check current RLS policies
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

-- 2. Disable RLS temporarily for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Create a proper admin policy that allows full access
CREATE POLICY IF NOT EXISTS "Admin can access all profiles" ON public.profiles
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. Create a policy for users to access their own profile
CREATE POLICY IF NOT EXISTS "Users can access own profile" ON public.profiles
FOR ALL USING (
  auth.uid() = user_id
);

-- 5. Create a policy for public read access to basic profile info
CREATE POLICY IF NOT EXISTS "Public can read basic profile info" ON public.profiles
FOR SELECT USING (true);

-- 6. Enable RLS again
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Test the queries again
SELECT '=== TESTING QUERIES AFTER RLS FIX ===' as info;

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

-- 8. Show final role distribution
SELECT '=== FINAL ROLE DISTRIBUTION ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;
