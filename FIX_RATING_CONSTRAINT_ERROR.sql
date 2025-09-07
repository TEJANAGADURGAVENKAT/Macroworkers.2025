-- FIX RATING CONSTRAINT ERROR
-- This fixes the check constraint error by setting minimum rating to 1.00 instead of 0.00

-- 1. First, let's check what the rating constraint allows
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND conname LIKE '%rating%';

-- 2. Update the trigger function to handle the constraint properly
CREATE OR REPLACE FUNCTION update_worker_rating_and_designation()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  new_designation TEXT;
  total_ratings INTEGER;
BEGIN
  -- Only proceed if employer_rating_given was updated and is not null
  IF NEW.employer_rating_given IS NOT NULL AND 
     (OLD.employer_rating_given IS NULL OR OLD.employer_rating_given != NEW.employer_rating_given) THEN
    
    -- Calculate average rating for this worker from APPROVED submissions only
    SELECT 
      COALESCE(AVG(employer_rating_given), 1.00),  -- Changed from 0.00 to 1.00
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions 
    WHERE worker_id = NEW.worker_id 
      AND employer_rating_given IS NOT NULL
      AND status = 'approved';  -- ONLY APPROVED SUBMISSIONS
    
    -- If no approved ratings found, set default values that satisfy constraint
    IF total_ratings = 0 THEN
      avg_rating := 1.00;  -- Changed from 0.00 to 1.00
      new_designation := 'L1';
    ELSE
      -- Determine designation based on average rating
      IF avg_rating < 3.0 THEN
        new_designation := 'L1';
      ELSIF avg_rating >= 3.0 AND avg_rating < 4.0 THEN
        new_designation := 'L2';
      ELSE
        new_designation := 'L3';
      END IF;
    END IF;
    
    -- Update worker profile with new rating and designation
    UPDATE public.profiles 
    SET 
      rating = avg_rating,
      designation = new_designation,
      last_rating_update = now(),
      updated_at = now()
    WHERE user_id = NEW.worker_id AND role = 'worker';
    
    -- Log the update for debugging
    RAISE NOTICE 'Updated worker % rating to % and designation to % (based on % approved ratings)', 
      NEW.worker_id, avg_rating, new_designation, total_ratings;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();

-- 4. Recalculate ALL worker ratings based on approved submissions only (with constraint fix)
UPDATE public.profiles 
SET 
  rating = GREATEST(1.00, (
    SELECT COALESCE(AVG(ts.employer_rating_given), 1.00)
    FROM public.task_submissions ts
    WHERE ts.worker_id = profiles.user_id 
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'  -- ONLY APPROVED
  )),
  designation = CASE 
    WHEN (
      SELECT COALESCE(AVG(ts.employer_rating_given), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED
    ) < 3.0 THEN 'L1'
    WHEN (
      SELECT COALESCE(AVG(ts.employer_rating_given), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED
    ) >= 3.0 AND (
      SELECT COALESCE(AVG(ts.employer_rating_given), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED
    ) < 4.0 THEN 'L2'
    ELSE 'L3'
  END,
  last_rating_update = now(),
  updated_at = now()
WHERE role = 'worker';

-- 5. Check the results for all workers
SELECT 
  full_name,
  rating,
  designation,
  last_rating_update
FROM public.profiles 
WHERE role = 'worker' 
ORDER BY rating DESC;

-- 6. Show detailed breakdown for each worker
SELECT 
  p.full_name,
  p.rating as current_rating,
  p.designation,
  COUNT(ts_all.id) as total_submissions,
  COUNT(ts_rated.id) as total_rated_submissions,
  COUNT(ts_approved.id) as approved_rated_submissions,
  COALESCE(AVG(ts_approved.employer_rating_given), 1.00) as calculated_avg_rating
FROM public.profiles p
LEFT JOIN public.task_submissions ts_all ON p.user_id = ts_all.worker_id
LEFT JOIN public.task_submissions ts_rated ON p.user_id = ts_rated.worker_id AND ts_rated.employer_rating_given IS NOT NULL
LEFT JOIN public.task_submissions ts_approved ON p.user_id = ts_approved.worker_id AND ts_approved.employer_rating_given IS NOT NULL AND ts_approved.status = 'approved'
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation
ORDER BY p.rating DESC;



