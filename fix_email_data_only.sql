-- Fix email addresses not showing - Data only (no policy changes)
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Check current RLS policies (just to see what exists)
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 2. Temporarily disable RLS to fix the data
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Force create/update profiles for ALL employer users
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, worker_status, status, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    u.email,
    'employer' as role,
    COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
    COALESCE(u.raw_user_meta_data->>'category', '') as category,
    'verification_pending' as worker_status,
    'verification_pending' as status,
    u.created_at,
    now() as updated_at
FROM auth.users u
WHERE u.role = 'employer'
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    worker_status = EXCLUDED.worker_status,
    status = EXCLUDED.status,
    updated_at = now();

-- 4. Force update ALL existing employer profiles with correct email addresses
UPDATE public.profiles 
SET 
    email = u.email,
    full_name = COALESCE(u.raw_user_meta_data->>'full_name', profiles.full_name),
    phone = COALESCE(u.raw_user_meta_data->>'phone', profiles.phone),
    role = 'employer',
    worker_status = 'verification_pending',
    status = 'verification_pending',
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND u.role = 'employer';

-- 5. Confirm all employer emails
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE role = 'employer'
AND email_confirmed_at IS NULL;

-- 6. Re-enable RLS (keep existing policies)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;



