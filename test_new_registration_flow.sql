-- Test new registration flow
-- Run this in your Supabase SQL editor

-- 1. Check recent registrations (last 10 minutes)
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'email' as meta_email
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY u.created_at DESC;

-- 2. Check if profiles exist for recent users
SELECT 
    u.id,
    u.email as auth_email,
    u.created_at,
    p.full_name,
    p.email as profile_email,
    p.role as profile_role,
    p.phone as profile_phone,
    p.worker_status,
    p.status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY u.created_at DESC;

-- 3. Check for any missing profiles in recent registrations
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'role' as role,
    u.created_at,
    'No profile exists' as issue
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY u.created_at DESC;



