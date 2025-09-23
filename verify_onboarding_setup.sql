-- Verification Script for Worker Onboarding System
-- Run this after the main setup to verify everything is working

-- Check if tables exist
SELECT 
  table_name,
  CASE WHEN table_name IN (
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES 
  ('worker_documents'),
  ('worker_interviews'), 
  ('worker_status_logs')
) AS t(table_name);

-- Check if worker_status column exists in profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'worker_status';

-- Check if storage bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'worker-documents';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('worker_documents', 'worker_interviews', 'worker_status_logs')
ORDER BY tablename, policyname;

-- Check storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%worker%'
ORDER BY policyname;

-- Check indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('worker_documents', 'worker_interviews', 'worker_status_logs', 'profiles')
  AND indexname LIKE '%worker%'
ORDER BY tablename, indexname;

-- Check functions and triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  trigger_schema,
  trigger_name
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE '%worker%';

-- Test data insertion (optional - will fail if user doesn't exist)
-- INSERT INTO public.worker_documents (
--   worker_id,
--   document_type,
--   file_name,
--   file_path
-- ) VALUES (
--   auth.uid(),
--   '10th_certificate',
--   'test_certificate.pdf',
--   'test_path/test_certificate.pdf'
-- );

SELECT 'Setup verification complete!' as message;
