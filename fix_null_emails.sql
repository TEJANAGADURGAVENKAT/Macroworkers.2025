-- Fix NULL email addresses for employer profiles
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Check which employer profiles have NULL emails
SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.email as profile_email,
    u.email as auth_email,
    CASE 
        WHEN p.email IS NULL THEN 'NULL EMAIL'
        WHEN p.email = '' THEN 'EMPTY EMAIL'
        ELSE 'HAS EMAIL'
    END as email_status
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'employer'
ORDER BY p.created_at DESC;

-- 2. Update employer profiles with NULL emails
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND profiles.role = 'employer'
AND (profiles.email IS NULL OR profiles.email = '');

-- 3. Verify the fix
SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.email as profile_email,
    u.email as auth_email,
    CASE 
        WHEN p.email IS NULL THEN 'NULL EMAIL'
        WHEN p.email = '' THEN 'EMPTY EMAIL'
        WHEN p.email = u.email THEN 'EMAIL MATCHES'
        ELSE 'EMAIL MISMATCH'
    END as email_status
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'employer'
ORDER BY p.created_at DESC;

COMMIT;



