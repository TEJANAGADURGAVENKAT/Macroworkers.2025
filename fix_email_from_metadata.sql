-- Fix email addresses by copying from raw_user_meta_data
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Update auth.users with email from raw_user_meta_data
UPDATE auth.users 
SET 
    email = raw_user_meta_data->>'email',
    updated_at = now()
WHERE id IN (
    '4d4ecb0e-3cf7-49af-8d14-3d92e77b7c59', -- kavya d
    '70d8e6f7-e104-4651-b02c-adf56f05c11d'  -- Bhagya G
)
AND raw_user_meta_data->>'email' IS NOT NULL
AND raw_user_meta_data->>'email' != '';

-- 2. Update profiles with email from auth.users
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND profiles.user_id IN (
    '4d4ecb0e-3cf7-49af-8d14-3d92e77b7c59', -- kavya d
    '70d8e6f7-e104-4651-b02c-adf56f05c11d'  -- Bhagya G
);

-- 3. Confirm the emails
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE id IN (
    '4d4ecb0e-3cf7-49af-8d14-3d92e77b7c59', -- kavya d
    '70d8e6f7-e104-4651-b02c-adf56f05c11d'  -- Bhagya G
)
AND email_confirmed_at IS NULL;

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



