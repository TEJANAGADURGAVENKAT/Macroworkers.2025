-- SIMPLE FIX - Copy and paste this entire block into Supabase SQL Editor

-- 1. Fix the trigger function
CREATE OR REPLACE FUNCTION update_worker_rating_and_designation()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  new_designation TEXT;
BEGIN
  IF NEW.employer_rating_given IS NOT NULL AND 
     (OLD.employer_rating_given IS NULL OR OLD.employer_rating_given != NEW.employer_rating_given) THEN
    
    SELECT COALESCE(AVG(employer_rating_given), 0.00)
    INTO avg_rating
    FROM public.task_submissions 
    WHERE worker_id = NEW.worker_id 
      AND employer_rating_given IS NOT NULL;
    
    IF avg_rating < 3.0 THEN
      new_designation := 'L1';
    ELSIF avg_rating >= 3.0 AND avg_rating < 4.0 THEN
      new_designation := 'L2';
    ELSE
      new_designation := 'L3';
    END IF;
    
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

-- 2. Recreate trigger
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();

-- 3. Fix vivek's rating immediately
UPDATE public.profiles 
SET 
  rating = 4.0,
  designation = 'L2',
  last_rating_update = now()
WHERE full_name ILIKE '%vivek%' AND role = 'worker';

-- 4. Check result
SELECT full_name, rating, designation FROM public.profiles WHERE full_name ILIKE '%vivek%' AND role = 'worker';





