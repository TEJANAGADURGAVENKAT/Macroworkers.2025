-- Admin Dashboard - Ensure all foreign key relationships for proper joins
-- This migration ensures that all tables can be properly joined for the admin dashboard

BEGIN;

-- 1. Ensure tasks.created_by has proper foreign key to profiles.user_id
-- First, drop existing constraint if it exists
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 2. Ensure task_submissions.worker_id has proper foreign key to profiles.user_id
-- First, drop existing constraint if it exists
ALTER TABLE public.task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_worker_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_worker_id_fkey 
FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 3. Ensure task_submissions.employer_id has proper foreign key to profiles.user_id
-- First, drop existing constraint if it exists
ALTER TABLE public.task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_employer_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_employer_id_fkey 
FOREIGN KEY (employer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 4. Create indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker_id ON public.task_submissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 5. Ensure all users who have submitted tasks have profiles
INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
SELECT DISTINCT 
  ts.worker_id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'Worker ' || SUBSTRING(ts.worker_id::text, 1, 8)
  ) as full_name,
  'worker' as role,
  COALESCE(au.created_at, NOW()),
  NOW()
FROM public.task_submissions ts
LEFT JOIN public.profiles p ON ts.worker_id = p.user_id
LEFT JOIN auth.users au ON ts.worker_id = au.id
WHERE p.id IS NULL;

-- 6. Ensure all users who have created tasks have profiles
INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
SELECT DISTINCT 
  t.created_by,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'Employer ' || SUBSTRING(t.created_by::text, 1, 8)
  ) as full_name,
  'employer' as role,
  COALESCE(au.created_at, NOW()),
  NOW()
FROM public.tasks t
LEFT JOIN public.profiles p ON t.created_by = p.user_id
LEFT JOIN auth.users au ON t.created_by = au.id
WHERE p.id IS NULL;

-- 7. Update task_submissions.employer_id to match task.created_by if not set
UPDATE public.task_submissions 
SET employer_id = t.created_by
FROM public.tasks t
WHERE task_submissions.task_id = t.id 
  AND task_submissions.employer_id IS NULL;

COMMIT;


