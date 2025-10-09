-- Verification script to check if employer registration is working
-- Run this in your Supabase SQL editor

-- 1. Check if all users have profiles
SELECT 
    'Users without profiles' as check_type,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role IN ('employer', 'worker')

UNION ALL

-- 2. Check if all profiles have email addresses
SELECT 
    'Profiles without email' as check_type,
    COUNT(*) as count
FROM public.profiles p
WHERE p.email IS NULL OR p.email = ''

UNION ALL

-- 3. Check if all users have confirmed emails
SELECT 
    'Users with unconfirmed emails' as check_type,
    COUNT(*) as count
FROM auth.users u
WHERE u.email_confirmed_at IS NULL

UNION ALL

-- 4. Check employer profiles specifically
SELECT 
    'Employer profiles with correct status' as check_type,
    COUNT(*) as count
FROM public.profiles p
WHERE p.role = 'employer'
AND p.worker_status = 'verification_pending'
AND p.status = 'verification_pending';

-- 5. Show recent employer registrations
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.full_name,
    p.email as profile_email,
    p.role,
    p.worker_status,
    p.status,
    p.phone,
    p.category
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'employer'
ORDER BY u.created_at DESC
LIMIT 10;

-- 6. Check RLS policies on profiles table
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 7. Check if storage bucket exists
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'employer-documents';

-- 8. Check storage policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%employer%'
ORDER BY policyname;



