-- Simple fix for interview scheduling
-- This is a clean, working version

-- Step 1: Update workers who have all documents approved
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
);

-- Step 2: Check the results
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
ORDER BY p.created_at DESC;

-- Step 3: Count workers ready for interview
SELECT 
  COUNT(*) as workers_ready_for_interview
FROM profiles 
WHERE role = 'worker' 
AND (worker_status = 'interview_pending' OR status = 'interview_pending');

