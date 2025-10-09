-- SAFE fix: Only remove problematic triggers, keep existing policies
-- This won't damage your existing RLS policies

BEGIN;

-- 1. Only remove the problematic trigger (this is safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Fix existing NULL emails (this is safe)
UPDATE auth.users 
SET email = raw_user_meta_data->>'email'
WHERE email IS NULL 
AND raw_user_meta_data->>'email' IS NOT NULL
AND raw_user_meta_data->>'email' != '';

-- 3. Confirm all emails (this is safe)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 4. Create profiles for existing users who don't have them (this is safe)
INSERT INTO public.profiles (
    user_id, 
    full_name, 
    email, 
    role, 
    phone, 
    category, 
    worker_status, 
    status, 
    rating,
    created_at, 
    updated_at
)
SELECT 
    u.id, 
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User'),
    u.email,
    COALESCE(u.raw_user_meta_data->>'role', 'worker'),
    COALESCE(u.raw_user_meta_data->>'phone', ''),
    COALESCE(u.raw_user_meta_data->>'category', ''),
    CASE 
        WHEN COALESCE(u.raw_user_meta_data->>'role', 'worker') = 'employer' 
        THEN 'verification_pending' 
        ELSE 'document_upload_pending' 
    END,
    CASE 
        WHEN COALESCE(u.raw_user_meta_data->>'role', 'worker') = 'employer' 
        THEN 'verification_pending' 
        ELSE 'document_upload_pending' 
    END,
    CASE 
        WHEN COALESCE(u.raw_user_meta_data->>'role', 'worker') = 'employer' 
        THEN 3.00 
        ELSE 1.00 
    END,
    u.created_at,
    NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

COMMIT;


