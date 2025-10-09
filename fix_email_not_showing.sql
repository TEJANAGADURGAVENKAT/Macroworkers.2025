-- Fix for email addresses not showing in database
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. First, let's check what's actually in the auth.users table
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'phone' as phone,
    raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE role = 'employer'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check what's in the profiles table
SELECT 
    user_id,
    full_name,
    email,
    role,
    phone,
    created_at
FROM public.profiles 
WHERE role = 'employer'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check for users without profiles
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'phone' as phone,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role = 'employer'
ORDER BY u.created_at DESC;

-- 4. Force create profiles for all employer users
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, worker_status, status, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    u.email,
    'employer' as role,
    COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
    COALESCE(u.raw_user_meta_data->>'category', '') as category,
    'verification_pending' as worker_status,
    'verification_pending' as status,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role = 'employer'
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

-- 5. Force update all existing employer profiles with email addresses
UPDATE public.profiles 
SET 
    email = u.email,
    full_name = COALESCE(u.raw_user_meta_data->>'full_name', profiles.full_name),
    phone = COALESCE(u.raw_user_meta_data->>'phone', profiles.phone),
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND u.role = 'employer'
AND (profiles.email IS NULL OR profiles.email = '' OR profiles.email != u.email);

-- 6. Confirm all employer emails
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE role = 'employer'
AND email_confirmed_at IS NULL;

COMMIT;



