-- Fixed SQL script for interview scheduling
-- This fixes the GROUP BY error

-- Step 1: Update workers who have all documents approved but wrong status
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
  GROUP BY p.user_id, p.worker_status, p.status
  HAVING COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
  AND (p.worker_status != 'interview_pending' OR p.status != 'interview_pending')
);

-- Step 2: Also update workers in verification_pending status
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
  AND (p.worker_status = 'verification_pending' OR p.status = 'verification_pending')
  GROUP BY p.user_id, p.worker_status, p.status
  HAVING COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
);

-- Step 3: Verify the fix
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

-- Step 4: Count workers ready for interview scheduling
SELECT 
  'Workers ready for interview scheduling:' as description,
  COUNT(*) as count
FROM profiles 
WHERE role = 'worker' 
AND (worker_status = 'interview_pending' OR status = 'interview_pending');

