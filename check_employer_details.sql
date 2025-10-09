-- Check employer users specifically
-- Run this in your Supabase SQL editor

-- 1. Check employer profiles with their auth user details
SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.email as profile_email,
    p.role as profile_role,
    p.phone,
    p.worker_status,
    p.status,
    p.created_at as profile_created_at,
    u.email as auth_email,
    u.role as auth_role,
    u.email_confirmed_at,
    u.created_at as auth_created_at,
    CASE 
        WHEN p.email IS NULL OR p.email = '' THEN 'MISSING EMAIL'
        WHEN p.email != u.email THEN 'EMAIL MISMATCH'
        ELSE 'OK'
    END as email_status
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'employer'
ORDER BY p.created_at DESC;

-- 2. Check if employer profiles have email addresses
SELECT 
    COUNT(*) as total_employers,
    COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_emails,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as have_emails
FROM public.profiles
WHERE role = 'employer';

-- 3. Show all employer profiles
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
WHERE role = 'employer'
ORDER BY created_at DESC;



