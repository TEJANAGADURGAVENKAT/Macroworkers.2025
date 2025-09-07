-- Create submission-files storage bucket
-- This bucket will store worker submission files

BEGIN;

-- Create the storage bucket for submission files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-files',
  'submission-files',
  false,
  10485760, -- 10MB limit
  ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the submission-files bucket
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

COMMIT;
