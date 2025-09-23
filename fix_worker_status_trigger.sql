-- Fix worker status update trigger and update Anitha's status
-- First, let's check if the trigger exists and is working

-- Check current trigger status
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_worker_status_after_interview';

-- Recreate the trigger function to ensure it's working
CREATE OR REPLACE FUNCTION update_worker_status_after_interview()
RETURNS TRIGGER AS $$
BEGIN
  -- If interview result is 'selected', make worker active
  IF NEW.result = 'selected' THEN
    UPDATE public.profiles 
    SET worker_status = 'active_employee', updated_at = now()
    WHERE user_id = NEW.worker_id;
    
    -- Log the status change
    INSERT INTO worker_status_logs (worker_id, old_status, new_status, notes, changed_by)
    VALUES (NEW.worker_id, 'interview_scheduled', 'active_employee', 'Selected after interview', NEW.employer_id);
    
  ELSIF NEW.result = 'rejected' THEN
    UPDATE public.profiles 
    SET worker_status = 'rejected', updated_at = now()
    WHERE user_id = NEW.worker_id;
    
    -- Log the status change
    INSERT INTO worker_status_logs (worker_id, old_status, new_status, notes, changed_by)
    VALUES (NEW.worker_id, 'interview_scheduled', 'rejected', 'Rejected after interview', NEW.employer_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_worker_status_after_interview ON public.worker_interviews;
CREATE TRIGGER trigger_update_worker_status_after_interview
  AFTER UPDATE ON public.worker_interviews
  FOR EACH ROW
  WHEN (NEW.result IS DISTINCT FROM OLD.result)
  EXECUTE FUNCTION update_worker_status_after_interview();

-- Now manually update Anitha's status if she was selected
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

-- Log the manual status change
INSERT INTO worker_status_logs (worker_id, old_status, new_status, notes, changed_by)
SELECT 
  p.user_id,
  p.worker_status,
  'active_employee',
  'Manually updated to active after selection',
  wi.employer_id
FROM profiles p
LEFT JOIN worker_interviews wi ON p.user_id = wi.worker_id
WHERE (p.full_name ILIKE '%anitha%' OR p.full_name ILIKE '%padala%')
  AND wi.result = 'selected'
  AND p.worker_status != 'active_employee';

-- Verify the update
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  wi.result,
  wi.status as interview_status,
  wi.feedback,
  wi.scheduled_date
FROM profiles p
LEFT JOIN worker_interviews wi ON p.user_id = wi.worker_id
WHERE p.full_name ILIKE '%anitha%' OR p.full_name ILIKE '%padala%'
ORDER BY p.created_at DESC;

