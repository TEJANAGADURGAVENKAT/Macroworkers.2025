-- Complete fix for registration based on your actual schema
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Drop any existing problematic triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_auth_user_email();

-- 2. Clean up existing RLS policies
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

-- 3. Create proper RLS policies for profiles table
CREATE POLICY "Enable insert for authenticated users only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Enable update for users based on user_id" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- 4. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Fix existing users with NULL emails
UPDATE auth.users 
SET email = raw_user_meta_data->>'email'
WHERE email IS NULL 
AND raw_user_meta_data->>'email' IS NOT NULL
AND raw_user_meta_data->>'email' != '';

-- 6. Create profiles for existing users who don't have them
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

-- 7. Update existing profiles with correct emails
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = NOW()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '' OR profiles.email != u.email);

-- 8. Confirm all emails in auth.users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 9. Create a simple trigger function for new users (optional - for automatic profile creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't exist
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
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'category', ''),
    CASE 
        WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'worker') = 'employer' 
        THEN 'verification_pending' 
        ELSE 'document_upload_pending' 
    END,
    CASE 
        WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'worker') = 'employer' 
        THEN 'verification_pending' 
        ELSE 'document_upload_pending' 
    END,
    CASE 
        WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'worker') = 'employer' 
        THEN 3.00 
        ELSE 1.00 
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create the trigger (optional - you can rely on frontend profile creation instead)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;