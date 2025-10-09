-- Test authentication and user creation
-- Run this in your Supabase SQL editor

-- 1. Check recent user registrations
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'phone' as phone
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if profiles exist for these users
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.email as profile_email,
    p.role as profile_role,
    p.phone as profile_phone
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- 3. Check for any authentication errors in logs (if available)
-- Note: This might not be available in all Supabase plans
SELECT 
    event_type,
    created_at,
    metadata
FROM auth.audit_log_entries 
WHERE event_type IN ('user_signedup', 'user_signedin', 'user_confirmed')
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if there are any users with missing profiles
SELECT 
    u.id,
    u.email,
    u.role,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC;



