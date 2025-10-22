-- =====================================================
-- QUICK TEST FOR SLOT COUNTING TRIGGER
-- =====================================================
-- This script quickly tests if the slot counting trigger is working

-- Step 1: Check current state
SELECT 
  'BEFORE TEST' as test_phase,
  id,
  title,
  max_workers,
  assigned_count,
  (max_workers - assigned_count) as available_slots
FROM tasks 
WHERE title LIKE '%Backend Developer%'
ORDER BY created_at DESC 
LIMIT 1;

-- Step 2: Check if trigger exists
SELECT 
  'TRIGGER CHECK' as test_phase,
  trigger_name,
  event_manipulation,
  action_timing,
  'EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_update_task_slot_counts_on_assignment';

-- Step 3: Test assignment (this will be rolled back)
BEGIN;
  -- Find a task with available slots
  DECLARE
    test_task_id UUID;
    test_worker_id UUID;
    initial_count INTEGER;
    final_count INTEGER;
  BEGIN
    -- Get Backend Developer task
    SELECT id, assigned_count INTO test_task_id, initial_count
    FROM tasks 
    WHERE title LIKE '%Backend Developer%'
    LIMIT 1;
    
    -- Get an active worker
    SELECT user_id INTO test_worker_id
    FROM profiles 
    WHERE role = 'worker' AND worker_status = 'active_employee'
    LIMIT 1;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
      -- Show initial state
      SELECT 
        'INITIAL STATE' as test_phase,
        test_task_id as task_id,
        initial_count as assigned_count,
        'Ready for test assignment' as status;
      
      -- Insert test assignment
      INSERT INTO task_assignments (task_id, worker_id, status)
      VALUES (test_task_id, test_worker_id, 'assigned');
      
      -- Check final state
      SELECT assigned_count INTO final_count
      FROM tasks 
      WHERE id = test_task_id;
      
      -- Show results
      SELECT 
        'AFTER ASSIGNMENT' as test_phase,
        test_task_id as task_id,
        initial_count as initial_assigned_count,
        final_count as final_assigned_count,
        (final_count - initial_count) as count_increase,
        CASE 
          WHEN final_count = initial_count + 1 THEN 'SUCCESS - Trigger working!'
          ELSE 'FAILED - Trigger not working'
        END as test_result;
      
    ELSE
      SELECT 'TEST SKIPPED - No Backend Developer task or workers found' as test_phase;
    END IF;
  END;
ROLLBACK;

-- Step 4: Check current assignments for Backend Developer task
SELECT 
  'CURRENT ASSIGNMENTS' as test_phase,
  ta.id as assignment_id,
  ta.task_id,
  t.title,
  ta.worker_id,
  ta.status,
  ta.created_at
FROM task_assignments ta
JOIN tasks t ON t.id = ta.task_id
WHERE t.title LIKE '%Backend Developer%'
ORDER BY ta.created_at DESC;

-- Step 5: Final verification
SELECT 
  'FINAL VERIFICATION' as test_phase,
  'If trigger is working, slot counts should update automatically' as status,
  'Try assigning a task and check if slot count decreases' as next_step;



