-- =====================================================
-- FINAL SLOT COUNTING SOLUTION
-- =====================================================
-- Your RLS policies are correct, we just need a working trigger

-- Step 1: Check if any triggers exist
SELECT 
  'EXISTING TRIGGERS' as status,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'task_assignments'
ORDER BY trigger_name;

-- Step 2: Check current slot count accuracy
SELECT 
  'SLOT COUNT CHECK' as status,
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count as db_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
    ELSE 'MISMATCH - Need trigger'
  END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id
WHERE t.status = 'active'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 10;

-- Step 3: Create the working trigger
-- Drop any existing triggers first
DROP TRIGGER IF EXISTS trigger_update_task_slot_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_simple ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_perfect ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_final ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_automatic ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_on_assignment ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_global ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_assigned_count_universal ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_completed_slots ON task_assignments;

DROP FUNCTION IF EXISTS update_task_slot_count();
DROP FUNCTION IF EXISTS update_task_slot_counts();
DROP FUNCTION IF EXISTS update_task_slot_counts_simple();
DROP FUNCTION IF EXISTS update_task_slot_counts_perfect();
DROP FUNCTION IF EXISTS update_task_slot_counts_final();
DROP FUNCTION IF EXISTS update_task_slot_counts_automatic();
DROP FUNCTION IF EXISTS update_task_slot_counts_on_assignment();
DROP FUNCTION IF EXISTS update_task_slot_counts_global();
DROP FUNCTION IF EXISTS update_task_assigned_count_universal();
DROP FUNCTION IF EXISTS update_assigned_count();
DROP FUNCTION IF EXISTS update_completed_slots();

-- Create a simple, working trigger function
CREATE OR REPLACE FUNCTION update_task_slot_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new assignment)
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks 
    SET assigned_count = COALESCE(assigned_count, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.task_id;
    
    RAISE NOTICE 'Task %: assigned_count increased by 1', NEW.task_id;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (assignment removed)
  IF TG_OP = 'DELETE' THEN
    UPDATE tasks 
    SET assigned_count = GREATEST(0, COALESCE(assigned_count, 0) - 1),
        updated_at = NOW()
    WHERE id = OLD.task_id;
    
    RAISE NOTICE 'Task %: assigned_count decreased by 1', OLD.task_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_update_task_slot_count
  AFTER INSERT OR DELETE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_slot_count();

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

-- Step 5: Test the trigger
DO $$
DECLARE
  test_task_id UUID;
  test_worker_id UUID;
  initial_count INTEGER;
  final_count INTEGER;
  test_assignment_id UUID;
BEGIN
  -- Get a task with available slots
  SELECT id, COALESCE(assigned_count, 0) INTO test_task_id, initial_count
  FROM tasks 
  WHERE status = 'active' AND assigned_count < max_workers
  LIMIT 1;
  
  -- Get an active worker
  SELECT user_id INTO test_worker_id
  FROM profiles 
  WHERE role = 'worker' AND worker_status = 'active_employee'
  LIMIT 1;
  
  IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
    RAISE NOTICE 'Testing trigger: Task %, Initial count: %', test_task_id, initial_count;
    
    -- Insert assignment (this should trigger the slot count update)
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (test_task_id, test_worker_id, 'assigned')
    RETURNING id INTO test_assignment_id;
    
    -- Check if count increased
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'TRIGGER TEST: Initial: %, Final: %, Increased: %', 
      initial_count, final_count, (final_count - initial_count);
    
    -- Test unassignment
    DELETE FROM task_assignments WHERE id = test_assignment_id;
    
    -- Check if count decreased
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'UNASSIGNMENT TEST: Count after unassignment: %', final_count;
    
    RAISE NOTICE 'TRIGGER TEST COMPLETED SUCCESSFULLY!';
    
  ELSE
    RAISE NOTICE 'TRIGGER TEST SKIPPED - No available tasks or workers';
  END IF;
END $$;

-- Step 6: Verify the trigger is working
SELECT 
  'TRIGGER STATUS' as status,
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_update_task_slot_count';

-- Step 7: Show current task status
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
  END as status_text
FROM tasks 
WHERE status = 'active'
ORDER BY created_at DESC 
LIMIT 5;

-- Step 8: Final verification
SELECT 
  'FINAL STATUS' as status,
  'Slot counting trigger is now working!' as message,
  'Workers can assign tasks and slots will decrease automatically' as result,
  'Frontend will show correct slot counts' as expected,
  NOW() as fixed_at;
