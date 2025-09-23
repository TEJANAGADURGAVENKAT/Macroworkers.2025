-- Debug script to check ALL workers and their statuses
-- This will help us understand why only 1 worker is showing up

-- Check all workers and their current status
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

-- Check which workers should be in interview_pending status
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs,
  CASE 
    WHEN COUNT(wd.id) >= 5 AND COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5 
    THEN 'SHOULD BE interview_pending'
    ELSE 'NOT READY'
  END as status_should_be
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.worker_status
ORDER BY p.created_at DESC;

