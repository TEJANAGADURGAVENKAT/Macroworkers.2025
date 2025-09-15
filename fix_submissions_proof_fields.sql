-- Ensure task_submissions table has proof fields
-- Run this in your Supabase SQL editor to add missing proof fields

-- Add proof fields to task_submissions table if they don't exist
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS proof_text TEXT,
ADD COLUMN IF NOT EXISTS proof_files TEXT[];

-- Verify the columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_submissions' 
AND column_name IN ('proof_text', 'proof_files')
ORDER BY column_name;

