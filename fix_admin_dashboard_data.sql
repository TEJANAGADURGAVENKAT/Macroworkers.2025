-- Fix Admin Dashboard Data Issues
-- Run this in your Supabase SQL Editor to check and fix the data

-- 1. First, let's see what data we have
SELECT 'Current Profiles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;

SELECT 'Current Tasks:' as info;
SELECT id, title, created_by FROM public.tasks ORDER BY created_at DESC;

SELECT 'Current Submissions:' as info;
SELECT id, task_id, worker_id, employer_id FROM public.task_submissions ORDER BY submitted_at DESC;

-- 2. Check auth.users to see what users exist
SELECT 'Auth Users:' as info;
SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC;

-- 3. Fix profiles - ensure all users have profiles with correct roles
BEGIN;

-- Create profiles for ALL users in auth.users who don't have profiles
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

-- Update existing profiles with real data from auth.users
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

-- Ensure users who created tasks are marked as employers
UPDATE public.profiles 
SET 
  role = 'employer',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT created_by FROM public.tasks
);

-- Ensure users who submitted tasks are marked as workers
UPDATE public.profiles 
SET 
  role = 'worker',
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT worker_id FROM public.task_submissions
);

-- If a user has both created tasks and submitted tasks, prioritize employer role
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

-- 4. Check the results
SELECT 'Updated Profiles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;

SELECT 'Employers:' as info;
SELECT id, user_id, full_name, email FROM public.profiles WHERE role = 'employer';

SELECT 'Workers:' as info;
SELECT id, user_id, full_name, email FROM public.profiles WHERE role = 'worker';


