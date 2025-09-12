-- Complete Setup for File Upload/View System
-- Run this in Supabase Dashboard > SQL Editor

BEGIN;

-- 1. Create storage bucket for submission files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'submission-files', 
  'submission-files', 
  false, 
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Add missing columns to task_submissions table
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS proof_type TEXT CHECK (proof_type IN ('text', 'file', 'both')) DEFAULT 'text';

ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS file_metadata JSONB;

-- 3. Update existing records to set employer_id
UPDATE public.task_submissions 
SET employer_id = (
  SELECT t.created_by 
  FROM public.tasks t 
  WHERE t.id = task_submissions.task_id
)
WHERE employer_id IS NULL;

-- 4. Update proof_type based on existing data
UPDATE public.task_submissions 
SET proof_type = CASE 
  WHEN proof_text IS NOT NULL AND proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'both'
  WHEN proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'file'
  ELSE 'text'
END;

-- 5. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);

COMMIT;

-- Success message
SELECT 'Database setup completed successfully! Now create storage policies manually.' as status;
