-- Test script to manually update a worker's status to trigger redirect
-- This will help test if the realtime subscription is working

-- First, let's find a worker with all documents approved
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

-- Update a worker's status to interview_pending (replace with actual user_id)
-- UPDATE profiles 
-- SET 
--   worker_status = 'interview_pending',
--   status = 'interview_pending',
--   updated_at = now()
-- WHERE user_id = 'REPLACE_WITH_ACTUAL_USER_ID';

-- Check the update
-- SELECT 
--   user_id,
--   full_name,
--   worker_status,
--   status,
--   updated_at
-- FROM profiles 
-- WHERE user_id = 'REPLACE_WITH_ACTUAL_USER_ID';

