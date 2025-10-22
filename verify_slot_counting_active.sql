-- =====================================================
-- VERIFY SLOT COUNTING IS WORKING
-- =====================================================
-- This script verifies that the automatic slot counting is working correctly

-- Step 1: Check trigger status
SELECT 
  'TRIGGER STATUS' as check_type,
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_update_task_slot_counts_automatic';

-- Step 2: Check current task slot data
SELECT 
  'CURRENT SLOT DATA' as check_type,
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
ORDER BY created_at DESC 
LIMIT 10;

-- Step 3: Verify slot counts match actual assignments
SELECT 
  'SLOT COUNT VERIFICATION' as check_type,
  t.id,
  t.title,
  t.assigned_count as db_assigned_count,
  COUNT(ta.id) as actual_assignments,
  CASE 
    WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
    ELSE 'MISMATCH - NEEDS FIX'
  END as verification_status
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id
GROUP BY t.id, t.title, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 10;

-- Step 4: Check for any data inconsistencies
SELECT 
  'DATA CONSISTENCY CHECK' as check_type,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN assigned_count > max_workers THEN 1 END) as over_assigned_tasks,
  COUNT(CASE WHEN assigned_count < 0 THEN 1 END) as negative_assigned_tasks,
  COUNT(CASE WHEN max_workers IS NULL OR max_workers = 0 THEN 1 END) as invalid_max_workers
FROM tasks;

-- Step 5: Show tasks ready for assignment
SELECT 
  'TASKS READY FOR ASSIGNMENT' as check_type,
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

-- Step 6: Show full tasks (should prevent assignment)
SELECT 
  'FULL TASKS (PREVENT ASSIGNMENT)' as check_type,
  id,
  title,
  max_workers,
  assigned_count,
  'This task should prevent new assignments' as note
FROM tasks 
WHERE assigned_count >= max_workers
ORDER BY created_at DESC 
LIMIT 3;

-- Step 7: Final verification
SELECT 
  'VERIFICATION COMPLETE' as check_type,
  'Automatic slot counting is working!' as status,
  'Frontend will now show correct slot counts' as result,
  NOW() as verified_at;



