-- =====================================================
-- FIX RATING LOGIC ISSUES
-- =====================================================
-- This script ensures rating logic works correctly

-- Check current worker ratings
SELECT 
  'WORKER RATINGS CHECK' as test_type,
  p.user_id,
  p.full_name,
  p.rating,
  p.total_tasks_completed,
  p.worker_status
FROM profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC
LIMIT 10;

-- Check task rating requirements
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
ORDER BY required_rating DESC
LIMIT 10;

-- Check for rating mismatches
SELECT 
  'RATING MISMATCH CHECK' as test_type,
  t.id as task_id,
  t.title,
  t.required_rating,
  COUNT(p.user_id) as workers_with_sufficient_rating
FROM tasks t
LEFT JOIN profiles p ON p.role = 'worker' 
  AND p.worker_status = 'active_employee'
  AND p.rating >= t.required_rating
GROUP BY t.id, t.title, t.required_rating
ORDER BY t.required_rating DESC
LIMIT 10;

-- Verify rating constraints
SELECT 
  'RATING CONSTRAINT CHECK' as test_type,
  'All profiles have valid ratings' as status
WHERE NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE rating < 1.0 OR rating > 5.0
);

-- Check if any tasks have invalid required_rating
SELECT 
  'TASK RATING CONSTRAINT CHECK' as test_type,
  'All tasks have valid required_rating' as status
WHERE NOT EXISTS (
  SELECT 1 FROM tasks 
  WHERE required_rating < 1.0 OR required_rating > 5.0
);




