-- Fix All RLS Policies
-- This script fixes RLS policies for all tables causing 500 errors

-- 1. Fix profiles table RLS
SELECT '=== FIXING PROFILES TABLE RLS ===' as info;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read basic profile info" ON public.profiles;

-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Fix tasks table RLS
SELECT '=== FIXING TASKS TABLE RLS ===' as info;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;

-- Disable RLS temporarily
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Allow authenticated users to read tasks" ON public.tasks
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create tasks" ON public.tasks
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own tasks" ON public.tasks
FOR UPDATE USING (auth.uid() = created_by);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Fix task_submissions table RLS
SELECT '=== FIXING TASK_SUBMISSIONS TABLE RLS ===' as info;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.task_submissions;

-- Disable RLS temporarily
ALTER TABLE public.task_submissions DISABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Allow authenticated users to read submissions" ON public.task_submissions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create submissions" ON public.task_submissions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own submissions" ON public.task_submissions
FOR UPDATE USING (auth.uid() = worker_id OR auth.uid() = employer_id);

-- Enable RLS
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Test all queries
SELECT '=== TESTING ALL QUERIES ===' as info;

-- Test profiles
SELECT 'Profiles - Workers Count:' as test;
SELECT COUNT(*) as workers_count 
FROM public.profiles 
WHERE role = 'worker';

SELECT 'Profiles - Employers Count:' as test;
SELECT COUNT(*) as employers_count 
FROM public.profiles 
WHERE role = 'employer';

SELECT 'Profiles - Admins Count:' as test;
SELECT COUNT(*) as admins_count 
FROM public.profiles 
WHERE role = 'admin';

-- Test tasks
SELECT 'Tasks Count:' as test;
SELECT COUNT(*) as tasks_count 
FROM public.tasks;

-- Test submissions
SELECT 'Submissions Count:' as test;
SELECT COUNT(*) as submissions_count 
FROM public.task_submissions;

-- 5. Show final summary
SELECT '=== FINAL SUMMARY ===' as info;
SELECT 
  'profiles' as table_name,
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

SELECT 
  'tasks' as table_name,
  COUNT(*) as total_tasks
FROM public.tasks;

SELECT 
  'task_submissions' as table_name,
  COUNT(*) as total_submissions
FROM public.task_submissions;
