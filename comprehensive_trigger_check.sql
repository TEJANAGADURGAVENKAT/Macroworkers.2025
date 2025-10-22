-- Comprehensive Database Trigger Check and Fix
-- This script checks if triggers are working and fixes any issues

-- 1. Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('task_assignments', 'tasks')
ORDER BY event_object_table, trigger_name;

-- 2. Check current task assignment data
SELECT 
  ta.task_id,
  t.title,
  t.max_workers,
  t.assigned_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as status_check
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
WHERE t.max_workers > 0
GROUP BY ta.task_id, t.title, t.max_workers, t.assigned_count, t.created_at
ORDER BY t.created_at DESC
LIMIT 10;

-- 3. Check specific task assignments
SELECT 
  ta.id,
  ta.task_id,
  t.title,
  ta.worker_id,
  p.full_name as worker_name,
  ta.status,
  ta.assigned_at
FROM public.task_assignments ta
JOIN public.tasks t ON ta.task_id = t.id
JOIN public.profiles p ON ta.worker_id = p.user_id
ORDER BY ta.assigned_at DESC
LIMIT 10;

-- 4. Test trigger functionality by manually updating assigned_count
-- First, let's see what happens when we manually update a task
UPDATE public.tasks 
SET assigned_count = (
  SELECT COUNT(*) 
  FROM public.task_assignments 
  WHERE task_id = tasks.id
)
WHERE id IN (
  SELECT id FROM public.tasks 
  WHERE max_workers > 0 
  LIMIT 5
);

-- 5. Check if the manual update worked
SELECT 
  id,
  title,
  max_workers,
  assigned_count,
  (SELECT COUNT(*) FROM public.task_assignments WHERE task_id = tasks.id) as actual_count
FROM public.tasks 
WHERE max_workers > 0
ORDER BY created_at DESC
LIMIT 5;

-- 6. Drop and recreate triggers to ensure they work
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON public.task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit_unified ON public.task_assignments;

-- 7. Recreate the unified trigger function
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

-- 8. Recreate the limit check function
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

-- 9. Create triggers
CREATE TRIGGER trigger_update_assigned_count_unified
  AFTER INSERT OR UPDATE OR DELETE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assigned_count_unified();

CREATE TRIGGER trigger_check_assignment_limit_unified
  BEFORE INSERT ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_assignment_limit_unified();

-- 10. Test the trigger by inserting a test assignment
-- First, let's find a task with available slots
SELECT 
  id,
  title,
  max_workers,
  assigned_count,
  (max_workers - COALESCE(assigned_count, 0)) as available_slots
FROM public.tasks 
WHERE max_workers > COALESCE(assigned_count, 0)
ORDER BY created_at DESC
LIMIT 3;

-- 11. Verify triggers are working
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments'
ORDER BY trigger_name;
