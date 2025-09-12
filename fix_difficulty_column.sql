-- Quick fix for missing difficulty column in tasks table
-- Run this directly in your Supabase SQL editor to fix the immediate issue

-- Add difficulty column to tasks table if it doesn't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON public.tasks(difficulty);

-- Update existing tasks with default difficulty
UPDATE public.tasks 
SET difficulty = 'easy'
WHERE difficulty IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'difficulty';

