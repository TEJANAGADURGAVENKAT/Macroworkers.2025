-- Diagnose and Fix Profile Issues
-- Run this in your Supabase SQL Editor

-- 1. Check what profiles we have and their roles
SELECT 'Current Profiles with Roles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;

-- 2. Check what users exist in auth.users
SELECT 'Auth Users:' as info;
SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC;

-- 3. Check what tasks exist and who created them
SELECT 'Tasks and their creators:' as info;
SELECT id, title, created_by FROM public.tasks ORDER BY created_at DESC;

-- 4. Check what submissions exist
SELECT 'Submissions:' as info;
SELECT id, task_id, worker_id, employer_id FROM public.task_submissions ORDER BY submitted_at DESC;

-- 5. Fix the profiles - ensure users who created tasks are marked as employers
UPDATE public.profiles 
SET 
  role = 'employer',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT created_by FROM public.tasks
);

-- 6. Fix the profiles - ensure users who submitted tasks are marked as workers
UPDATE public.profiles 
SET 
  role = 'worker',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT worker_id FROM public.task_submissions
);

-- 7. If a user has both created tasks and submitted tasks, prioritize employer role
UPDATE public.profiles 
SET 
  role = 'employer',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT created_by FROM public.tasks
) AND user_id IN (
  SELECT DISTINCT worker_id FROM public.task_submissions
);

-- 8. Check the results after fixing
SELECT 'Updated Profiles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;

-- 9. Test the counts
SELECT 'Workers Count:' as info;
SELECT COUNT(*) as workers_count FROM public.profiles WHERE role = 'worker';

SELECT 'Employers Count:' as info;
SELECT COUNT(*) as employers_count FROM public.profiles WHERE role = 'employer';

SELECT 'Submissions Count:' as info;
SELECT COUNT(*) as submissions_count FROM public.task_submissions;

SELECT 'Tasks Count:' as info;
SELECT COUNT(*) as tasks_count FROM public.tasks;
