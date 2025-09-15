-- Fix Foreign Key Relationships for Admin Dashboard
-- Run this in your Supabase SQL Editor

-- 1. Check current foreign key constraints
SELECT 'Current Foreign Keys:' as info;
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
  AND tc.table_name IN ('tasks', 'task_submissions')
ORDER BY tc.table_name, kcu.column_name;

-- 2. Drop existing foreign key constraints that might be causing conflicts
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_worker_id_fkey;

ALTER TABLE public.task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_employer_id_fkey;

-- 3. Add proper foreign key constraints
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_worker_id_fkey 
FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_employer_id_fkey 
FOREIGN KEY (employer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker_id ON public.task_submissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON public.task_submissions(task_id);

-- 5. Ensure all users have profiles
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

-- 6. Update task_submissions.employer_id to match task.created_by if not set
UPDATE public.task_submissions 
SET employer_id = t.created_by
FROM public.tasks t
WHERE task_submissions.task_id = t.id 
  AND task_submissions.employer_id IS NULL;

-- 7. Test the queries that the admin dashboard uses
SELECT 'Testing Admin Dashboard Queries:' as info;

SELECT 'Workers Count:' as info;
SELECT COUNT(*) as workers_count FROM public.profiles WHERE role = 'worker';

SELECT 'Employers Count:' as info;
SELECT COUNT(*) as employers_count FROM public.profiles WHERE role = 'employer';

SELECT 'Submissions Count:' as info;
SELECT COUNT(*) as submissions_count FROM public.task_submissions;

SELECT 'Tasks Count:' as info;
SELECT COUNT(*) as tasks_count FROM public.tasks;

-- 8. Test the complex queries
SELECT 'Testing Task Submissions with Profiles:' as info;
SELECT 
  ts.id,
  ts.worker_id,
  ts.employer_id,
  wp.full_name as worker_name,
  ep.full_name as employer_name
FROM public.task_submissions ts
LEFT JOIN public.profiles wp ON ts.worker_id = wp.user_id
LEFT JOIN public.profiles ep ON ts.employer_id = ep.user_id
LIMIT 5;
