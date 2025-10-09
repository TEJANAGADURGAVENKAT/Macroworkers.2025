-- Simple fix: Remove all triggers and let frontend handle profile creation
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Remove ALL triggers and functions that might interfere
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_auth_user_email();
DROP FUNCTION IF EXISTS public.handle_auth_user_deleted();

-- 2. Remove ALL existing RLS policies on profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- 3. Temporarily disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. Fix existing users with NULL emails
UPDATE auth.users 
SET email = raw_user_meta_data->>'email'
WHERE email IS NULL 
AND raw_user_meta_data->>'email' IS NOT NULL
AND raw_user_meta_data->>'email' != '';

-- 5. Create profiles for existing users who don't have them
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

-- 6. Update existing profiles with correct emails
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = NOW()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '' OR profiles.email != u.email);

-- 7. Confirm all emails in auth.users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

COMMIT;


