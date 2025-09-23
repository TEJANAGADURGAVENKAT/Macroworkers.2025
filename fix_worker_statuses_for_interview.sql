-- Fix worker statuses for interview scheduling
-- This script will ensure all workers with approved documents have the correct status

-- First, let's see all workers and their current status
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

-- Update workers who have all 5 documents approved but wrong status
UPDATE profiles 
SET 
  worker_status = 'interview_pending',
  updated_at = now()
WHERE user_id IN (
  SELECT p.user_id
  FROM profiles p
  LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
  WHERE p.role = 'worker'
    AND p.worker_status = 'verification_pending'
  GROUP BY p.user_id
  HAVING COUNT(wd.id) >= 5 
    AND COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
);

-- Verify the update
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
  AND p.worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee')
GROUP BY p.user_id, p.full_name, p.worker_status
ORDER BY p.created_at DESC;

