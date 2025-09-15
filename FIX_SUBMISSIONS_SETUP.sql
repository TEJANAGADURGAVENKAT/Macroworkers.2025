-- Complete fix for submissions system
-- Run this in your Supabase Dashboard > SQL Editor

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

-- 2. Add storage policies for submission files
-- Workers can upload their own files
CREATE POLICY "Workers can upload submission files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'submission-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Workers can view their own files
CREATE POLICY "Workers can view their own submission files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submission-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Employers can view submission files for their tasks
CREATE POLICY "Employers can view submission files for their tasks" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submission-files' 
  AND EXISTS (
    SELECT 1 FROM public.task_submissions ts
    JOIN public.tasks t ON ts.task_id = t.id
    WHERE t.created_by = auth.uid() 
    AND ts.proof_files @> ARRAY[name]
  )
);

-- Admins can view all submission files
CREATE POLICY "Admins can view all submission files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submission-files' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- 3. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Add employer_id column to task_submissions
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 5. Update existing records to set employer_id
UPDATE public.task_submissions 
SET employer_id = (
  SELECT t.created_by 
  FROM public.tasks t 
  WHERE t.id = task_submissions.task_id
)
WHERE employer_id IS NULL;

-- 6. Make employer_id NOT NULL after populating
ALTER TABLE public.task_submissions 
ALTER COLUMN employer_id SET NOT NULL;

-- 7. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);

-- 8. Add proof_type column
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS proof_type TEXT CHECK (proof_type IN ('text', 'file', 'both')) DEFAULT 'text';

-- 9. Update proof_type based on existing data
UPDATE public.task_submissions 
SET proof_type = CASE 
  WHEN proof_text IS NOT NULL AND proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'both'
  WHEN proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'file'
  ELSE 'text'
END;

-- 10. Add file metadata column
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS file_metadata JSONB;

-- 11. Create function to automatically set employer_id
CREATE OR REPLACE FUNCTION public.set_submission_employer_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT t.created_by INTO NEW.employer_id
  FROM public.tasks t
  WHERE t.id = NEW.task_id;
  
  -- Set proof_type based on provided data
  NEW.proof_type = CASE 
    WHEN NEW.proof_text IS NOT NULL AND NEW.proof_files IS NOT NULL AND array_length(NEW.proof_files, 1) > 0 THEN 'both'
    WHEN NEW.proof_files IS NOT NULL AND array_length(NEW.proof_files, 1) > 0 THEN 'file'
    ELSE 'text'
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically set employer_id
DROP TRIGGER IF EXISTS set_submission_employer_id_trigger ON public.task_submissions;
CREATE TRIGGER set_submission_employer_id_trigger
  BEFORE INSERT ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_submission_employer_id();

COMMIT;

-- Success message
SELECT 'Submissions system setup completed successfully!' as status;
