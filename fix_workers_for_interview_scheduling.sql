-- Fix script to update workers who have all documents approved but wrong status
-- This will make them appear in the interview scheduling section

-- Step 1: Update workers who have all 5 documents approved but wrong status
UPDATE profiles 
SET 
  worker_status = 'interview_pending',
  status = 'interview_pending',
  updated_at = now()
WHERE user_id IN (
  SELECT p.user_id
  FROM profiles p
  LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
  WHERE p.role = 'worker'
  GROUP BY p.user_id
  HAVING COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
  AND p.worker_status != 'interview_pending'
);

-- Step 2: Verify the update
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  p.status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.worker_status, p.status
HAVING COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
ORDER BY p.created_at DESC;

-- Step 3: Check how many workers are now ready for interview scheduling
SELECT 
  COUNT(*) as workers_ready_for_interview
FROM profiles 
WHERE role = 'worker' 
AND worker_status = 'interview_pending';

-- Step 4: Show all workers with their current status
SELECT 
  user_id,
  full_name,
  worker_status,
  status,
  created_at
FROM profiles 
WHERE role = 'worker'
ORDER BY created_at DESC;

