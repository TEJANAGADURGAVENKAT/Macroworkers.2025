-- Debug script to check worker statuses
-- This will help us understand why workers aren't showing up

-- Check all workers and their statuses
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  p.role,
  p.created_at,
  COUNT(wd.id) as document_count,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs,
  COUNT(CASE WHEN wd.verification_status = 'pending' THEN 1 END) as pending_docs,
  COUNT(CASE WHEN wd.verification_status = 'rejected' THEN 1 END) as rejected_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.worker_status, p.role, p.created_at
ORDER BY p.created_at DESC;

-- Check specific workers who might be ready for interview
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker' 
  AND p.worker_status IN ('verification_pending', 'interview_pending', 'interview_scheduled', 'active_employee')
GROUP BY p.user_id, p.full_name, p.worker_status
HAVING COUNT(wd.id) >= 5  -- Should have all 5 required documents
ORDER BY p.created_at DESC;

-- Check if any workers have all documents approved but wrong status
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker' 
  AND p.worker_status = 'verification_pending'
GROUP BY p.user_id, p.full_name, p.worker_status
HAVING COUNT(wd.id) >= 5 AND COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
ORDER BY p.created_at DESC;

