-- Complete Rating System Fix
-- This script fixes the rating calculation to include ALL rated submissions, not just approved ones
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Ensure designation field exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS designation TEXT CHECK (designation IN ('L1', 'L2', 'L3')) DEFAULT 'L1';

-- 2. Create improved function to update worker rating and designation
CREATE OR REPLACE FUNCTION update_worker_rating_and_designation()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  new_designation TEXT;
  total_ratings INTEGER;
  worker_id_param UUID;
BEGIN
  -- Get the worker ID
  worker_id_param := NEW.worker_id;
  
  -- Only proceed if employer_rating_given was updated and is not null
  IF NEW.employer_rating_given IS NOT NULL AND 
     (OLD.employer_rating_given IS NULL OR OLD.employer_rating_given != NEW.employer_rating_given) THEN
    
    -- Calculate average rating for this worker from ALL submissions with ratings
    -- This includes approved, rejected, and any other status with ratings
    SELECT 
      COALESCE(AVG(employer_rating_given), 0.00),
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions 
    WHERE worker_id = worker_id_param 
      AND employer_rating_given IS NOT NULL;
    
    -- If no ratings found, set default values
    IF total_ratings = 0 THEN
      avg_rating := 0.00;
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
    WHERE user_id = worker_id_param AND role = 'worker';
    
    -- Log the update for debugging
    RAISE NOTICE 'Updated worker % rating to % and designation to % (based on % ratings)', 
      worker_id_param, avg_rating, new_designation, total_ratings;
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

-- 4. Create function to recalculate all worker ratings (for existing data)
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
    SELECT DISTINCT p.user_id
    FROM public.profiles p
    WHERE p.role = 'worker'
  LOOP
    -- Calculate average rating for this worker
    SELECT 
      COALESCE(AVG(employer_rating_given), 0.00),
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions 
    WHERE worker_id = worker_record.user_id 
      AND employer_rating_given IS NOT NULL;
    
    -- Determine designation
    IF total_ratings = 0 THEN
      avg_rating := 0.00;
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
    WHERE user_id = worker_record.user_id AND role = 'worker';
    
    RAISE NOTICE 'Recalculated worker % rating to % and designation to % (based on % ratings)', 
      worker_record.user_id, avg_rating, new_designation, total_ratings;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Recalculate all existing worker ratings
SELECT recalculate_all_worker_ratings();

-- 6. Create monitoring view for rating system
CREATE OR REPLACE VIEW worker_rating_summary AS
SELECT 
  p.user_id,
  p.full_name,
  p.rating,
  p.designation,
  p.last_rating_update,
  COUNT(ts.id) as total_submissions,
  COUNT(ts.employer_rating_given) as rated_submissions,
  COALESCE(AVG(ts.employer_rating_given), 0.00) as calculated_avg_rating
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation, p.last_rating_update
ORDER BY p.rating DESC;

COMMIT;

-- 7. Verification queries
SELECT 'Rating System Setup Complete!' as status;

-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_worker_rating_trigger';

-- Check worker ratings
SELECT 
  full_name,
  rating,
  designation,
  last_rating_update
FROM public.profiles 
WHERE role = 'worker' 
ORDER BY rating DESC;

-- Check rating summary
SELECT * FROM worker_rating_summary LIMIT 10;



