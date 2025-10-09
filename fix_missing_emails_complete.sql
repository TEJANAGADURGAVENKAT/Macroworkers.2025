-- Complete fix for missing email addresses during registration
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Check which users have NULL emails in auth.users
SELECT 
    id,
    email,
    role,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'phone' as phone
FROM auth.users
WHERE email IS NULL OR email = ''
ORDER BY created_at DESC;

-- 2. Check if these users have email in raw_user_meta_data
SELECT 
    id,
    email,
    raw_user_meta_data->>'email' as meta_email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'phone' as phone,
    raw_user_meta_data
FROM auth.users
WHERE (email IS NULL OR email = '')
AND role = 'employer'
ORDER BY created_at DESC;

-- 3. Update auth.users with email from raw_user_meta_data if available
UPDATE auth.users 
SET 
    email = raw_user_meta_data->>'email',
    updated_at = now()
WHERE (email IS NULL OR email = '')
AND raw_user_meta_data->>'email' IS NOT NULL
AND raw_user_meta_data->>'email' != '';

-- 4. Update profiles with email from auth.users
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND profiles.role = 'employer'
AND (profiles.email IS NULL OR profiles.email = '' OR profiles.email != u.email);

-- 5. Confirm all employer emails
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE role = 'employer'
AND email_confirmed_at IS NULL;

-- 6. Verify the fix
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



