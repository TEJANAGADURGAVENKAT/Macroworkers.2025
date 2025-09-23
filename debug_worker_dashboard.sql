-- Debug script to check worker dashboard realtime subscription
-- This will help identify why auto-redirect is not working

-- Check if a specific worker exists and their current status
SELECT 
  p.user_id,
  p.full_name,
  p.role,
  p.worker_status,
  p.status,
  p.created_at,
  COUNT(wd.id) as document_count,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.role, p.worker_status, p.status, p.created_at
ORDER BY p.created_at DESC;

-- Check recent document approvals
SELECT 
  wd.id,
  wd.worker_id,
  p.full_name,
  wd.document_type,
  wd.verification_status,
  wd.verified_at,
  wd.verified_by
FROM worker_documents wd
JOIN profiles p ON wd.worker_id = p.user_id
WHERE wd.verification_status = 'approved'
ORDER BY wd.verified_at DESC
LIMIT 10;

-- Check if there are any workers ready for interview
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

