-- Fix storage RLS policies for proper file access

BEGIN;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Workers can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Workers can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Task creators can view submission files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all submission files" ON storage.objects;

-- Create improved policies
-- Workers can upload files to their own folder
CREATE POLICY "Workers can upload files to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'submission-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Workers can view their own files
CREATE POLICY "Workers can view their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'submission-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Task creators (employers) can view files for tasks they created
CREATE POLICY "Task creators can view submission files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'submission-files' AND 
  EXISTS (
    SELECT 1 FROM public.task_submissions ts
    JOIN public.tasks t ON ts.task_id = t.id
    WHERE t.created_by = auth.uid() AND 
          ts.worker_id::text = (storage.foldername(name))[1]
  )
);

-- Admins can view all files
CREATE POLICY "Admins can view all submission files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'submission-files' AND 
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Allow authenticated users to view files (for debugging and testing)
CREATE POLICY "Authenticated users can view submission files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'submission-files' AND 
  auth.role() = 'authenticated'
);

COMMIT;
