-- Fix worker validation error and add assignment limits properly
-- This migration fixes the validate_worker_selection function error

BEGIN;

-- Drop any existing problematic functions
DROP FUNCTION IF EXISTS validate_worker_selection() CASCADE;

-- Add new fields to tasks table if they don't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assignment_start_time TIME,
ADD COLUMN IF NOT EXISTS assignment_end_time TIME,
ADD COLUMN IF NOT EXISTS max_assignees INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_assignees INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignment_times ON public.tasks(assignment_start_time, assignment_end_time);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_limits ON public.tasks(max_assignees, current_assignees);

-- Create function to update current_assignees count
CREATE OR REPLACE FUNCTION update_task_assignee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'assigned' THEN
    -- Increment count when a new assignment is made
    UPDATE public.tasks 
    SET current_assignees = COALESCE(current_assignees, 0) + 1 
    WHERE id = NEW.task_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status = 'assigned' AND NEW.status != 'assigned' THEN
      -- Decrement when assignment is removed/changed
      UPDATE public.tasks 
      SET current_assignees = GREATEST(COALESCE(current_assignees, 0) - 1, 0) 
      WHERE id = NEW.task_id;
    ELSIF OLD.status != 'assigned' AND NEW.status = 'assigned' THEN
      -- Increment when status changes to assigned
      UPDATE public.tasks 
      SET current_assignees = COALESCE(current_assignees, 0) + 1 
      WHERE id = NEW.task_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'assigned' THEN
    -- Decrement when assigned submission is deleted
    UPDATE public.tasks 
    SET current_assignees = GREATEST(COALESCE(current_assignees, 0) - 1, 0) 
    WHERE id = OLD.task_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_assignee_count ON public.task_submissions;

-- Create trigger to automatically update assignee counts
CREATE TRIGGER trigger_update_assignee_count
  AFTER INSERT OR UPDATE OR DELETE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assignee_count();

-- Update current_assignees count for existing tasks
UPDATE public.tasks 
SET current_assignees = COALESCE((
  SELECT COUNT(*) 
  FROM public.task_submissions 
  WHERE task_id = tasks.id AND status = 'assigned'
), 0)
WHERE current_assignees IS NULL OR current_assignees = 0;

-- Create a simple validation function if needed (optional)
CREATE OR REPLACE FUNCTION validate_task_assignment(task_id_param UUID, worker_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  task_record RECORD;
  current_time TIME;
BEGIN
  -- Get task details
  SELECT * INTO task_record FROM public.tasks WHERE id = task_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check assignment time window
  IF task_record.assignment_start_time IS NOT NULL AND task_record.assignment_end_time IS NOT NULL THEN
    current_time := CURRENT_TIME;
    IF current_time < task_record.assignment_start_time OR current_time > task_record.assignment_end_time THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check worker limit
  IF task_record.max_assignees IS NOT NULL THEN
    IF COALESCE(task_record.current_assignees, 0) >= task_record.max_assignees THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMIT;
