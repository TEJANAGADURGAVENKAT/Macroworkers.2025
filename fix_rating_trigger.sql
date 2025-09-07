-- Create rating recalculation trigger and designation system
-- Run this in your Supabase SQL editor to implement automatic rating updates

BEGIN;

-- 1. Add designation field to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS designation TEXT CHECK (designation IN ('L1', 'L2', 'L3')) DEFAULT 'L1';

-- 2. Create function to calculate average rating and designation
CREATE OR REPLACE FUNCTION update_worker_rating_and_designation()
RETURNS TRIGGER AS $$
DECLARE
  worker_id_param UUID;
  avg_rating DECIMAL(3,2);
  new_designation TEXT;
  total_ratings INTEGER;
BEGIN
  -- Get the worker_id from the updated submission
  worker_id_param := NEW.worker_id;
  
  -- Only proceed if employer_rating_given was actually updated and is not null
  IF NEW.employer_rating_given IS NOT NULL AND 
     (OLD.employer_rating_given IS NULL OR OLD.employer_rating_given != NEW.employer_rating_given) THEN
    
    -- Calculate average rating for this worker from all approved submissions
    SELECT 
      COALESCE(AVG(employer_rating_given), 0.00),
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions 
    WHERE worker_id = worker_id_param 
      AND employer_rating_given IS NOT NULL
      AND status = 'approved';
    
    -- Determine designation based on average rating
    IF avg_rating < 3.0 THEN
      new_designation := 'L1';
    ELSIF avg_rating >= 3.0 AND avg_rating < 4.0 THEN
      new_designation := 'L2';
    ELSE
      new_designation := 'L3';
    END IF;
    
    -- Update the worker's profile with new rating and designation
    UPDATE public.profiles 
    SET 
      rating = avg_rating,
      designation = new_designation,
      last_rating_update = now(),
      updated_at = now()
    WHERE user_id = worker_id_param AND role = 'worker';
    
    -- Log the update for debugging
    RAISE NOTICE 'Updated worker % rating to % and designation to %', 
      worker_id_param, avg_rating, new_designation;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to automatically update ratings
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();

-- 4. Create function to initialize ratings for existing workers
CREATE OR REPLACE FUNCTION initialize_worker_ratings()
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
      COALESCE(AVG(employer_rating_given), 3.00), -- Default to 3.0 if no ratings
      COUNT(*)
    INTO avg_rating, total_ratings
    FROM public.task_submissions 
    WHERE worker_id = worker_record.user_id 
      AND employer_rating_given IS NOT NULL
      AND status = 'approved';
    
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
    WHERE user_id = worker_record.user_id;
    
  END LOOP;
  
  RAISE NOTICE 'Initialized ratings for all workers';
END;
$$ LANGUAGE plpgsql;

-- 5. Run the initialization function to set up existing workers
SELECT initialize_worker_ratings();

-- 6. Create a view for easy monitoring of worker ratings
CREATE OR REPLACE VIEW worker_rating_summary AS
SELECT 
  p.user_id,
  p.full_name,
  p.rating,
  p.designation,
  p.total_tasks_completed,
  COUNT(ts.id) as total_submissions,
  COUNT(CASE WHEN ts.employer_rating_given IS NOT NULL THEN 1 END) as rated_submissions,
  AVG(ts.employer_rating_given) as avg_employer_rating,
  p.last_rating_update
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation, p.total_tasks_completed, p.last_rating_update
ORDER BY p.rating DESC;

-- 7. Grant permissions on the view
GRANT SELECT ON worker_rating_summary TO authenticated;

-- 8. Verify the setup
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'designation';

COMMIT;

