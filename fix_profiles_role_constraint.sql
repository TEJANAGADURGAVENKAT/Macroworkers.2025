-- Fix Profiles Role Constraint Issue
-- This script fixes the profiles_role_check constraint and ensures all profiles have valid roles

-- 1. First, let's see what roles currently exist and identify the problem
SELECT '=== CURRENT ROLES ANALYSIS ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 2. Show profiles with invalid or NULL roles
SELECT '=== PROFILES WITH INVALID ROLES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
WHERE role IS NULL OR role = '' OR role NOT IN ('worker', 'employer', 'admin')
ORDER BY created_at DESC;

-- 3. Drop the existing constraint to fix the data first
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 4. Fix all profiles with invalid roles
-- Set NULL/empty roles to 'worker'
UPDATE public.profiles 
SET role = 'worker' 
WHERE role IS NULL OR role = '';

-- Fix 'employee' to 'employer'
UPDATE public.profiles 
SET role = 'employer' 
WHERE role = 'employee';

-- Set any other invalid roles to 'worker' as default
UPDATE public.profiles 
SET role = 'worker' 
WHERE role NOT IN ('worker', 'employer', 'admin');

-- 5. Now add the correct constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('worker', 'employer', 'admin'));

-- 6. Ensure the role column has a default value
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'worker';

-- 7. Make sure role column is NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN role SET NOT NULL;

-- 8. Verify all profiles now have valid roles
SELECT '=== VERIFICATION - ALL PROFILES WITH VALID ROLES ===' as info;
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- 9. Show final role distribution
SELECT '=== FINAL ROLE DISTRIBUTION ===' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 10. Test the constraint
SELECT '=== CONSTRAINT TEST ===' as info;
SELECT 'All profiles have valid roles:' as test_result,
  CASE 
    WHEN COUNT(*) = COUNT(CASE WHEN role IN ('worker', 'employer', 'admin') THEN 1 END) 
    THEN 'PASSED' 
    ELSE 'FAILED' 
  END as status
FROM public.profiles;
