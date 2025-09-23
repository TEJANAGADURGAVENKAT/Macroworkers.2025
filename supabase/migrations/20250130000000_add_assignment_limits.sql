-- Add assignment time restrictions and worker limits to tasks table
-- This migration adds fields to support time-based assignments and worker limits

BEGIN;

-- Add new fields to tasks table
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
    SET current_assignees = current_assignees + 1 
    WHERE id = NEW.task_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status = 'assigned' AND NEW.status != 'assigned' THEN
      -- Decrement when assignment is removed/changed
      UPDATE public.tasks 
      SET current_assignees = GREATEST(current_assignees - 1, 0) 
      WHERE id = NEW.task_id;
    ELSIF OLD.status != 'assigned' AND NEW.status = 'assigned' THEN
      -- Increment when status changes to assigned
      UPDATE public.tasks 
      SET current_assignees = current_assignees + 1 
      WHERE id = NEW.task_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'assigned' THEN
    -- Decrement when assigned submission is deleted
    UPDATE public.tasks 
    SET current_assignees = GREATEST(current_assignees - 1, 0) 
    WHERE id = OLD.task_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update assignee counts
DROP TRIGGER IF EXISTS trigger_update_assignee_count ON public.task_submissions;
CREATE TRIGGER trigger_update_assignee_count
  AFTER INSERT OR UPDATE OR DELETE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assignee_count();

-- Update current_assignees count for existing tasks
UPDATE public.tasks 
SET current_assignees = (
  SELECT COUNT(*) 
  FROM public.task_submissions 
  WHERE task_id = tasks.id AND status = 'assigned'
)
WHERE current_assignees = 0;

COMMIT;
