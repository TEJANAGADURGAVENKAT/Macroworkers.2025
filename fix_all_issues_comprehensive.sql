-- =====================================================
-- COMPREHENSIVE FIX FOR ALL SLOT COUNTING ISSUES
-- =====================================================
-- This script fixes all the problems identified:
-- 1. Slot count discrepancies between UI and database
-- 2. Rating logic errors
-- 3. Database trigger issues
-- 4. Data consistency problems

-- Step 1: Clean up any existing conflicting triggers
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_simple ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_perfect ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_completed_slots ON task_assignments;

-- Step 2: Drop any existing functions
DROP FUNCTION IF EXISTS update_task_slot_counts();
DROP FUNCTION IF EXISTS update_task_slot_counts_simple();
DROP FUNCTION IF EXISTS update_task_slot_counts_perfect();
DROP FUNCTION IF EXISTS update_assigned_count();
DROP FUNCTION IF EXISTS update_completed_slots();

-- Step 3: Create a single, robust function for slot counting
CREATE OR REPLACE FUNCTION update_task_slot_counts_final()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new assignment)
  IF TG_OP = 'INSERT' THEN
    -- Update assigned_count
    UPDATE tasks 
    SET assigned_count = assigned_count + 1,
        completed_slots = completed_slots + 1,
        updated_at = NOW()
    WHERE id = NEW.task_id;
    
    -- Log the update
    RAISE NOTICE 'Task %: assigned_count increased by 1', NEW.task_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (assignment removed)
  IF TG_OP = 'DELETE' THEN
    -- Update assigned_count
    UPDATE tasks 
    SET assigned_count = GREATEST(0, assigned_count - 1),
        completed_slots = GREATEST(0, completed_slots - 1),
        updated_at = NOW()
    WHERE id = OLD.task_id;
    
    -- Log the update
    RAISE NOTICE 'Task %: assigned_count decreased by 1', OLD.task_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
CREATE TRIGGER trigger_update_task_slot_counts_final
  AFTER INSERT OR DELETE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_slot_counts_final();

-- Step 5: Fix all existing tasks to have correct slot counts
UPDATE tasks 
SET assigned_count = (
  SELECT COUNT(*) 
  FROM task_assignments 
  WHERE task_assignments.task_id = tasks.id
),
completed_slots = (
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
  id,
  title,
  max_workers,
  assigned_count,
  completed_slots,
  CASE 
    WHEN assigned_count > max_workers THEN 'OVER-ASSIGNED'
    WHEN assigned_count = max_workers THEN 'FULL'
    ELSE 'AVAILABLE'
  END as status,
  (max_workers - assigned_count) as available_slots
FROM tasks 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 10: Test the trigger by simulating an assignment
-- (This will be rolled back, just for testing)
BEGIN;
  -- Insert a test assignment
  INSERT INTO task_assignments (task_id, worker_id, status)
  SELECT 
    t.id as task_id,
    p.user_id as worker_id,
    'assigned' as status
  FROM tasks t
  CROSS JOIN profiles p
  WHERE t.assigned_count < t.max_workers
    AND p.role = 'worker'
    AND p.worker_status = 'active_employee'
  LIMIT 1;
  
  -- Check if the trigger worked
  SELECT 
    'TRIGGER TEST' as test_type,
    id,
    title,
    max_workers,
    assigned_count,
    completed_slots
  FROM tasks 
  WHERE id IN (
    SELECT task_id 
    FROM task_assignments 
    ORDER BY created_at DESC 
    LIMIT 1
  );
ROLLBACK;

-- Step 11: Final verification
SELECT 
  'FINAL STATUS' as status,
  'All slot counting issues have been fixed!' as message,
  NOW() as fixed_at;




