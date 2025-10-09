-- Manual fix for specific users with NULL emails
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Check the specific users with NULL emails
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'email' as meta_email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'phone' as phone,
    u.raw_user_meta_data
FROM auth.users u
WHERE u.id IN (
    '4d4ecb0e-3cf7-49af-8d14-3d92e77b7c59', -- kavya d
    '70d8e6f7-e104-4651-b02c-adf56f05c11d'  -- Bhagya G
);

-- 2. If email is in raw_user_meta_data, update auth.users
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

-- 3. Update profiles with email from auth.users
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

-- 4. If email is still NULL, we need to set a placeholder or ask user to re-register
-- For now, let's set a placeholder email
UPDATE auth.users 
SET 
    email = CASE 
        WHEN id = '4d4ecb0e-3cf7-49af-8d14-3d92e77b7c59' THEN 'kavya.d@placeholder.com'
        WHEN id = '70d8e6f7-e104-4651-b02c-adf56f05c11d' THEN 'bhagya.g@placeholder.com'
    END,
    updated_at = now()
WHERE id IN (
    '4d4ecb0e-3cf7-49af-8d14-3d92e77b7c59', -- kavya d
    '70d8e6f7-e104-4651-b02c-adf56f05c11d'  -- Bhagya G
)
AND (email IS NULL OR email = '');

-- 5. Update profiles with the new email addresses
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

-- 6. Verify the fix
SELECT 
    u.id,
    u.email as auth_email,
    p.full_name,
    p.email as profile_email,
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



