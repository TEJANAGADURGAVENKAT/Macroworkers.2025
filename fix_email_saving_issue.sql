-- Fix email saving issue during registration
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Check users with NULL emails
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'email' as meta_email,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email IS NULL
ORDER BY created_at DESC;

-- 2. Update auth.users with email from raw_user_meta_data
UPDATE auth.users 
SET 
    email = raw_user_meta_data->>'email',
    updated_at = now()
WHERE email IS NULL
AND raw_user_meta_data->>'email' IS NOT NULL
AND raw_user_meta_data->>'email' != '';

-- 3. Update profiles with email from auth.users
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '' OR profiles.email != u.email);

-- 4. Verify the fix
SELECT 
    u.id,
    u.email as auth_email,
    u.email_confirmed_at,
    p.full_name,
    p.email as profile_email,
    p.role,
    p.phone,
    CASE 
        WHEN u.email IS NULL THEN 'AUTH EMAIL NULL'
        WHEN p.email IS NULL THEN 'PROFILE EMAIL NULL'
        WHEN u.email = p.email THEN 'EMAILS MATCH'
        ELSE 'EMAILS MISMATCH'
    END as email_status
FROM auth.users u
JOIN public.profiles p ON u.id = p.user_id
WHERE p.role = 'employer'
ORDER BY u.created_at DESC;

COMMIT;



