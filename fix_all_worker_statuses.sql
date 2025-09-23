-- Comprehensive fix for all worker statuses
-- This will ensure all workers with approved documents have the correct status

-- Step 1: Check current status of all workers
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs,
  COUNT(CASE WHEN wd.verification_status = 'pending' THEN 1 END) as pending_docs,
  COUNT(CASE WHEN wd.verification_status = 'rejected' THEN 1 END) as rejected_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.worker_status
ORDER BY p.created_at DESC;

-- Step 2: Update workers who have all documents approved but wrong status
UPDATE profiles 
SET 
  worker_status = 'interview_pending',
  updated_at = now()
WHERE user_id IN (
  SELECT p.user_id
  FROM profiles p
  LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
  WHERE p.role = 'worker'
    AND p.worker_status IN ('verification_pending', 'document_upload_pending')
  GROUP BY p.user_id
  HAVING COUNT(wd.id) >= 5 
    AND COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
    AND COUNT(CASE WHEN wd.verification_status = 'rejected' THEN 1 END) = 0
);

-- Step 3: Update workers who have some documents rejected (keep in verification_pending)
UPDATE profiles 
SET 
  worker_status = 'verification_pending',
  updated_at = now()
WHERE user_id IN (
  SELECT p.user_id
  FROM profiles p
  LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
  WHERE p.role = 'worker'
    AND p.worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee')
  GROUP BY p.user_id
  HAVING COUNT(CASE WHEN wd.verification_status = 'rejected' THEN 1 END) > 0
);

-- Step 4: Verify the final status
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs,
  COUNT(CASE WHEN wd.verification_status = 'pending' THEN 1 END) as pending_docs,
  COUNT(CASE WHEN wd.verification_status = 'rejected' THEN 1 END) as rejected_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
  AND p.worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee')
GROUP BY p.user_id, p.full_name, p.worker_status
ORDER BY p.created_at DESC;

