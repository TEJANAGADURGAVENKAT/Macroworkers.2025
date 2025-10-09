-- Test employer registration and profile creation
-- Run this in your Supabase SQL editor

-- 1. Check if there are any employers in the profiles table
SELECT 
    user_id,
    full_name,
    email,
    role,
    phone,
    category,
    created_at,
    updated_at
FROM public.profiles 
WHERE role = 'employer'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if there are any users without profiles
SELECT 
    u.id,
    u.email,
    u.role,
    u.created_at,
    p.full_name,
    p.phone
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'employer'
ORDER BY u.created_at DESC
LIMIT 10;

-- 3. Check the structure of the profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check RLS policies on profiles table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public';



