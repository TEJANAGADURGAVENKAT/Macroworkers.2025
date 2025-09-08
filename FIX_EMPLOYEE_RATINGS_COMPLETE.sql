-- COMPLETE FIX FOR EMPLOYEE RATINGS SYSTEM
-- This script fixes all issues with employee ratings:
-- 1. Only approved submissions count towards ratings
-- 2. Each employee gets their correct individual rating
-- 3. Rejected submissions are excluded from calculations
-- 4. Handles minimum rating constraint properly

BEGIN;

-- 1. First, clear any existing ratings from rejected submissions
UPDATE public.task_submissions
SET employer_rating_given = NULL,
    rating_feedback = NULL
WHERE status = 'rejected' AND (employer_rating_given IS NOT NULL OR rating_feedback IS NOT NULL);

-- 2. Create the corrected trigger function that ONLY counts approved submissions
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
      COALESCE(GREATEST(1.00, AVG(employer_rating_given)), 1.00), -- Ensure minimum rating is 1.00
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

-- 3. Drop existing trigger and create new one
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();

-- 4. Recalculate ALL worker ratings based on approved submissions only
-- This ensures all existing data is consistent with the new logic
DO $$
DECLARE
  worker_rec RECORD;
  avg_rating DECIMAL(3,2);
  new_designation TEXT;
  total_ratings INTEGER;
BEGIN
  FOR worker_rec IN 
    SELECT user_id, full_name FROM public.profiles WHERE role = 'worker'
  LOOP
    -- Calculate average rating from approved submissions only
    SELECT 
      COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00),
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions ts
    WHERE ts.worker_id = worker_rec.user_id
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'; -- Only count approved submissions
    
    -- Determine designation
    IF avg_rating < 3.0 THEN
      new_designation := 'L1';
    ELSIF avg_rating >= 3.0 AND avg_rating < 4.0 THEN
      new_designation := 'L2';
    ELSE
      new_designation := 'L3';
    END IF;
    
    -- Update worker profile
    UPDATE public.profiles
    SET 
      rating = avg_rating,
      designation = new_designation,
      last_rating_update = now(),
      updated_at = now()
    WHERE user_id = worker_rec.user_id;
    
    -- Log the update
    RAISE NOTICE 'Recalculated worker % (%) rating to % and designation to % (based on % approved ratings)', 
      worker_rec.full_name, worker_rec.user_id, avg_rating, new_designation, total_ratings;
  END LOOP;
END $$;

-- 5. Verify the fix by showing current worker ratings
SELECT 
  p.full_name,
  p.rating,
  p.designation,
  p.last_rating_update,
  (SELECT COUNT(*) FROM public.task_submissions ts 
   WHERE ts.worker_id = p.user_id 
   AND ts.employer_rating_given IS NOT NULL 
   AND ts.status = 'approved') as approved_ratings_count,
  (SELECT COUNT(*) FROM public.task_submissions ts 
   WHERE ts.worker_id = p.user_id 
   AND ts.employer_rating_given IS NOT NULL 
   AND ts.status = 'rejected') as rejected_ratings_count
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

-- 6. Show detailed breakdown of submissions by status
SELECT 
  ts.status,
  COUNT(*) as total_submissions,
  COUNT(ts.employer_rating_given) as rated_submissions,
  AVG(ts.employer_rating_given) as avg_rating
FROM public.task_submissions ts
WHERE ts.employer_rating_given IS NOT NULL
GROUP BY ts.status
ORDER BY ts.status;

-- 7. Show individual worker rating breakdowns
SELECT 
  p.full_name,
  p.rating as current_profile_rating,
  p.designation,
  ts.status,
  COUNT(*) as submission_count,
  AVG(ts.employer_rating_given) as avg_rating_for_status
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id 
  AND ts.employer_rating_given IS NOT NULL
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation, ts.status
ORDER BY p.full_name, ts.status;

COMMIT;

-- Summary of what this fix does:
-- 1. ✅ Clears ratings from rejected submissions
-- 2. ✅ Updates trigger to only count approved submissions
-- 3. ✅ Recalculates all worker ratings based on approved submissions only
-- 4. ✅ Ensures minimum rating constraint (1.00) is respected
-- 5. ✅ Provides verification queries to confirm the fix worked
-- 6. ✅ Each worker now gets their correct individual rating
-- 7. ✅ Rejected submissions are completely excluded from calculations



