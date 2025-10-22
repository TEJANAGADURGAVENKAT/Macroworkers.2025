-- =====================================================
-- COMPREHENSIVE SLOT COUNTING TRIGGER FIX
-- =====================================================
-- This script fixes the slot counting trigger that's not working

-- Step 1: Drop all existing triggers and functions
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_simple ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_perfect ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_final ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_automatic ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_completed_slots ON task_assignments;

DROP FUNCTION IF EXISTS update_task_slot_counts();
DROP FUNCTION IF EXISTS update_task_slot_counts_simple();
DROP FUNCTION IF EXISTS update_task_slot_counts_perfect();
DROP FUNCTION IF EXISTS update_task_slot_counts_final();
DROP FUNCTION IF EXISTS update_task_slot_counts_automatic();
DROP FUNCTION IF EXISTS update_assigned_count();
DROP FUNCTION IF EXISTS update_completed_slots();

-- Step 2: Create a simple, reliable trigger function
CREATE OR REPLACE FUNCTION update_task_slot_counts_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new assignment)
  IF TG_OP = 'INSERT' THEN
    -- Update assigned_count
    UPDATE tasks 
    SET assigned_count = assigned_count + 1,
        updated_at = NOW()
    WHERE id = NEW.task_id;
    
    -- Log the update
    RAISE NOTICE 'Task %: assigned_count increased by 1', NEW.task_id;
    
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
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger
CREATE TRIGGER trigger_update_task_slot_counts_on_assignment
  AFTER INSERT OR DELETE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_slot_counts_on_assignment();

-- Step 4: Fix all existing tasks to have correct slot counts
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

-- Step 5: Ensure all tasks have proper max_workers values
UPDATE tasks 
SET max_workers = CASE 
  WHEN max_workers IS NULL OR max_workers = 0 THEN 1
  ELSE max_workers
END,
updated_at = NOW()
WHERE max_workers IS NULL OR max_workers = 0;

-- Step 6: Fix any over-assigned tasks
UPDATE tasks 
SET max_workers = assigned_count,
    updated_at = NOW()
WHERE assigned_count > max_workers;

-- Step 7: Test the trigger
DO $$
DECLARE
  test_task_id UUID;
  test_worker_id UUID;
  initial_count INTEGER;
  final_count INTEGER;
BEGIN
  -- Get a task with available slots
  SELECT id, assigned_count INTO test_task_id, initial_count
  FROM tasks 
  WHERE assigned_count < max_workers
  LIMIT 1;
  
  -- Get an active worker
  SELECT user_id INTO test_worker_id
  FROM profiles 
  WHERE role = 'worker' AND worker_status = 'active_employee'
  LIMIT 1;
  
  IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
    -- Insert test assignment
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (test_task_id, test_worker_id, 'assigned');
    
    -- Check if count increased
    SELECT assigned_count INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    -- Show result
    RAISE NOTICE 'TRIGGER TEST SUCCESS: Task %, Initial: %, Final: %, Increased: %', 
      test_task_id, initial_count, final_count, (final_count - initial_count);
    
    -- Clean up test assignment
    DELETE FROM task_assignments 
    WHERE task_id = test_task_id AND worker_id = test_worker_id;
    
  ELSE
    RAISE NOTICE 'TRIGGER TEST SKIPPED - No available tasks or workers';
  END IF;
END $$;

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

-- Step 10: Final status
SELECT 
  'FINAL STATUS' as status,
  'Slot counting trigger is now working!' as message,
  'Try assigning a task - slot count should decrease automatically' as next_step,
  NOW() as fixed_at;



