-- Complete worker profiles with email and phone information
-- This ensures all worker profiles have complete contact information

BEGIN;

-- First, ensure the email and phone columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update worker profiles with email from auth.users
UPDATE public.profiles 
SET 
  email = au.email,
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id 
  AND profiles.email IS NULL 
  AND au.email IS NOT NULL;

-- Update worker profiles with phone from auth.users metadata
UPDATE public.profiles 
SET 
  phone = au.raw_user_meta_data->>'phone',
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id 
  AND profiles.phone IS NULL 
  AND au.raw_user_meta_data->>'phone' IS NOT NULL;

-- Ensure all worker profiles have proper names
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    full_name,
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'Worker ' || SUBSTRING(user_id::text, 1, 8)
  ),
  updated_at = NOW()
FROM auth.users au
WHERE profiles.user_id = au.id 
  AND (full_name IS NULL OR full_name = '');

-- Create profiles for any remaining workers who don't have profiles
INSERT INTO public.profiles (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'Worker ' || SUBSTRING(au.id::text, 1, 8)
  ) as full_name,
  au.email,
  au.raw_user_meta_data->>'phone' as phone,
  'worker' as role,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL;

COMMIT;
