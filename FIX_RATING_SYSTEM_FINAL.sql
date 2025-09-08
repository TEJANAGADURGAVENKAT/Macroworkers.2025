-- FINAL FIX FOR RATING SYSTEM
-- This script ensures only approved submissions count towards ratings
-- and fixes any existing data inconsistencies

BEGIN;

-- 1. First, let's see what we're working with
SELECT 'Current state before fix:' as status;

-- Check current worker ratings
SELECT 
    p.user_id,
    p.full_name,
    p.rating,
    p.designation,
    p.last_rating_update
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

-- Check task submissions with ratings
SELECT 
    ts.worker_id,
    p.full_name,
    ts.status,
    ts.employer_rating_given,
    ts.rating_feedback,
    ts.submitted_at
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
WHERE ts.employer_rating_given IS NOT NULL
ORDER BY ts.submitted_at DESC;

-- 2. Clear ALL ratings from rejected submissions
UPDATE public.task_submissions
SET employer_rating_given = NULL,
    rating_feedback = NULL
WHERE status = 'rejected' AND (employer_rating_given IS NOT NULL OR rating_feedback IS NOT NULL);

-- 3. Update the trigger function to ONLY count approved submissions
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
    
    -- Calculate average rating from APPROVED submissions ONLY
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
    
    -- Update worker's profile
    UPDATE public.profiles 
    SET 
      rating = avg_rating,
      designation = new_designation,
      last_rating_update = now(),
      updated_at = now()
    WHERE user_id = NEW.worker_id AND role = 'worker';
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();

-- 5. Manually recalculate ALL worker ratings based on approved submissions only
UPDATE public.profiles 
SET 
  rating = (
    SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00)
    FROM public.task_submissions ts
    WHERE ts.worker_id = profiles.user_id 
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'
  ),
  designation = CASE 
    WHEN (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) 
      FROM public.task_submissions ts 
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ) < 3.0 THEN 'L1'
    WHEN (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) 
      FROM public.task_submissions ts 
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ) >= 3.0 AND (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) 
      FROM public.task_submissions ts 
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ) < 4.0 THEN 'L2'
    ELSE 'L3'
  END,
  last_rating_update = now(),
  updated_at = now()
WHERE role = 'worker';

-- 6. Verify the fix
SELECT 'After fix - Worker ratings:' as status;

SELECT 
    p.user_id,
    p.full_name,
    p.rating,
    p.designation,
    p.last_rating_update,
    -- Show approved ratings count
    (SELECT COUNT(*) 
     FROM public.task_submissions ts 
     WHERE ts.worker_id = p.user_id 
       AND ts.employer_rating_given IS NOT NULL 
       AND ts.status = 'approved') as approved_ratings_count,
    -- Show rejected ratings count (should be 0)
    (SELECT COUNT(*) 
     FROM public.task_submissions ts 
     WHERE ts.worker_id = p.user_id 
       AND ts.employer_rating_given IS NOT NULL 
       AND ts.status = 'rejected') as rejected_ratings_count
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

-- 7. Check task submissions after fix
SELECT 'After fix - Task submissions:' as status;

SELECT 
    ts.worker_id,
    p.full_name,
    ts.status,
    ts.employer_rating_given,
    ts.rating_feedback,
    ts.submitted_at
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
WHERE ts.employer_rating_given IS NOT NULL
ORDER BY ts.submitted_at DESC;

-- 8. Show detailed breakdown for each worker
SELECT 'Detailed worker breakdown:' as status;

SELECT 
    p.full_name,
    p.rating,
    p.designation,
    -- Approved submissions with ratings
    (SELECT json_agg(
        json_build_object(
            'task_id', ts.task_id,
            'rating', ts.employer_rating_given,
            'status', ts.status,
            'submitted_at', ts.submitted_at
        )
    )
    FROM public.task_submissions ts
    WHERE ts.worker_id = p.user_id 
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'
    ) as approved_ratings,
    -- Rejected submissions (should have no ratings)
    (SELECT json_agg(
        json_build_object(
            'task_id', ts.task_id,
            'rating', ts.employer_rating_given,
            'status', ts.status,
            'submitted_at', ts.submitted_at
        )
    )
    FROM public.task_submissions ts
    WHERE ts.worker_id = p.user_id 
      AND ts.status = 'rejected'
    ) as rejected_submissions
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

COMMIT;

-- Final verification message
SELECT 'Rating system fix completed successfully!' as result;



