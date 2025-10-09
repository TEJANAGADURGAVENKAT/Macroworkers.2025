-- Test script to verify employer-documents bucket setup
-- Run this in your Supabase SQL editor to check if everything is working

-- 1. Check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'employer-documents';

-- 2. Check RLS policies on storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Check if RLS is enabled on storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Test query to see if we can access the bucket (this should work for authenticated users)
SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'employer-documents';

-- 5. Check profiles table structure for employers
SELECT user_id, full_name, email, role, worker_status, status 
FROM public.profiles 
WHERE role = 'employer' 
LIMIT 5;



