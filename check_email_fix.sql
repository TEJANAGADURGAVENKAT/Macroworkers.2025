-- Check if email addresses are now showing in database
-- Run this in your Supabase SQL editor

-- 1. Check if all employer users have profiles with email addresses
SELECT 
    u.id,
    u.email as auth_email,
    u.email_confirmed_at,
    p.full_name,
    p.email as profile_email,
    p.role,
    p.phone,
    p.worker_status,
    p.status,
    CASE 
        WHEN p.email IS NULL OR p.email = '' THEN 'MISSING EMAIL'
        WHEN p.email != u.email THEN 'EMAIL MISMATCH'
        ELSE 'OK'
    END as email_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'employer'
ORDER BY u.created_at DESC;

-- 2. Count how many employers have missing emails
SELECT 
    COUNT(*) as total_employers,
    COUNT(CASE WHEN p.email IS NULL OR p.email = '' THEN 1 END) as missing_emails,
    COUNT(CASE WHEN p.email IS NOT NULL AND p.email != '' THEN 1 END) as have_emails
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'employer';

-- 3. Show recent employer registrations
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.full_name,
    p.email as profile_email,
    p.phone,
    p.worker_status,
    p.status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'employer'
ORDER BY u.created_at DESC
LIMIT 10;



