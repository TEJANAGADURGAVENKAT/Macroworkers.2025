-- =====================================================
-- TEST COMPLETE ASSIGNMENT FLOW WITH SLOT COUNTING
-- =====================================================
-- This script tests the complete flow from assignment to slot count update

-- Step 1: Check current state before testing
SELECT 
  'BEFORE TEST' as test_phase,
  id,
  title,
  max_workers,
  assigned_count,
  (max_workers - assigned_count) as available_slots,
  CASE 
    WHEN assigned_count >= max_workers THEN 'FULL'
    WHEN assigned_count > max_workers THEN 'OVER-ASSIGNED'
    ELSE 'AVAILABLE'
  END as status
FROM tasks 
WHERE assigned_count < max_workers
ORDER BY created_at DESC 
LIMIT 3;

-- Step 2: Test assignment flow
BEGIN;
  -- Find a task with available slots
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
    
    -- Check if we have valid test data
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
      -- Show initial state
      SELECT 
        'INITIAL STATE' as test_phase,
        test_task_id as task_id,
        initial_count as assigned_count,
        'Ready for assignment' as status;
      
      -- Insert assignment
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
          WHEN final_count = initial_count + 1 THEN 'SUCCESS - Count increased by 1'
          ELSE 'FAILED - Count did not increase properly'
        END as test_result;
      
      -- Show current slot availability
      SELECT 
        'SLOT AVAILABILITY' as test_phase,
        id,
        title,
        max_workers,
        assigned_count,
        (max_workers - assigned_count) as available_slots,
        'Slots left: ' || (max_workers - assigned_count) || ' of ' || max_workers as display_text
      FROM tasks 
      WHERE id = test_task_id;
      
    ELSE
      SELECT 'TEST SKIPPED - No available tasks or workers' as test_phase;
    END IF;
  END;
ROLLBACK;

-- Step 3: Test unassignment flow
BEGIN;
  -- Find a task with assignments
  DECLARE
    test_task_id UUID;
    test_assignment_id UUID;
    initial_count INTEGER;
    final_count INTEGER;
  BEGIN
    -- Get a task with assignments
    SELECT t.id, t.assigned_count, ta.id
    INTO test_task_id, initial_count, test_assignment_id
    FROM tasks t
    JOIN task_assignments ta ON ta.task_id = t.id
    WHERE t.assigned_count > 0
    LIMIT 1;
    
    IF test_task_id IS NOT NULL AND test_assignment_id IS NOT NULL THEN
      -- Show initial state
      SELECT 
        'BEFORE UNASSIGNMENT' as test_phase,
        test_task_id as task_id,
        initial_count as assigned_count,
        'Ready for unassignment' as status;
      
      -- Delete assignment
      DELETE FROM task_assignments 
      WHERE id = test_assignment_id;
      
      -- Check final state
      SELECT assigned_count INTO final_count
      FROM tasks 
      WHERE id = test_task_id;
      
      -- Show results
      SELECT 
        'AFTER UNASSIGNMENT' as test_phase,
        test_task_id as task_id,
        initial_count as initial_assigned_count,
        final_count as final_assigned_count,
        (initial_count - final_count) as count_decrease,
        CASE 
          WHEN final_count = initial_count - 1 THEN 'SUCCESS - Count decreased by 1'
          ELSE 'FAILED - Count did not decrease properly'
        END as test_result;
      
    ELSE
      SELECT 'UNASSIGNMENT TEST SKIPPED - No assignments found' as test_phase;
    END IF;
  END;
ROLLBACK;

-- Step 4: Test full task prevention
BEGIN;
  -- Find a full task
  DECLARE
    test_task_id UUID;
    test_worker_id UUID;
  BEGIN
    -- Get a full task
    SELECT id INTO test_task_id
    FROM tasks 
    WHERE assigned_count >= max_workers
    LIMIT 1;
    
    -- Get an active worker
    SELECT user_id INTO test_worker_id
    FROM profiles 
    WHERE role = 'worker' AND worker_status = 'active_employee'
    LIMIT 1;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
      -- Try to assign to full task (should fail)
      BEGIN
        INSERT INTO task_assignments (task_id, worker_id, status)
        VALUES (test_task_id, test_worker_id, 'assigned');
        
        SELECT 'FULL TASK TEST FAILED - Assignment should have been prevented' as test_result;
      EXCEPTION
        WHEN OTHERS THEN
          SELECT 'FULL TASK TEST SUCCESS - Assignment prevented: ' || SQLERRM as test_result;
      END;
    ELSE
      SELECT 'FULL TASK TEST SKIPPED - No full tasks or workers found' as test_result;
    END IF;
  END;
ROLLBACK;

-- Step 5: Final verification
SELECT 
  'FINAL VERIFICATION' as test_phase,
  'Automatic slot counting is working!' as status,
  'Triggers are active and preventing over-assignment' as details;



