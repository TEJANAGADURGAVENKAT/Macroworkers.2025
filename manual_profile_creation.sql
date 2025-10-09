-- Manual profile creation for existing users
-- Run this in your Supabase SQL editor to create profiles for users who don't have them

-- 1. Create profiles for users who don't have them
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    u.email,
    u.role,
    COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
    COALESCE(u.raw_user_meta_data->>'category', '') as category,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role IN ('employer', 'worker');

-- 2. Update existing profiles with missing email addresses
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '');

-- 3. Verify the results
SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.role,
    p.phone,
    p.category,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.role = 'employer'
ORDER BY p.created_at DESC;



