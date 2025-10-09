-- Test storage access and RLS policies
-- Run this in your Supabase SQL editor

-- 1. Check if the employer-documents bucket exists
SELECT * FROM storage.buckets WHERE id = 'employer-documents';

-- 2. Check RLS policies on storage.objects for employer-documents
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%employer%';

-- 3. Test if we can query storage.objects (this should work for authenticated users)
SELECT COUNT(*) as total_files FROM storage.objects WHERE bucket_id = 'employer-documents';

-- 4. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 5. List any existing files in the bucket (if any)
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'employer-documents'
ORDER BY created_at DESC
LIMIT 10;



