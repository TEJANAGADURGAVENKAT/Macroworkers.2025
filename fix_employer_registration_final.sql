-- Final fix for employer registration issues based on your schema
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Check current RLS policies on profiles table
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 2. Drop existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- 3. Create new RLS policies for profiles table
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

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create profiles for existing users who don't have them
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, worker_status, status, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    u.email,
    u.role,
    COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
    COALESCE(u.raw_user_meta_data->>'category', '') as category,
    CASE 
        WHEN u.role = 'employer' THEN 'verification_pending'
        ELSE 'document_upload_pending'
    END as worker_status,
    CASE 
        WHEN u.role = 'employer' THEN 'verification_pending'
        ELSE 'document_upload_pending'
    END as status,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role IN ('employer', 'worker')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Update existing profiles with missing email addresses
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '');

-- 6. Update employer profiles to have correct status
UPDATE public.profiles 
SET 
    worker_status = 'verification_pending',
    status = 'verification_pending',
    updated_at = now()
WHERE role = 'employer'
AND (worker_status IS NULL OR status IS NULL);

-- 7. Confirm emails for existing users
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 8. Create employer-documents storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employer-documents',
  'employer-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 9. Drop existing storage policies (to avoid conflicts)
DROP POLICY IF EXISTS "Allow employers to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow employers to view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow employers to delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to access all employer documents" ON storage.objects;

-- 10. Create new RLS policies for storage.objects
CREATE POLICY "Allow employers to upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow employers to view their documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow employers to delete their documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow admins to access all employer documents" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'employer-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

COMMIT;



