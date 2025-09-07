-- Ensure task_submissions table has rating fields
-- Run this in your Supabase SQL editor to add missing rating fields

-- Add rating fields to task_submissions table if they don't exist
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS employer_rating_given DECIMAL(3,2) CHECK (employer_rating_given >= 1.00 AND employer_rating_given <= 5.00),
ADD COLUMN IF NOT EXISTS rating_feedback TEXT;

-- Verify the columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_submissions' 
AND column_name IN ('employer_rating_given', 'rating_feedback')
ORDER BY column_name;

