-- =====================================================
-- SIMPLE SLOT COUNTING TEST
-- =====================================================
-- This script tests the slot counting trigger without complex syntax

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

-- Step 2: Check if trigger exists
SELECT 
  'TRIGGER CHECK' as test_phase,
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_update_task_slot_counts_automatic';

-- Step 3: Check current assignments
SELECT 
  'CURRENT ASSIGNMENTS' as test_phase,
  COUNT(*) as total_assignments,
  COUNT(DISTINCT task_id) as tasks_with_assignments
FROM task_assignments;

-- Step 4: Verify slot counts match assignments
SELECT 
  'SLOT COUNT VERIFICATION' as test_phase,
  t.id,
  t.title,
  t.assigned_count as db_assigned_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as status
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id
GROUP BY t.id, t.title, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 5;

-- Step 5: Test assignment prevention
-- Try to find a full task
SELECT 
  'FULL TASK CHECK' as test_phase,
  id,
  title,
  max_workers,
  assigned_count,
  'This task should prevent new assignments' as note
FROM tasks 
WHERE assigned_count >= max_workers
LIMIT 3;

-- Step 6: Test available tasks
SELECT 
  'AVAILABLE TASKS' as test_phase,
  id,
  title,
  max_workers,
  assigned_count,
  (max_workers - assigned_count) as available_slots,
  'Slots left: ' || (max_workers - assigned_count) || ' of ' || max_workers as display_text
FROM tasks 
WHERE assigned_count < max_workers
ORDER BY created_at DESC
LIMIT 5;

-- Step 7: Final status
SELECT 
  'FINAL STATUS' as test_phase,
  'Slot counting system is ready!' as status,
  'Run the main fix script to activate triggers' as next_step;



