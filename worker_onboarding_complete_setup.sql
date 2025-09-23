-- Worker Onboarding System Complete Setup
-- This creates all necessary tables, columns, storage buckets, and policies
-- Run this in your Supabase SQL Editor

BEGIN;

-- Add worker_status column to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS worker_status TEXT 
CHECK (worker_status IN ('document_upload_pending', 'verification_pending', 'interview_pending', 'active_employee', 'rejected')) 
DEFAULT 'document_upload_pending';

-- Create worker_documents table for storing uploaded documents
CREATE TABLE IF NOT EXISTS public.worker_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('10th_certificate', '12th_certificate', 'graduation_certificate', 'resume', 'kyc_document')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  upload_status TEXT NOT NULL CHECK (upload_status IN ('uploading', 'uploaded', 'failed')) DEFAULT 'uploaded',
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  verification_notes TEXT,
  verified_by UUID REFERENCES public.profiles(user_id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create worker_interviews table for scheduling interviews
CREATE TABLE IF NOT EXISTS public.worker_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'offline')) DEFAULT 'online',
  meeting_link TEXT,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
  result TEXT CHECK (result IN ('selected', 'rejected', 'pending')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create worker_status_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.worker_status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for worker documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'worker-documents',
  'worker-documents',
  false,
  20971520, -- 20MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.worker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_status_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for worker_documents
CREATE POLICY "Workers can view their own documents" 
ON public.worker_documents 
FOR SELECT 
USING (auth.uid() = worker_id);

CREATE POLICY "Workers can insert their own documents" 
ON public.worker_documents 
FOR INSERT 
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can update their own documents" 
ON public.worker_documents 
FOR UPDATE 
USING (auth.uid() = worker_id);

CREATE POLICY "Employers can view worker documents for verification" 
ON public.worker_documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'employer'
));

CREATE POLICY "Employers can update document verification status" 
ON public.worker_documents 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'employer'
));

CREATE POLICY "Admins can view all documents" 
ON public.worker_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- RLS Policies for worker_interviews
CREATE POLICY "Workers can view their own interviews" 
ON public.worker_interviews 
FOR SELECT 
USING (auth.uid() = worker_id);

CREATE POLICY "Employers can view interviews they created" 
ON public.worker_interviews 
FOR SELECT 
USING (auth.uid() = employer_id);

CREATE POLICY "Employers can manage interviews" 
ON public.worker_interviews 
FOR ALL 
USING (auth.uid() = employer_id);

CREATE POLICY "Admins can view all interviews" 
ON public.worker_interviews 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- RLS Policies for worker_status_logs
CREATE POLICY "Workers can view their own status logs" 
ON public.worker_status_logs 
FOR SELECT 
USING (auth.uid() = worker_id);

CREATE POLICY "Employers and admins can view status logs" 
ON public.worker_status_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role IN ('employer', 'admin')
));

CREATE POLICY "Employers and admins can insert status logs" 
ON public.worker_status_logs 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role IN ('employer', 'admin')
));

-- Storage policies for worker-documents bucket
CREATE POLICY "Workers can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'worker-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Workers can view their own document files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'worker-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Employers can view worker document files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'worker-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'employer'
  )
);

CREATE POLICY "Admins can view all worker document files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'worker-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_worker_documents_worker_id ON public.worker_documents(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_documents_document_type ON public.worker_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_worker_documents_verification_status ON public.worker_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_worker_interviews_worker_id ON public.worker_interviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_interviews_employer_id ON public.worker_interviews(employer_id);
CREATE INDEX IF NOT EXISTS idx_worker_interviews_status ON public.worker_interviews(status);
CREATE INDEX IF NOT EXISTS idx_profiles_worker_status ON public.profiles(worker_status);
CREATE INDEX IF NOT EXISTS idx_worker_status_logs_worker_id ON public.worker_status_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_status_logs_created_at ON public.worker_status_logs(created_at);

-- Function to update worker status based on document verification
CREATE OR REPLACE FUNCTION update_worker_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all required documents are uploaded and approved
  IF (SELECT COUNT(*) FROM public.worker_documents 
      WHERE worker_id = NEW.worker_id 
      AND document_type IN ('10th_certificate', '12th_certificate', 'graduation_certificate', 'resume', 'kyc_document')
      AND verification_status = 'approved') = 5 THEN
    
    -- All documents approved, move to interview pending
    UPDATE public.profiles 
    SET worker_status = 'interview_pending', updated_at = now()
    WHERE user_id = NEW.worker_id;
    
  ELSIF (SELECT COUNT(*) FROM public.worker_documents 
         WHERE worker_id = NEW.worker_id 
         AND verification_status = 'rejected') > 0 THEN
    
    -- Some documents rejected, keep in verification pending
    UPDATE public.profiles 
    SET worker_status = 'verification_pending', updated_at = now()
    WHERE user_id = NEW.worker_id;
    
  ELSIF (SELECT COUNT(*) FROM public.worker_documents 
         WHERE worker_id = NEW.worker_id 
         AND document_type IN ('10th_certificate', '12th_certificate', 'graduation_certificate', 'resume', 'kyc_document')) = 5 THEN
    
    -- All documents uploaded, move to verification pending
    UPDATE public.profiles 
    SET worker_status = 'verification_pending', updated_at = now()
    WHERE user_id = NEW.worker_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update worker status
DROP TRIGGER IF EXISTS trigger_update_worker_status ON public.worker_documents;
CREATE TRIGGER trigger_update_worker_status
  AFTER INSERT OR UPDATE ON public.worker_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_status();

-- Function to update worker status after interview
CREATE OR REPLACE FUNCTION update_worker_status_after_interview()
RETURNS TRIGGER AS $$
BEGIN
  -- If interview result is 'selected', make worker active
  IF NEW.result = 'selected' THEN
    UPDATE public.profiles 
    SET worker_status = 'active_employee', updated_at = now()
    WHERE user_id = NEW.worker_id;
  ELSIF NEW.result = 'rejected' THEN
    UPDATE public.profiles 
    SET worker_status = 'rejected', updated_at = now()
    WHERE user_id = NEW.worker_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for interview results
DROP TRIGGER IF EXISTS trigger_update_worker_status_after_interview ON public.worker_interviews;
CREATE TRIGGER trigger_update_worker_status_after_interview
  AFTER UPDATE ON public.worker_interviews
  FOR EACH ROW
  WHEN (NEW.result IS DISTINCT FROM OLD.result)
  EXECUTE FUNCTION update_worker_status_after_interview();

-- Update existing worker profiles to have the default worker_status
UPDATE public.profiles 
SET worker_status = 'document_upload_pending' 
WHERE role = 'worker' AND worker_status IS NULL;

-- Update existing active workers to have active_employee status (optional - adjust as needed)
-- Uncomment the line below if you want existing workers to be considered active
-- UPDATE public.profiles SET worker_status = 'active_employee' WHERE role = 'worker' AND worker_status = 'document_upload_pending';

COMMIT;
