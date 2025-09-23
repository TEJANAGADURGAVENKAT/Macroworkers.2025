-- FINAL WORKING SQL - No GROUP BY errors
-- This will fix the interview scheduling issue

-- Step 1: Update workers who have all 5 documents approved
UPDATE profiles 
SET 
  worker_status = 'interview_pending',
  status = 'interview_pending',
  updated_at = now()
WHERE user_id IN (
  SELECT worker_id
  FROM worker_documents
  WHERE verification_status = 'approved'
  GROUP BY worker_id
  HAVING COUNT(*) = 5
);

-- Step 2: Verify the update worked
SELECT 
  user_id,
  full_name,
  worker_status,
  status
FROM profiles 
WHERE role = 'worker'
ORDER BY created_at DESC;

-- Step 3: Count how many workers are now ready for interview
SELECT 
  COUNT(*) as workers_ready_for_interview
FROM profiles 
WHERE role = 'worker' 
AND worker_status = 'interview_pending';
