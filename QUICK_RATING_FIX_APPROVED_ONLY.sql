-- QUICK FIX FOR EMPLOYEE RATINGS - APPROVED SUBMISSIONS ONLY
-- Run this in Supabase SQL Editor to immediately fix the rating issues

-- Step 1: Clear ratings from rejected submissions
UPDATE public.task_submissions
SET employer_rating_given = NULL,
    rating_feedback = NULL
WHERE status = 'rejected' AND (employer_rating_given IS NOT NULL OR rating_feedback IS NOT NULL);

-- Step 2: Fix the trigger function to only count approved submissions
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
    
    -- Calculate average rating for this worker from APPROVED submissions ONLY
    SELECT 
      COALESCE(GREATEST(1.00, AVG(employer_rating_given)), 1.00),
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions 
    WHERE worker_id = NEW.worker_id 
      AND employer_rating_given IS NOT NULL
      AND status = 'approved'; -- CRITICAL: Only count approved submissions
    
    -- Determine designation based on average rating
    IF avg_rating < 3.0 THEN
      new_designation := 'L1';
    ELSIF avg_rating >= 3.0 AND avg_rating < 4.0 THEN
      new_designation := 'L2';
    ELSE
      new_designation := 'L3';
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
    RAISE NOTICE 'Updated worker % rating to % and designation to % (based on % APPROVED ratings)', 
      NEW.worker_id, avg_rating, new_designation, total_ratings;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();

-- Step 4: Manually recalculate all worker ratings based on approved submissions only
UPDATE public.profiles 
SET 
  rating = (
    SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00)
    FROM public.task_submissions ts
    WHERE ts.worker_id = profiles.user_id 
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'  -- ONLY APPROVED SUBMISSIONS
  ),
  designation = CASE 
    WHEN (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED SUBMISSIONS
    ) < 3.0 THEN 'L1'
    WHEN (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED SUBMISSIONS
    ) >= 3.0 AND (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED SUBMISSIONS
    ) < 4.0 THEN 'L2'
    ELSE 'L3'
  END,
  last_rating_update = now(),
  updated_at = now()
WHERE role = 'worker';

-- Step 5: Verify the fix worked
SELECT 
  full_name,
  rating,
  designation,
  last_rating_update
FROM public.profiles 
WHERE role = 'worker' 
ORDER BY rating DESC;



