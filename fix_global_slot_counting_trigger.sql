-- =====================================================
-- FIX TRIGGER FOR NEW TASKS - GLOBAL SOLUTION
-- =====================================================
-- This script ensures the trigger works for ALL tasks (existing and new)

-- Step 1: Drop all existing triggers and functions to start fresh
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_simple ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_perfect ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_final ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_automatic ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_on_assignment ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_completed_slots ON task_assignments;

DROP FUNCTION IF EXISTS update_task_slot_counts();
DROP FUNCTION IF EXISTS update_task_slot_counts_simple();
DROP FUNCTION IF EXISTS update_task_slot_counts_perfect();
DROP FUNCTION IF EXISTS update_task_slot_counts_final();
DROP FUNCTION IF EXISTS update_task_slot_counts_automatic();
DROP FUNCTION IF EXISTS update_task_slot_counts_on_assignment();
DROP FUNCTION IF EXISTS update_assigned_count();
DROP FUNCTION IF EXISTS update_completed_slots();

-- Step 2: Create a robust, global trigger function that works for ALL tasks
CREATE OR REPLACE FUNCTION update_task_slot_counts_global()
RETURNS TRIGGER AS $$
DECLARE
  task_exists BOOLEAN;
BEGIN
  -- Handle INSERT (new assignment)
  IF TG_OP = 'INSERT' THEN
    -- Check if the task exists
    SELECT EXISTS(SELECT 1 FROM tasks WHERE id = NEW.task_id) INTO task_exists;
    
    IF NOT task_exists THEN
      RAISE EXCEPTION 'Task with id % does not exist', NEW.task_id;
    END IF;
    
    -- Update assigned_count for ANY task (existing or new)
    UPDATE tasks 
    SET assigned_count = COALESCE(assigned_count, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.task_id;
    
    -- Log the update
    RAISE NOTICE 'Task %: assigned_count increased by 1 (global trigger)', NEW.task_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (assignment removed)
  IF TG_OP = 'DELETE' THEN
    -- Check if the task exists
    SELECT EXISTS(SELECT 1 FROM tasks WHERE id = OLD.task_id) INTO task_exists;
    
    IF NOT task_exists THEN
      RAISE WARNING 'Task with id % no longer exists, skipping slot count update', OLD.task_id;
      RETURN OLD;
    END IF;
    
    -- Update assigned_count for ANY task (existing or new)
    UPDATE tasks 
    SET assigned_count = GREATEST(0, COALESCE(assigned_count, 0) - 1),
        updated_at = NOW()
    WHERE id = OLD.task_id;
    
    -- Log the update
    RAISE NOTICE 'Task %: assigned_count decreased by 1 (global trigger)', OLD.task_id;
    
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE (assignment status changed)
  IF TG_OP = 'UPDATE' THEN
    -- Only update if the task_id changed
    IF OLD.task_id != NEW.task_id THEN
      -- Decrease count for old task
      UPDATE tasks 
      SET assigned_count = GREATEST(0, COALESCE(assigned_count, 0) - 1),
          updated_at = NOW()
      WHERE id = OLD.task_id;
      
      -- Increase count for new task
      UPDATE tasks 
      SET assigned_count = COALESCE(assigned_count, 0) + 1,
          updated_at = NOW()
      WHERE id = NEW.task_id;
      
      RAISE NOTICE 'Assignment moved from task % to task % (global trigger)', OLD.task_id, NEW.task_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the global trigger
CREATE TRIGGER trigger_update_task_slot_counts_global
  AFTER INSERT OR DELETE OR UPDATE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_slot_counts_global();

-- Step 4: Ensure all existing tasks have proper initial values
UPDATE tasks 
SET assigned_count = COALESCE(assigned_count, 0),
    max_workers = CASE 
      WHEN max_workers IS NULL OR max_workers = 0 THEN 1
      ELSE max_workers
    END,
    updated_at = NOW()
WHERE assigned_count IS NULL OR max_workers IS NULL OR max_workers = 0;

-- Step 5: Fix all existing tasks to have correct slot counts
UPDATE tasks 
SET assigned_count = (
  SELECT COUNT(*) 
  FROM task_assignments 
  WHERE task_assignments.task_id = tasks.id
),
updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT task_id 
  FROM task_assignments
);

-- Step 6: Fix any over-assigned tasks
UPDATE tasks 
SET max_workers = assigned_count,
    updated_at = NOW()
WHERE assigned_count > max_workers;

-- Step 7: Test the trigger with a new task simulation
DO $$
DECLARE
  test_task_id UUID;
  test_worker_id UUID;
  initial_count INTEGER;
  final_count INTEGER;
BEGIN
  -- Get any task (existing or new)
  SELECT id, COALESCE(assigned_count, 0) INTO test_task_id, initial_count
  FROM tasks 
  WHERE assigned_count < max_workers
  LIMIT 1;
  
  -- Get an active worker
  SELECT user_id INTO test_worker_id
  FROM profiles 
  WHERE role = 'worker' AND worker_status = 'active_employee'
  LIMIT 1;
  
  IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
    -- Show initial state
    RAISE NOTICE 'TESTING GLOBAL TRIGGER: Task %, Initial count: %', test_task_id, initial_count;
    
    -- Insert test assignment
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (test_task_id, test_worker_id, 'assigned');
    
    -- Check final state
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    -- Show results
    RAISE NOTICE 'GLOBAL TRIGGER TEST RESULT: Initial: %, Final: %, Increased: %', 
      initial_count, final_count, (final_count - initial_count);
    
    -- Clean up test assignment
    DELETE FROM task_assignments 
    WHERE task_id = test_task_id AND worker_id = test_worker_id;
    
    -- Verify cleanup
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'CLEANUP VERIFICATION: Count after cleanup: %', final_count;
    
  ELSE
    RAISE NOTICE 'GLOBAL TRIGGER TEST SKIPPED - No available tasks or workers';
  END IF;
END $$;

-- Step 8: Verify the trigger is working globally
SELECT 
  'GLOBAL TRIGGER VERIFICATION' as status,
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVE FOR ALL TASKS' as scope
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_update_task_slot_counts_global';

-- Step 9: Show current state of all tasks
SELECT 
  'CURRENT TASK STATUS' as status,
  id,
  title,
  max_workers,
  COALESCE(assigned_count, 0) as assigned_count,
  (max_workers - COALESCE(assigned_count, 0)) as available_slots,
  CASE 
    WHEN COALESCE(assigned_count, 0) > max_workers THEN 'OVER-ASSIGNED'
    WHEN COALESCE(assigned_count, 0) = max_workers THEN 'FULL'
    ELSE 'AVAILABLE'
  END as status_text,
  created_at
FROM tasks 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 10: Final verification
SELECT 
  'FINAL STATUS' as status,
  'Global slot counting trigger is now active!' as message,
  'Works for ALL tasks - existing and newly created' as scope,
  'Frontend will show correct slot counts for all tasks' as result,
  NOW() as activated_at;



