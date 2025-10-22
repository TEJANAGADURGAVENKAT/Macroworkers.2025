-- =====================================================
-- CHECK AND FIX EXISTING TRIGGER
-- =====================================================
-- This script checks if the existing trigger is working and fixes it if needed

-- Step 1: Check if the existing trigger is working
SELECT 
  'EXISTING TRIGGER CHECK' as status,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'task_assignments'
ORDER BY trigger_name;

-- Step 2: Check current task slot counts vs actual assignments
SELECT 
  'SLOT COUNT VERIFICATION' as status,
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count as db_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT - Trigger working'
    ELSE 'MISMATCH - Trigger not working'
  END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id
WHERE t.status = 'active'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 10;

-- Step 3: Test the existing trigger
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
    RAISE NOTICE 'Testing existing trigger: Task %, Initial count: %', test_task_id, initial_count;
    
    -- Insert assignment (this should trigger the slot count update)
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (test_task_id, test_worker_id, 'assigned')
    RETURNING id INTO test_assignment_id;
    
    -- Check if count increased
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'EXISTING TRIGGER TEST: Initial: %, Final: %, Increased: %', 
      initial_count, final_count, (final_count - initial_count);
    
    -- Test unassignment
    DELETE FROM task_assignments WHERE id = test_assignment_id;
    
    -- Check if count decreased
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'UNASSIGNMENT TEST: Count after unassignment: %', final_count;
    
    RAISE NOTICE 'EXISTING TRIGGER TEST COMPLETED!';
    
  ELSE
    RAISE NOTICE 'EXISTING TRIGGER TEST SKIPPED - No available tasks or workers';
  END IF;
END $$;

-- Step 4: If trigger is not working, fix it
DO $$
DECLARE
  trigger_exists BOOLEAN;
  trigger_working BOOLEAN;
BEGIN
  -- Check if trigger exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
      AND event_object_table = 'task_assignments'
      AND trigger_name = 'trigger_update_task_slot_count'
  ) INTO trigger_exists;
  
  -- Check if trigger is working by looking for mismatched data
  SELECT EXISTS(
    SELECT 1 FROM tasks t
    LEFT JOIN task_assignments ta ON ta.task_id = t.id
    WHERE t.status = 'active'
    GROUP BY t.id, t.assigned_count
    HAVING t.assigned_count != COUNT(ta.id)
    LIMIT 1
  ) INTO trigger_working;
  
  trigger_working := NOT trigger_working; -- Invert the logic
  
  IF trigger_exists AND trigger_working THEN
    RAISE NOTICE 'EXISTING TRIGGER IS WORKING CORRECTLY!';
  ELSE
    RAISE NOTICE 'EXISTING TRIGGER NEEDS TO BE FIXED';
    
    -- Drop and recreate the trigger
    DROP TRIGGER IF EXISTS trigger_update_task_slot_count ON task_assignments;
    DROP FUNCTION IF EXISTS update_task_slot_count();
    
    -- Create a simple trigger function
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
    
    RAISE NOTICE 'TRIGGER FIXED AND RECREATED!';
  END IF;
END $$;

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

-- Step 6: Final verification
SELECT 
  'FINAL STATUS' as status,
  'Trigger check and fix completed!' as message,
  'Slot counting should now work correctly' as result,
  NOW() as fixed_at;



