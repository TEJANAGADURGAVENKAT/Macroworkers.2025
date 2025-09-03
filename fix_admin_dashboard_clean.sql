SELECT 'Current Profiles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;

SELECT 'Auth Users:' as info;
SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC;

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'employee', 'worker', 'employer'));

UPDATE public.profiles 
SET role = 'employer' 
WHERE role = 'employee';

BEGIN;

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

UPDATE public.profiles 
SET 
  role = 'employer',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT created_by FROM public.tasks
);

UPDATE public.profiles 
SET 
  role = 'worker',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT worker_id FROM public.task_submissions
);

UPDATE public.profiles 
SET 
  role = 'employer',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT created_by FROM public.tasks
) AND user_id IN (
  SELECT DISTINCT worker_id FROM public.task_submissions
);

COMMIT;

SELECT 'Updated Profiles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;

SELECT 'Employers:' as info;
SELECT id, user_id, full_name, email FROM public.profiles WHERE role = 'employer';

SELECT 'Workers:' as info;
SELECT id, user_id, full_name, email FROM public.profiles WHERE role = 'worker';

SELECT 'Admins:' as info;
SELECT id, user_id, full_name, email FROM public.profiles WHERE role = 'admin';

SELECT 'Workers Count:' as info;
SELECT COUNT(*) as workers_count FROM public.profiles WHERE role = 'worker';

SELECT 'Employers Count:' as info;
SELECT COUNT(*) as employers_count FROM public.profiles WHERE role = 'employer';

SELECT 'Submissions Count:' as info;
SELECT COUNT(*) as submissions_count FROM public.task_submissions;

SELECT 'Tasks Count:' as info;
SELECT COUNT(*) as tasks_count FROM public.tasks;
