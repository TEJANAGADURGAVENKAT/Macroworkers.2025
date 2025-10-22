-- Simple Database Trigger Check and Fix
-- This script avoids GROUP BY issues and focuses on the core problem

-- 1. Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments'
ORDER BY trigger_name;

-- 2. Check current task data (simplified)
SELECT 
  id,
  title,
  max_workers,
  assigned_count,
  created_at
FROM public.tasks 
WHERE max_workers > 0
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check task assignments
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

-- 4. Check for mismatches between assigned_count and actual assignments
SELECT 
  t.id,
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
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 10;

-- 5. Fix assigned_count manually for all tasks
UPDATE public.tasks 
SET assigned_count = (
  SELECT COUNT(*) 
  FROM public.task_assignments 
  WHERE task_id = tasks.id
);

-- 6. Verify the fix
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

-- 7. Drop and recreate triggers
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON public.task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit_unified ON public.task_assignments;

-- 8. Recreate the unified trigger function
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
    -- Handle status changes
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

-- 9. Recreate the limit check function
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

-- 10. Create triggers
CREATE TRIGGER trigger_update_assigned_count_unified
  AFTER INSERT OR UPDATE OR DELETE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assigned_count_unified();

CREATE TRIGGER trigger_check_assignment_limit_unified
  BEFORE INSERT ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_assignment_limit_unified();

-- 11. Verify triggers are working
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments'
ORDER BY trigger_name;

-- 12. Test trigger with a simple assignment (if you have test data)
-- This will show if the trigger is working
SELECT 
  id,
  title,
  max_workers,
  assigned_count
FROM public.tasks 
WHERE max_workers > COALESCE(assigned_count, 0)
ORDER BY created_at DESC
LIMIT 3;

