-- Fix for new employees getting automatic 3-star ratings
-- This script updates the rating system to show 0.0 rating for workers with no approved ratings

BEGIN;

-- 1. Update the trigger function to use 0.0 instead of 3.0 for workers with no ratings
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
    
    -- Calculate average rating for this worker from all approved submissions
    SELECT 
      COALESCE(AVG(employer_rating_given), 0.00), -- Changed from 3.00 to 0.00
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions 
    WHERE worker_id = NEW.worker_id 
      AND employer_rating_given IS NOT NULL
      AND status = 'approved';
    
    -- Determine designation based on average rating
    -- For workers with 0.0 rating (no ratings yet), they should be L1
    IF avg_rating <= 0.0 THEN
      new_designation := 'L1';
    ELSIF avg_rating < 3.0 THEN
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
    RAISE NOTICE 'Updated worker % rating to % and designation to % (based on % ratings)', 
      NEW.worker_id, avg_rating, new_designation, total_ratings;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create function to recalculate all worker ratings with the new logic
CREATE OR REPLACE FUNCTION recalculate_all_worker_ratings()
RETURNS VOID AS $$
DECLARE
  worker_record RECORD;
  avg_rating DECIMAL(3,2);
  new_designation TEXT;
  total_ratings INTEGER;
BEGIN
  -- Loop through all workers
  FOR worker_record IN 
    SELECT user_id FROM public.profiles WHERE role = 'worker'
  LOOP
    -- Calculate average rating for this worker
    SELECT 
      COALESCE(AVG(employer_rating_given), 0.00), -- Changed from 3.00 to 0.00
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions 
    WHERE worker_id = worker_record.user_id 
      AND employer_rating_given IS NOT NULL
      AND status = 'approved';
    
    -- Determine designation
    IF avg_rating <= 0.0 THEN
      new_designation := 'L1';
    ELSIF avg_rating < 3.0 THEN
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
    WHERE user_id = worker_record.user_id;
    
  END LOOP;
  
  RAISE NOTICE 'Recalculated ratings for all workers with new logic (0.0 default instead of 3.0)';
END;
$$ LANGUAGE plpgsql;

-- 3. Run the recalculation function to fix existing data
SELECT recalculate_all_worker_ratings();

-- 4. Verify the fix by showing workers with 0.0 ratings (new workers)
SELECT 
  user_id,
  full_name,
  rating,
  designation,
  total_tasks_completed,
  last_rating_update
FROM public.profiles 
WHERE role = 'worker' 
  AND rating = 0.0
ORDER BY created_at DESC;

COMMIT;
