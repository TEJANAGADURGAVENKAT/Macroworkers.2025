-- Fix Task Slots System - Comprehensive Solution
-- This script fixes the conflicting slot counting system

BEGIN;

-- 1. First, let's check what fields actually exist in the tasks table
-- We need to standardize on one field name for slot counting

-- 2. Drop all existing conflicting triggers
DROP TRIGGER IF EXISTS trigger_update_assignee_count ON public.task_submissions;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON public.task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON public.task_assignments;

-- 3. Standardize on 'assigned_count' field (remove current_assignees if it exists)
-- Keep only assigned_count and max_workers for consistency

-- 4. Create a unified function to update assigned_count
CREATE OR REPLACE FUNCTION update_task_assigned_count_unified()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when new assignment is made
    UPDATE public.tasks 
    SET assigned_count = COALESCE(assigned_count, 0) + 1 
    WHERE id = NEW.task_id;
    
    -- Log the update for debugging
    RAISE NOTICE 'Incremented assigned_count for task % to %', NEW.task_id, 
      (SELECT assigned_count FROM public.tasks WHERE id = NEW.task_id);
      
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when assignment is removed
    UPDATE public.tasks 
    SET assigned_count = GREATEST(COALESCE(assigned_count, 0) - 1, 0) 
    WHERE id = OLD.task_id;
    
    -- Log the update for debugging
    RAISE NOTICE 'Decremented assigned_count for task % to %', OLD.task_id, 
      (SELECT assigned_count FROM public.tasks WHERE id = OLD.task_id);
      
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes (if status field exists)
    IF OLD.status != NEW.status THEN
      -- If status changed from assigned to something else, decrement
      IF OLD.status = 'assigned' AND NEW.status != 'assigned' THEN
        UPDATE public.tasks 
        SET assigned_count = GREATEST(COALESCE(assigned_count, 0) - 1, 0) 
        WHERE id = NEW.task_id;
        
        RAISE NOTICE 'Decremented assigned_count for task % due to status change', NEW.task_id;
        
      -- If status changed to assigned, increment
      ELSIF OLD.status != 'assigned' AND NEW.status = 'assigned' THEN
        UPDATE public.tasks 
        SET assigned_count = COALESCE(assigned_count, 0) + 1 
        WHERE id = NEW.task_id;
        
        RAISE NOTICE 'Incremented assigned_count for task % due to status change', NEW.task_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for task_assignments table (the main assignment table)
CREATE TRIGGER trigger_update_assigned_count_unified
  AFTER INSERT OR UPDATE OR DELETE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assigned_count_unified();

-- 6. Create function to check assignment limits before insertion
CREATE OR REPLACE FUNCTION check_assignment_limit_unified()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Get current assignment count and max limit
  SELECT COALESCE(assigned_count, 0), COALESCE(max_workers, 1)
  INTO current_count, max_limit
  FROM public.tasks 
  WHERE id = NEW.task_id;
  
  -- Check if assignment would exceed limit
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Assignment limit exceeded. Task already has % workers assigned (max: %).', current_count, max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to enforce assignment limits
CREATE TRIGGER trigger_check_assignment_limit_unified
  BEFORE INSERT ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_assignment_limit_unified();

-- 8. Fix existing data - recalculate assigned_count for all tasks
UPDATE public.tasks 
SET assigned_count = COALESCE((
  SELECT COUNT(*) 
  FROM public.task_assignments 
  WHERE task_id = tasks.id
), 0);

-- 9. Ensure max_workers has a default value of 1 if NULL
UPDATE public.tasks 
SET max_workers = 1 
WHERE max_workers IS NULL OR max_workers = 0;

-- 10. Create a function to get task slot information
CREATE OR REPLACE FUNCTION get_task_slot_info(task_id_param UUID)
RETURNS TABLE (
  task_id UUID,
  max_workers INTEGER,
  assigned_count INTEGER,
  available_slots INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    COALESCE(t.max_workers, 1) as max_workers,
    COALESCE(t.assigned_count, 0) as assigned_count,
    GREATEST(0, COALESCE(t.max_workers, 1) - COALESCE(t.assigned_count, 0)) as available_slots
  FROM public.tasks t
  WHERE t.id = task_id_param;
END;
$$ LANGUAGE plpgsql;

-- 11. Create a function to validate task assignment
CREATE OR REPLACE FUNCTION validate_task_assignment_unified(
  task_id_param UUID, 
  worker_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  task_record RECORD;
  current_count INTEGER;
BEGIN
  -- Get task details
  SELECT * INTO task_record FROM public.tasks WHERE id = task_id_param;
  
  -- Check if task exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if worker is already assigned
  IF EXISTS (
    SELECT 1 FROM public.task_assignments 
    WHERE task_id = task_id_param AND worker_id = worker_id_param
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check assignment limits
  current_count := COALESCE(task_record.assigned_count, 0);
  IF task_record.max_workers IS NOT NULL AND current_count >= task_record.max_workers THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 12. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_worker ON public.task_assignments(task_id, worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_slot_info ON public.tasks(max_workers, assigned_count);

COMMIT;

-- 13. Test the system
DO $$
DECLARE
  test_task_id UUID;
  test_worker_id UUID;
  slot_info RECORD;
BEGIN
  -- Get a test task
  SELECT id INTO test_task_id FROM public.tasks LIMIT 1;
  
  IF test_task_id IS NOT NULL THEN
    -- Get slot info
    SELECT * INTO slot_info FROM get_task_slot_info(test_task_id);
    
    RAISE NOTICE 'Test Task Slot Info:';
    RAISE NOTICE 'Task ID: %', slot_info.task_id;
    RAISE NOTICE 'Max Workers: %', slot_info.max_workers;
    RAISE NOTICE 'Assigned Count: %', slot_info.assigned_count;
    RAISE NOTICE 'Available Slots: %', slot_info.available_slots;
  END IF;
END $$;

