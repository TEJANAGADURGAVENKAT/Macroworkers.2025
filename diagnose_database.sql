-- Diagnose what's actually in the database
-- Run this in your Supabase SQL editor

-- 1. Check if there are any users at all
SELECT 
    'Total users in auth.users' as check_type,
    COUNT(*) as count
FROM auth.users

UNION ALL

-- 2. Check users by role
SELECT 
    'Users by role: ' || role as check_type,
    COUNT(*) as count
FROM auth.users
GROUP BY role

UNION ALL

-- 3. Check if there are any profiles at all
SELECT 
    'Total profiles in public.profiles' as check_type,
    COUNT(*) as count
FROM public.profiles

UNION ALL

-- 4. Check profiles by role
SELECT 
    'Profiles by role: ' || role as check_type,
    COUNT(*) as count
FROM public.profiles
GROUP BY role;

-- 5. Show all users with their details
SELECT 
    u.id,
    u.email,
    u.role,
    u.email_confirmed_at,
    u.created_at,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'phone' as phone
FROM auth.users u
ORDER BY u.created_at DESC;

-- 6. Show all profiles with their details
SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email,
    p.role,
    p.phone,
    p.worker_status,
    p.status,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;

-- 7. Check for users without profiles
SELECT 
    u.id,
    u.email,
    u.role,
    u.created_at,
    'No profile exists' as issue
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC;



