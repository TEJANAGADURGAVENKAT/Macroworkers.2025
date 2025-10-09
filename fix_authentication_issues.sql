-- Fix authentication issues for employer registration
-- This script addresses common authentication problems

BEGIN;

-- 1. Check current authentication settings
SELECT 
    key,
    value
FROM auth.config 
WHERE key IN ('ENABLE_SIGNUP', 'ENABLE_EMAIL_CONFIRMATIONS', 'ENABLE_PHONE_CONFIRMATIONS');

-- 2. Check if there are any users with unconfirmed emails
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. Manually confirm emails for existing users (if needed)
-- Uncomment the following lines if you want to confirm all existing users
-- UPDATE auth.users 
-- SET email_confirmed_at = now()
-- WHERE email_confirmed_at IS NULL;

-- 4. Check profiles table for users without proper email
SELECT 
    p.user_id,
    p.full_name,
    p.email as profile_email,
    p.role,
    u.email as auth_email,
    u.email_confirmed_at,
    u.created_at
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.email IS NULL OR p.email = ''
ORDER BY u.created_at DESC;

-- 5. Update profiles with missing email addresses
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '');

-- 6. Check RLS policies on auth.users (should be handled by Supabase)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'auth' 
AND tablename = 'users';

COMMIT;



