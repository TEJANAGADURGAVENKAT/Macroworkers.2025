-- Fix ambiguous column reference error in task assignment
-- This script resolves the 'max_assignees' ambiguous column issue

BEGIN;

-- 1. Drop existing problematic triggers and functions
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON public.task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON public.task_assignments;
DROP FUNCTION IF EXISTS check_assignment_limit() CASCADE;
DROP FUNCTION IF EXISTS update_task_assigned_count() CASCADE;

-- 2. Create a clean function to check assignment limits with explicit table references
CREATE OR REPLACE FUNCTION check_assignment_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Get current assignment count and max limit with explicit table reference
  SELECT t.assigned_count, t.max_workers 
  INTO current_count, max_limit
  FROM public.tasks t
  WHERE t.id = NEW.task_id;
  
  -- Check if assignment would exceed limit
  IF max_limit IS NOT NULL AND COALESCE(current_count, 0) >= max_limit THEN
    RAISE EXCEPTION 'Assignment limit exceeded. Maximum % workers allowed for this task.', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a clean function to update assigned_count with explicit table references
CREATE OR REPLACE FUNCTION update_task_assigned_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when new assignment is made
    UPDATE public.tasks t
    SET assigned_count = COALESCE(t.assigned_count, 0) + 1 
    WHERE t.id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when assignment is removed
    UPDATE public.tasks t
    SET assigned_count = GREATEST(COALESCE(t.assigned_count, 0) - 1, 0) 
    WHERE t.id = OLD.task_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate triggers with proper function references
CREATE TRIGGER trigger_check_assignment_limit
  BEFORE INSERT ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_assignment_limit();

CREATE TRIGGER trigger_update_assigned_count
  AFTER INSERT OR DELETE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assigned_count();

-- 5. Ensure all tasks have proper assigned_count values
UPDATE public.tasks t
SET assigned_count = (
  SELECT COUNT(*) 
  FROM public.task_assignments ta 
  WHERE ta.task_id = t.id AND ta.status = 'assigned'
)
WHERE t.assigned_count IS NULL OR t.assigned_count = 0;

COMMIT;
