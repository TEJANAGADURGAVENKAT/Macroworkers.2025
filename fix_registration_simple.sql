-- Simple fix for registration without complex triggers
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Drop any existing triggers that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_auth_user_email();

-- 2. Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- 3. Create simple RLS policies
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Fix existing users with NULL emails
UPDATE auth.users 
SET email = raw_user_meta_data->>'email'
WHERE email IS NULL 
AND raw_user_meta_data->>'email' IS NOT NULL
AND raw_user_meta_data->>'email' != '';

-- 5. Create profiles for existing users who don't have them
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, worker_status, status, created_at, updated_at)
SELECT 
    u.id, 
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User'),
    u.email,
    COALESCE(u.raw_user_meta_data->>'role', 'worker'),
    COALESCE(u.raw_user_meta_data->>'phone', ''),
    COALESCE(u.raw_user_meta_data->>'category', ''),
    CASE WHEN COALESCE(u.raw_user_meta_data->>'role', 'worker') = 'employer' THEN 'verification_pending' ELSE 'document_upload_pending' END,
    CASE WHEN COALESCE(u.raw_user_meta_data->>'role', 'worker') = 'employer' THEN 'verification_pending' ELSE 'document_upload_pending' END,
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

-- 7. Confirm all emails
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

COMMIT;



