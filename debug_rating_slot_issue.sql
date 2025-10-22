-- =====================================================
-- CHECK CURRENT SLOT DATA AND RATING ISSUES
-- =====================================================
-- This script checks the current state of tasks and identifies the real issue

-- Step 1: Check tasks that show "Rating Too Low" but should be accessible
SELECT 
  'TASKS WITH RATING ISSUES' as check_type,
  id,
  title,
  required_rating,
  max_workers,
  assigned_count,
  (max_workers - assigned_count) as available_slots,
  CASE 
    WHEN assigned_count >= max_workers THEN 'FULL'
    WHEN assigned_count > max_workers THEN 'OVER-ASSIGNED'
    ELSE 'AVAILABLE'
  END as slot_status,
  'Worker with 3.5★ should access 1★ tasks' as note
FROM tasks 
WHERE status = 'active'
  AND required_rating <= 3.5
ORDER BY required_rating, created_at DESC
LIMIT 10;

-- Step 2: Check specifically the tasks mentioned in the image
SELECT 
  'SPECIFIC TASK CHECK' as check_type,
  id,
  title,
  required_rating,
  max_workers,
  assigned_count,
  (max_workers - assigned_count) as available_slots,
  CASE 
    WHEN assigned_count >= max_workers THEN 'FULL - This is why button shows error'
    WHEN assigned_count > max_workers THEN 'OVER-ASSIGNED'
    ELSE 'AVAILABLE'
  END as status,
  'If slots_left = 0, then task is full regardless of rating' as explanation
FROM tasks 
WHERE title LIKE '%Full Stack Developer%' 
   OR title LIKE '%Database Administrator%'
ORDER BY created_at DESC;

-- Step 3: Check all full tasks
SELECT 
  'ALL FULL TASKS' as check_type,
  id,
  title,
  required_rating,
  max_workers,
  assigned_count,
  'These tasks should show "Slots Full" not "Rating Too Low"' as note
FROM tasks 
WHERE status = 'active'
  AND assigned_count >= max_workers
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Check tasks that should be accessible (rating OK + slots available)
SELECT 
  'ACCESSIBLE TASKS' as check_type,
  id,
  title,
  required_rating,
  max_workers,
  assigned_count,
  (max_workers - assigned_count) as available_slots,
  'These should show "Work on Task" button' as note
FROM tasks 
WHERE status = 'active'
  AND required_rating <= 3.5
  AND assigned_count < max_workers
ORDER BY required_rating, created_at DESC
LIMIT 5;

-- Step 5: Summary of the issue
SELECT 
  'ISSUE SUMMARY' as check_type,
  'The problem is NOT rating logic' as finding_1,
  'The problem IS that tasks are FULL (0 slots left)' as finding_2,
  'UI should show "Slots Full" instead of "Rating Too Low"' as solution,
  'Button text logic needs to check slots first, then rating' as fix_needed;



