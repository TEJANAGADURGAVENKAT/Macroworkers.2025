-- Complete Admin Dashboard Setup
-- This migration ensures all foreign key relationships work and data is properly populated

BEGIN;

-- 1. Ensure all necessary columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Ensure tasks.created_by has proper foreign key to profiles.user_id
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 3. Ensure task_submissions.worker_id has proper foreign key to profiles.user_id
ALTER TABLE public.task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_worker_id_fkey;

ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_worker_id_fkey 
FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 4. Ensure task_submissions.employer_id has proper foreign key to profiles.user_id
ALTER TABLE public.task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_employer_id_fkey;

ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_employer_id_fkey 
FOREIGN KEY (employer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 5. Create indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker_id ON public.task_submissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 6. Create profiles for ALL users in auth.users who don't have profiles
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

-- 7. Update existing profiles with real data from auth.users
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    profiles.full_name,
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'User ' || SUBSTRING(profiles.user_id::text, 1, 8)
  ),
  email = COALESCE(profiles.email, au.email),
  phone = COALESCE(profiles.phone, au.raw_user_meta_data->>'phone'),
  role = COALESCE(profiles.role, au.raw_user_meta_data->>'role', 'worker'),
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id;

-- 8. Ensure all workers who have submitted tasks have profiles
INSERT INTO public.profiles (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT DISTINCT 
  ts.worker_id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'Worker ' || SUBSTRING(ts.worker_id::text, 1, 8)
  ) as full_name,
  au.email,
  au.raw_user_meta_data->>'phone' as phone,
  'worker' as role,
  COALESCE(au.created_at, NOW()),
  NOW()
FROM public.task_submissions ts
LEFT JOIN public.profiles p ON ts.worker_id = p.user_id
LEFT JOIN auth.users au ON ts.worker_id = au.id
WHERE p.id IS NULL;

-- 9. Ensure all users who have created tasks have profiles
INSERT INTO public.profiles (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT DISTINCT 
  t.created_by,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'Employer ' || SUBSTRING(t.created_by::text, 1, 8)
  ) as full_name,
  au.email,
  au.raw_user_meta_data->>'phone' as phone,
  'employer' as role,
  COALESCE(au.created_at, NOW()),
  NOW()
FROM public.tasks t
LEFT JOIN public.profiles p ON t.created_by = p.user_id
LEFT JOIN auth.users au ON t.created_by = au.id
WHERE p.id IS NULL;

-- 10. Update task_submissions.employer_id to match task.created_by if not set
UPDATE public.task_submissions 
SET employer_id = t.created_by
FROM public.tasks t
WHERE task_submissions.task_id = t.id 
  AND task_submissions.employer_id IS NULL;

-- 11. Update any profiles that still have generated names
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    CASE 
      WHEN profiles.role = 'employer' THEN 'Employer ' || SUBSTRING(profiles.user_id::text, 1, 8)
      WHEN profiles.role = 'worker' THEN 'Worker ' || SUBSTRING(profiles.user_id::text, 1, 8)
      ELSE 'User ' || SUBSTRING(profiles.user_id::text, 1, 8)
    END
  ),
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id
  AND (profiles.full_name LIKE 'User %' OR profiles.full_name LIKE 'Worker %' OR profiles.full_name LIKE 'Employer %');

COMMIT;


