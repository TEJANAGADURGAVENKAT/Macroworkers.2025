-- Check if there are any employer users in the database
-- Run this in your Supabase SQL editor

-- 1. Check all users in auth.users table
SELECT 
    id,
    email,
    role,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'phone' as phone
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check if there are any employer users specifically
SELECT 
    COUNT(*) as employer_count
FROM auth.users
WHERE role = 'employer';

-- 3. Check all profiles in public.profiles table
SELECT 
    id,
    user_id,
    full_name,
    email,
    role,
    phone,
    worker_status,
    status,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 4. Check if there are any employer profiles specifically
SELECT 
    COUNT(*) as employer_profile_count
FROM public.profiles
WHERE role = 'employer';



