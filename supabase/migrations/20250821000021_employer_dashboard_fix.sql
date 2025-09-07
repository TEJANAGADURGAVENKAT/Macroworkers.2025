-- Fix Employer Dashboard Data and Relationships
-- This migration ensures all data is properly linked and profiles are populated

BEGIN;

-- 1. Ensure all users have profiles with correct data
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

-- 2. Update existing profiles with real data from auth.users
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

-- 3. Ensure users who created tasks are marked as employers
UPDATE public.profiles 
SET 
  role = 'employer',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT created_by FROM public.tasks
);

-- 4. Ensure users who submitted tasks are marked as workers
UPDATE public.profiles 
SET 
  role = 'worker',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT worker_id FROM public.task_submissions
);

-- 5. If a user has both created tasks and submitted tasks, prioritize employer role
UPDATE public.profiles 
SET 
  role = 'employer',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT created_by FROM public.tasks
) AND user_id IN (
  SELECT DISTINCT worker_id FROM public.task_submissions
);

-- 6. Ensure task_submissions.employer_id is set correctly
UPDATE public.task_submissions 
SET employer_id = tasks.created_by
FROM public.tasks
WHERE task_submissions.task_id = tasks.id
AND task_submissions.employer_id IS NULL;

-- 7. Create task_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- 8. Add RLS policies for task_views
ALTER TABLE public.task_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert task views
CREATE POLICY IF NOT EXISTS "Anyone can insert task views" ON public.task_views
  FOR INSERT WITH CHECK (true);

-- Allow task creators and admins to view task views
CREATE POLICY IF NOT EXISTS "Task creators can view task views" ON public.task_views
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE created_by = auth.uid()
    )
  );

-- 9. Ensure submission-files bucket exists with correct policies
-- (This is handled by the storage bucket creation migration)

-- 10. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker_id ON public.task_submissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON public.task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_task_views_task_id ON public.task_views(task_id);

COMMIT;

-- 11. Check the results
SELECT 'Updated Profiles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;

SELECT 'Employers:' as info;
SELECT id, user_id, full_name, email FROM public.profiles WHERE role = 'employer';

SELECT 'Workers:' as info;
SELECT id, user_id, full_name, email FROM public.profiles WHERE role = 'worker';

SELECT 'Task Submissions with Employer IDs:' as info;
SELECT ts.id, ts.task_id, ts.worker_id, ts.employer_id, t.title 
FROM public.task_submissions ts 
JOIN public.tasks t ON ts.task_id = t.id 
LIMIT 10;
