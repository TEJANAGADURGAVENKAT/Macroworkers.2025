-- Add missing difficulty column to tasks table
-- This fixes the "Could not find the 'difficulty' column" error

BEGIN;

-- Add difficulty column to tasks table if it doesn't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON public.tasks(difficulty);

-- Update existing tasks with default difficulty
UPDATE public.tasks 
SET difficulty = 'easy'
WHERE difficulty IS NULL;

COMMIT;

