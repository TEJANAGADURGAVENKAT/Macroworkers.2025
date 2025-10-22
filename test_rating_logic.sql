-- =====================================================
-- TEST RATING LOGIC
-- =====================================================
-- This script tests if the rating logic is working correctly

-- Step 1: Check worker ratings
SELECT 
  'WORKER RATINGS' as test_type,
  p.user_id,
  p.full_name,
  p.rating,
  p.total_tasks_completed,
  p.worker_status
FROM profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC
LIMIT 10;

-- Step 2: Check task rating requirements
SELECT 
  'TASK RATING REQUIREMENTS' as test_type,
  id,
  title,
  required_rating,
  max_workers,
  assigned_count,
  CASE 
    WHEN required_rating IS NULL THEN 'NO RATING REQUIRED'
    ELSE required_rating::text || ' STAR(S) REQUIRED'
  END as rating_requirement
FROM tasks 
WHERE status = 'active'
ORDER BY required_rating DESC
LIMIT 10;

-- Step 3: Test rating comparison logic
-- This simulates the frontend logic: workerRating >= requiredRating
SELECT 
  'RATING COMPARISON TEST' as test_type,
  t.id as task_id,
  t.title,
  t.required_rating,
  p.full_name as worker_name,
  p.rating as worker_rating,
  CASE 
    WHEN p.rating >= t.required_rating THEN 'CAN ACCESS'
    ELSE 'CANNOT ACCESS'
  END as access_status,
  'Worker rating: ' || p.rating || ' >= Required: ' || t.required_rating as comparison
FROM tasks t
CROSS JOIN profiles p
WHERE t.status = 'active'
  AND p.role = 'worker'
  AND p.worker_status = 'active_employee'
ORDER BY t.required_rating, p.rating DESC
LIMIT 15;

-- Step 4: Check for workers with rating >= 3.5
SELECT 
  'HIGH RATED WORKERS' as test_type,
  p.user_id,
  p.full_name,
  p.rating,
  'Should be able to access 3⭐ tasks' as note
FROM profiles p
WHERE p.role = 'worker'
  AND p.rating >= 3.5
ORDER BY p.rating DESC;

-- Step 5: Check 3⭐ tasks specifically
SELECT 
  '3 STAR TASKS' as test_type,
  id,
  title,
  required_rating,
  max_workers,
  assigned_count,
  'Workers with 3.5⭐ should access these' as note
FROM tasks 
WHERE status = 'active'
  AND required_rating = 3.0
ORDER BY created_at DESC
LIMIT 5;

-- Step 6: Final verification
SELECT 
  'RATING LOGIC VERIFICATION' as test_type,
  'Frontend should show correct access based on rating comparison' as status,
  'Worker rating >= Task required_rating = Can Access' as logic;



