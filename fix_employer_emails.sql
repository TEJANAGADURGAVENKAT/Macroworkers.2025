-- Fix email addresses for employer profiles
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Check current employer profiles
SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email as profile_email,
    p.role,
    p.phone,
    p.worker_status,
    p.status,
    u.email as auth_email
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'employer'
ORDER BY p.created_at DESC;

-- 2. Update employer profiles with email addresses from auth.users
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND profiles.role = 'employer'
AND (profiles.email IS NULL OR profiles.email = '' OR profiles.email != u.email);

-- 3. Update employer profiles with correct status
UPDATE public.profiles 
SET 
    worker_status = 'verification_pending',
    status = 'verification_pending',
    updated_at = now()
WHERE role = 'employer'
AND (worker_status IS NULL OR status IS NULL);

-- 4. Confirm all employer emails in auth.users
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE id IN (
    SELECT user_id FROM public.profiles WHERE role = 'employer'
)
AND email_confirmed_at IS NULL;

COMMIT;



