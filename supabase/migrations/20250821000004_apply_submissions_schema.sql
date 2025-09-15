-- Apply submissions schema changes (without storage bucket)
BEGIN;

-- Add employer_id column to task_submissions for better querying
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update existing records to set employer_id based on task creator
UPDATE public.task_submissions 
SET employer_id = (
  SELECT t.created_by 
  FROM public.tasks t 
  WHERE t.id = task_submissions.task_id
)
WHERE employer_id IS NULL;

-- Make employer_id NOT NULL after populating
ALTER TABLE public.task_submissions 
ALTER COLUMN employer_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);

-- Add proof_type column to distinguish between text and file proofs
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS proof_type TEXT CHECK (proof_type IN ('text', 'file', 'both')) DEFAULT 'text';

-- Update proof_type based on existing data
UPDATE public.task_submissions 
SET proof_type = CASE 
  WHEN proof_text IS NOT NULL AND proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'both'
  WHEN proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'file'
  ELSE 'text'
END;

-- Add file metadata column for better file handling
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS file_metadata JSONB;

-- Add function to automatically set employer_id on insert
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

-- Create trigger to automatically set employer_id
DROP TRIGGER IF EXISTS set_submission_employer_id_trigger ON public.task_submissions;
CREATE TRIGGER set_submission_employer_id_trigger
  BEFORE INSERT ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_submission_employer_id();

COMMIT;
