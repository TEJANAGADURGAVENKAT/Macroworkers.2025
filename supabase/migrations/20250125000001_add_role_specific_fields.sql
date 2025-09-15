-- Add role-specific fields to tasks table
-- This migration adds fields to support role-based task creation

BEGIN;

-- Add role-specific fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS role_specific TEXT,
ADD COLUMN IF NOT EXISTS role_category TEXT,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_role_specific ON public.tasks(role_specific);
CREATE INDEX IF NOT EXISTS idx_tasks_role_category ON public.tasks(role_category);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);

-- Update existing tasks with default values if needed
UPDATE public.tasks 
SET 
  role_specific = 'General',
  role_category = 'General'
WHERE role_specific IS NULL OR role_category IS NULL;

COMMIT;

