-- Fix Task Display Issues
-- This migration ensures tasks are properly linked and visible to employers

BEGIN;

-- 1. Check current tasks and their status
SELECT 'Current Tasks:' as info;
SELECT id, title, status, created_by, created_at FROM public.tasks ORDER BY created_at DESC;

-- 2. Check profiles for task creators
SELECT 'Task Creator Profiles:' as info;
SELECT p.id, p.user_id, p.full_name, p.role, p.email 
FROM public.profiles p 
WHERE p.user_id IN (SELECT DISTINCT created_by FROM public.tasks);

-- 3. Ensure all task creators have employer role
UPDATE public.profiles 
SET role = 'employer', updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT created_by FROM public.tasks
) AND role != 'employer';

-- 4. Set default status for tasks that don't have one
UPDATE public.tasks 
SET status = 'active'
WHERE status IS NULL OR status = '';

-- 5. Check for any orphaned tasks (tasks without profiles)
SELECT 'Orphaned Tasks (no profile):' as info;
SELECT t.id, t.title, t.created_by, t.status
FROM public.tasks t
LEFT JOIN public.profiles p ON t.created_by = p.user_id
WHERE p.id IS NULL;

-- 6. Create profiles for any orphaned task creators
INSERT INTO public.profiles (user_id, full_name, email, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'User ' || SUBSTRING(au.id::text, 1, 8)
  ) as full_name,
  au.email,
  'employer' as role,
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.id IN (
  SELECT DISTINCT t.created_by 
  FROM public.tasks t
  LEFT JOIN public.profiles p ON t.created_by = p.user_id
  WHERE p.id IS NULL
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'employer',
  updated_at = NOW();

-- 7. Final check - all tasks should now be visible
SELECT 'Final Task Check:' as info;
SELECT 
  t.id,
  t.title,
  t.status,
  t.created_by,
  p.full_name as creator_name,
  p.role as creator_role
FROM public.tasks t
LEFT JOIN public.profiles p ON t.created_by = p.user_id
ORDER BY t.created_at DESC;

COMMIT;
