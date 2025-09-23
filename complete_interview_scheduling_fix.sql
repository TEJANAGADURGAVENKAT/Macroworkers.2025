-- Complete fix for interview scheduling issues
-- This script will fix all workers who should be in interview scheduling

-- Step 1: Check current state
SELECT 'BEFORE FIX - Current worker statuses:' as status;

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

-- Step 2: Update workers who have all 5 documents approved but wrong status
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
  AND (p.worker_status != 'interview_pending' OR p.status != 'interview_pending')
);

-- Step 3: Also update workers who have all documents approved but are in verification_pending
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
  GROUP BY p.user_id
  HAVING COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
);

-- Step 4: Verify the fix
SELECT 'AFTER FIX - Updated worker statuses:' as status;

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

-- Step 5: Count workers ready for interview scheduling
SELECT 
  'Workers ready for interview scheduling:' as description,
  COUNT(*) as count
FROM profiles 
WHERE role = 'worker' 
AND (worker_status = 'interview_pending' OR status = 'interview_pending');

-- Step 6: Show workers who should appear in interview scheduling
SELECT 
  'Workers who should appear in interview scheduling:' as description,
  p.user_id,
  p.full_name,
  p.worker_status,
  p.status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
AND (p.worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee') 
     OR p.status IN ('interview_pending', 'interview_scheduled', 'accepted'))
GROUP BY p.user_id, p.full_name, p.worker_status, p.status
ORDER BY p.created_at DESC;

