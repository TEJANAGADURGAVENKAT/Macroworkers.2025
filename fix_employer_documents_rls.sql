-- Fix RLS policies for employer-documents storage bucket
-- This script creates the necessary policies to allow employers to upload documents

BEGIN;

-- 1. Create the employer-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employer-documents',
  'employer-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy to allow employers to upload their own documents
CREATE POLICY "Employers can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employer'
  )
);

-- 4. Create policy to allow employers to view their own documents
CREATE POLICY "Employers can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employer'
  )
);

-- 5. Create policy to allow employers to delete their own documents
CREATE POLICY "Employers can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employer'
  )
);

-- 6. Create policy to allow admins to view all employer documents
CREATE POLICY "Admins can view all employer documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'employer-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 7. Create policy to allow admins to download all employer documents
CREATE POLICY "Admins can download all employer documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'employer-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 8. Update RLS policies for worker_documents table to allow employers
CREATE POLICY "Employers can insert their own documents" 
ON public.worker_documents 
FOR INSERT 
WITH CHECK (
  worker_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employer'
  )
);

CREATE POLICY "Employers can view their own documents" 
ON public.worker_documents 
FOR SELECT 
USING (
  worker_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employer'
  )
);

CREATE POLICY "Employers can update their own documents" 
ON public.worker_documents 
FOR UPDATE 
USING (
  worker_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employer'
  )
);

CREATE POLICY "Employers can delete their own documents" 
ON public.worker_documents 
FOR DELETE 
USING (
  worker_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employer'
  )
);

-- 9. Allow admins to view all worker_documents (for employer verification)
CREATE POLICY "Admins can view all worker documents" 
ON public.worker_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all worker documents" 
ON public.worker_documents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

COMMIT;



