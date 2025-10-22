-- =====================================================
-- DEBUG SLOT COUNTING TRIGGER ISSUE
-- =====================================================
-- This script checks why slot counts aren't updating after assignment

-- Step 1: Check if trigger exists and is active
SELECT 
  'TRIGGER STATUS' as check_type,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  'ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE '%slot%'
ORDER BY trigger_name;

-- Step 2: Check current task assignments
SELECT 
  'CURRENT ASSIGNMENTS' as check_type,
  ta.id as assignment_id,
  ta.task_id,
  t.title,
  ta.worker_id,
  ta.status,
  ta.created_at,
  'Assignment exists' as note
FROM task_assignments ta
JOIN tasks t ON t.id = ta.task_id
ORDER BY ta.created_at DESC
LIMIT 10;

-- Step 3: Check task slot counts vs actual assignments
SELECT 
  'SLOT COUNT MISMATCH' as check_type,
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count as db_assigned_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
    ELSE 'MISMATCH - TRIGGER NOT WORKING'
  END as status,
  (t.max_workers - COUNT(ta.id)) as actual_available_slots
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 10;

-- Step 4: Check the Backend Developer Task specifically
SELECT 
  'BACKEND DEVELOPER TASK' as check_type,
  t.id,
  t.title,
  t.max_workers,
  t.assigned_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
    ELSE 'MISMATCH - Should be ' || COUNT(ta.id)
  END as status
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id
WHERE t.title LIKE '%Backend Developer%'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count;

-- Step 5: Test trigger manually
-- Insert a test assignment to see if trigger fires
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
    RAISE NOTICE 'TRIGGER TEST: Task %, Initial: %, Final: %, Increased: %', 
      test_task_id, initial_count, final_count, (final_count - initial_count);
    
    -- Clean up test assignment
    DELETE FROM task_assignments 
    WHERE task_id = test_task_id AND worker_id = test_worker_id;
    
  ELSE
    RAISE NOTICE 'TRIGGER TEST SKIPPED - No available tasks or workers';
  END IF;
END $$;

-- Step 6: Check trigger function
SELECT 
  'TRIGGER FUNCTION' as check_type,
  routine_name,
  routine_type,
  'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%slot%';

-- Step 7: Final diagnosis
SELECT 
  'DIAGNOSIS' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_update_task_slot_counts_automatic') 
    THEN 'Trigger exists - Check if function is working'
    ELSE 'Trigger missing - Need to recreate'
  END as trigger_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_task_slot_counts_automatic') 
    THEN 'Function exists - Check logic'
    ELSE 'Function missing - Need to recreate'
  END as function_status;



