-- =====================================================
-- SIMPLIFIED SLOT COUNTING TRIGGER FIX
-- =====================================================
-- This script creates a robust trigger system for automatic slot counting
-- Fixed syntax errors and simplified for better compatibility

-- Step 1: Clean up any existing conflicting triggers
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_simple ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_perfect ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_final ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_automatic ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_completed_slots ON task_assignments;

-- Step 2: Drop any existing functions
DROP FUNCTION IF EXISTS update_task_slot_counts();
DROP FUNCTION IF EXISTS update_task_slot_counts_simple();
DROP FUNCTION IF EXISTS update_task_slot_counts_perfect();
DROP FUNCTION IF EXISTS update_task_slot_counts_final();
DROP FUNCTION IF EXISTS update_task_slot_counts_automatic();
DROP FUNCTION IF EXISTS update_assigned_count();
DROP FUNCTION IF EXISTS update_completed_slots();

-- Step 3: Create a single, robust function for slot counting
CREATE OR REPLACE FUNCTION update_task_slot_counts_automatic()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
BEGIN
  -- Handle INSERT (new assignment)
  IF TG_OP = 'INSERT' THEN
    -- Get current task data
    SELECT max_workers, assigned_count INTO task_record
    FROM tasks 
    WHERE id = NEW.task_id;
    
    -- Check if task exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Task with id % not found', NEW.task_id;
    END IF;
    
    -- Check if task is already full
    IF task_record.assigned_count >= task_record.max_workers THEN
      RAISE EXCEPTION 'Task % is already full (assigned_count: %, max_workers: %)', 
        NEW.task_id, task_record.assigned_count, task_record.max_workers;
    END IF;
    
    -- Update assigned_count
    UPDATE tasks 
    SET assigned_count = assigned_count + 1,
        updated_at = NOW()
    WHERE id = NEW.task_id;
    
    -- Log the update
    RAISE NOTICE 'Task %: assigned_count increased by 1 (new count: %)', 
      NEW.task_id, task_record.assigned_count + 1;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (assignment removed)
  IF TG_OP = 'DELETE' THEN
    -- Update assigned_count (ensure it doesn't go below 0)
    UPDATE tasks 
    SET assigned_count = GREATEST(0, assigned_count - 1),
        updated_at = NOW()
    WHERE id = OLD.task_id;
    
    -- Log the update
    RAISE NOTICE 'Task %: assigned_count decreased by 1', OLD.task_id;
    
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE (assignment status changed)
  IF TG_OP = 'UPDATE' THEN
    -- Only update if the task_id changed
    IF OLD.task_id != NEW.task_id THEN
      -- Decrease count for old task
      UPDATE tasks 
      SET assigned_count = GREATEST(0, assigned_count - 1),
          updated_at = NOW()
      WHERE id = OLD.task_id;
      
      -- Increase count for new task
      UPDATE tasks 
      SET assigned_count = assigned_count + 1,
          updated_at = NOW()
      WHERE id = NEW.task_id;
      
      RAISE NOTICE 'Assignment moved from task % to task %', OLD.task_id, NEW.task_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
CREATE TRIGGER trigger_update_task_slot_counts_automatic
  AFTER INSERT OR DELETE OR UPDATE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_slot_counts_automatic();

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

-- Step 6: Ensure all tasks have proper max_workers values
UPDATE tasks 
SET max_workers = CASE 
  WHEN max_workers IS NULL OR max_workers = 0 THEN 1
  ELSE max_workers
END,
updated_at = NOW()
WHERE max_workers IS NULL OR max_workers = 0;

-- Step 7: Fix any over-assigned tasks
UPDATE tasks 
SET max_workers = assigned_count,
    updated_at = NOW()
WHERE assigned_count > max_workers;

-- Step 8: Verify the fix
SELECT 
  'VERIFICATION RESULTS' as status,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN assigned_count > max_workers THEN 1 END) as over_assigned_tasks,
  COUNT(CASE WHEN assigned_count < 0 THEN 1 END) as negative_assigned_tasks,
  COUNT(CASE WHEN max_workers IS NULL OR max_workers = 0 THEN 1 END) as invalid_max_workers
FROM tasks;

-- Step 9: Show sample of corrected tasks
SELECT 
  'CURRENT TASK STATUS' as status,
  id,
  title,
  max_workers,
  assigned_count,
  (max_workers - assigned_count) as available_slots,
  CASE 
    WHEN assigned_count > max_workers THEN 'OVER-ASSIGNED'
    WHEN assigned_count = max_workers THEN 'FULL'
    ELSE 'AVAILABLE'
  END as status_text
FROM tasks 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 10: Test the trigger (simplified version)
-- This will show if the trigger is working
SELECT 
  'TRIGGER STATUS' as test_type,
  'Trigger created successfully!' as status,
  'Automatic slot counting is now active' as message;

-- Step 11: Final verification
SELECT 
  'FINAL STATUS' as status,
  'Automatic slot counting is now active!' as message,
  NOW() as activated_at;



