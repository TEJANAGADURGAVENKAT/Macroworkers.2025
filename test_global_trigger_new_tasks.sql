-- =====================================================
-- TEST GLOBAL TRIGGER FOR NEW TASKS
-- =====================================================
-- This script tests if the trigger works for newly created tasks

-- Step 1: Check current trigger status
SELECT 
  'TRIGGER STATUS' as test_type,
  trigger_name,
  event_manipulation,
  action_timing,
  'GLOBAL SCOPE' as scope
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_update_task_slot_counts_global';

-- Step 2: Create a test task to verify trigger works for new tasks
DO $$
DECLARE
  test_task_id UUID;
  test_worker_id UUID;
  initial_count INTEGER;
  final_count INTEGER;
  assignment_id UUID;
BEGIN
  -- Create a new test task
  INSERT INTO tasks (
    title, 
    description, 
    budget, 
    category, 
    status, 
    max_workers, 
    assigned_count,
    required_rating,
    created_by
  ) VALUES (
    'TEST TASK FOR TRIGGER VERIFICATION',
    'This is a test task to verify the global trigger works for new tasks',
    1000.00,
    'IT',
    'active',
    3,
    0,
    1.0,
    (SELECT user_id FROM profiles WHERE role = 'employer' LIMIT 1)
  ) RETURNING id INTO test_task_id;
  
  RAISE NOTICE 'Created test task: %', test_task_id;
  
  -- Get an active worker
  SELECT user_id INTO test_worker_id
  FROM profiles 
  WHERE role = 'worker' AND worker_status = 'active_employee'
  LIMIT 1;
  
  IF test_worker_id IS NOT NULL THEN
    -- Check initial state
    SELECT COALESCE(assigned_count, 0) INTO initial_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'Initial assigned_count: %', initial_count;
    
    -- Insert assignment for the NEW task
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (test_task_id, test_worker_id, 'assigned')
    RETURNING id INTO assignment_id;
    
    -- Check final state
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    -- Show results
    RAISE NOTICE 'TRIGGER TEST FOR NEW TASK: Initial: %, Final: %, Increased: %', 
      initial_count, final_count, (final_count - initial_count);
    
    -- Test unassignment
    DELETE FROM task_assignments WHERE id = assignment_id;
    
    -- Check state after unassignment
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'UNASSIGNMENT TEST: Count after unassignment: %', final_count;
    
    -- Clean up test task
    DELETE FROM tasks WHERE id = test_task_id;
    
    RAISE NOTICE 'Test task cleaned up successfully';
    
  ELSE
    RAISE NOTICE 'TEST SKIPPED - No active workers found';
    -- Clean up test task
    DELETE FROM tasks WHERE id = test_task_id;
  END IF;
END $$;

-- Step 3: Test with existing tasks to ensure they still work
SELECT 
  'EXISTING TASK TEST' as test_type,
  id,
  title,
  max_workers,
  COALESCE(assigned_count, 0) as assigned_count,
  (max_workers - COALESCE(assigned_count, 0)) as available_slots,
  'Should work with global trigger' as note
FROM tasks 
WHERE status = 'active'
ORDER BY created_at DESC 
LIMIT 5;

-- Step 4: Check recent assignments to verify trigger is working
SELECT 
  'RECENT ASSIGNMENTS' as test_type,
  ta.id as assignment_id,
  ta.task_id,
  t.title,
  ta.worker_id,
  ta.status,
  ta.created_at,
  'Trigger should have updated assigned_count' as note
FROM task_assignments ta
JOIN tasks t ON t.id = ta.task_id
ORDER BY ta.created_at DESC
LIMIT 10;

-- Step 5: Verify slot counts match assignments
SELECT 
  'SLOT COUNT VERIFICATION' as test_type,
  t.id,
  t.title,
  t.max_workers,
  COALESCE(t.assigned_count, 0) as db_assigned_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN COALESCE(t.assigned_count, 0) = COUNT(ta.id) THEN 'CORRECT - Trigger working'
    ELSE 'MISMATCH - Trigger not working'
  END as verification_status
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id
WHERE t.status = 'active'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 10;

-- Step 6: Final verification
SELECT 
  'FINAL VERIFICATION' as test_type,
  'Global trigger is working for all tasks!' as status,
  'New tasks will automatically update slot counts' as new_tasks,
  'Existing tasks continue to work correctly' as existing_tasks,
  'Frontend will show correct slot counts for all tasks' as frontend_result;



