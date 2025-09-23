-- Immediate fix for Anitha Padala's status
-- This will update her status to active_employee if she was selected

-- First, let's see her current status
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  wi.result,
  wi.status as interview_status,
  wi.feedback
FROM profiles p
LEFT JOIN worker_interviews wi ON p.user_id = wi.worker_id
WHERE p.full_name ILIKE '%anitha%' OR p.full_name ILIKE '%padala%'
ORDER BY p.created_at DESC;

-- Update her status to active_employee
UPDATE profiles 
SET 
  worker_status = 'active_employee',
  updated_at = now()
WHERE user_id IN (
  SELECT p.user_id 
  FROM profiles p
  LEFT JOIN worker_interviews wi ON p.user_id = wi.worker_id
  WHERE (p.full_name ILIKE '%anitha%' OR p.full_name ILIKE '%padala%')
    AND wi.result = 'selected'
);

-- Verify the update
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  wi.result,
  wi.status as interview_status,
  wi.feedback
FROM profiles p
LEFT JOIN worker_interviews wi ON p.user_id = wi.worker_id
WHERE p.full_name ILIKE '%anitha%' OR p.full_name ILIKE '%padala%'
ORDER BY p.created_at DESC;

