-- Fix Database Columns for Task Submissions
-- Run this in Supabase Dashboard > SQL Editor

-- Add missing columns to task_submissions table
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS proof_type TEXT CHECK (proof_type IN ('text', 'file', 'both')) DEFAULT 'text';

ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS file_metadata JSONB;

-- Update existing records to set employer_id
UPDATE public.task_submissions 
SET employer_id = (
  SELECT t.created_by 
  FROM public.tasks t 
  WHERE t.id = task_submissions.task_id
)
WHERE employer_id IS NULL;

-- Update proof_type based on existing data
UPDATE public.task_submissions 
SET proof_type = CASE 
  WHEN proof_text IS NOT NULL AND proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'both'
  WHEN proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'file'
  ELSE 'text'
END;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);

-- Success message
SELECT 'Database columns added successfully!' as status;

