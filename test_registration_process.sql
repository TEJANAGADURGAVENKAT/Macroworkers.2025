-- Test registration process
-- Run this in your Supabase SQL editor

-- 1. Check recent employer registrations
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'phone' as phone,
    u.raw_user_meta_data->>'role' as role
FROM auth.users u
WHERE u.role = 'employer'
ORDER BY u.created_at DESC
LIMIT 5;

-- 2. Check if profiles exist for these users
SELECT 
    u.id,
    u.email as auth_email,
    u.email_confirmed_at,
    p.full_name,
    p.email as profile_email,
    p.role as profile_role,
    p.phone as profile_phone,
    p.worker_status,
    p.status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'employer'
ORDER BY u.created_at DESC
LIMIT 5;

-- 3. Check for any missing profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    'Missing Profile' as issue
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role = 'employer'
ORDER BY u.created_at DESC;

-- 4. Check for profiles with missing emails
SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.role,
    u.email as auth_email,
    'Missing Email' as issue
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'employer'
AND (p.email IS NULL OR p.email = '' OR p.email != u.email)
ORDER BY p.created_at DESC;



