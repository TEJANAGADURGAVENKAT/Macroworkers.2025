-- =====================================================
-- VERIFY SLOT DATA IN DATABASE
-- =====================================================
-- This script checks if max_workers and assigned_count are properly set

-- Check current task slot data
SELECT 
  'CURRENT TASK SLOTS' as check_type,
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

-- Check for any tasks with missing or invalid slot data
SELECT 
  'INVALID SLOT DATA CHECK' as check_type,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN max_workers IS NULL OR max_workers = 0 THEN 1 END) as missing_max_workers,
  COUNT(CASE WHEN assigned_count IS NULL THEN 1 END) as missing_assigned_count,
  COUNT(CASE WHEN assigned_count > max_workers THEN 1 END) as over_assigned_tasks
FROM tasks;

-- Verify actual assignments match assigned_count
SELECT 
  'ASSIGNMENT VERIFICATION' as check_type,
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
LIMIT 10;

-- Sample query that matches the frontend
SELECT 
  'FRONTEND QUERY SAMPLE' as check_type,
  id,
  title,
  budget,
  max_workers,
  assigned_count,
  (max_workers - assigned_count) as slots_left
FROM tasks 
WHERE status = 'active'
ORDER BY created_at DESC 
LIMIT 5;



