-- Simple rating trigger setup
-- Run this in your Supabase SQL editor to implement automatic rating updates

-- 1. Add designation field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS designation TEXT CHECK (designation IN ('L1', 'L2', 'L3')) DEFAULT 'L1';

-- 2. Create function to update worker rating and designation
CREATE OR REPLACE FUNCTION update_worker_rating_and_designation()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  new_designation TEXT;
BEGIN
  -- Only proceed if employer_rating_given was updated and is not null
  IF NEW.employer_rating_given IS NOT NULL AND 
     (OLD.employer_rating_given IS NULL OR OLD.employer_rating_given != NEW.employer_rating_given) THEN
    
    -- Calculate average rating for this worker
    SELECT COALESCE(AVG(employer_rating_given), 3.00)
    INTO avg_rating
    FROM public.task_submissions 
    WHERE worker_id = NEW.worker_id 
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
    
    -- Update worker profile
    UPDATE public.profiles 
    SET 
      rating = avg_rating,
      designation = new_designation,
      last_rating_update = now()
    WHERE user_id = NEW.worker_id AND role = 'worker';
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();

-- 4. Verify setup
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'designation';


