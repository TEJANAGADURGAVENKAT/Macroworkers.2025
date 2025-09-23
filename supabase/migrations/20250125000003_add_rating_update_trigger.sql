-- Add trigger to automatically update worker ratings when employer gives rating
-- This ensures the profiles.rating field is updated consistently

BEGIN;

-- Create function to update worker rating when employer gives rating
CREATE OR REPLACE FUNCTION update_worker_rating_from_submission()
RETURNS TRIGGER AS $$
DECLARE
  worker_id_param UUID;
  new_rating DECIMAL(3,2);
  current_rating DECIMAL(3,2);
  total_approved INTEGER;
  new_average_rating DECIMAL(3,2);
BEGIN
  -- Only process if employer_rating_given is being set and status is approved
  IF NEW.employer_rating_given IS NOT NULL 
     AND NEW.status = 'approved' 
     AND (OLD.employer_rating_given IS NULL OR OLD.employer_rating_given != NEW.employer_rating_given) THEN
    
    worker_id_param := NEW.worker_id;
    new_rating := NEW.employer_rating_given;
    
    -- Get current worker rating
    SELECT COALESCE(rating, 1.0) INTO current_rating
    FROM public.profiles 
    WHERE user_id = worker_id_param;
    
    -- Count total approved ratings for this worker
    SELECT COUNT(*) INTO total_approved
    FROM public.task_submissions 
    WHERE worker_id = worker_id_param 
    AND status = 'approved' 
    AND employer_rating_given IS NOT NULL;
    
    -- Calculate new average rating
    IF total_approved = 1 THEN
      -- First approved rating
      new_average_rating := new_rating;
    ELSE
      -- Calculate average of all approved ratings
      SELECT AVG(employer_rating_given) INTO new_average_rating
      FROM public.task_submissions 
      WHERE worker_id = worker_id_param 
      AND status = 'approved' 
      AND employer_rating_given IS NOT NULL;
    END IF;
    
    -- Update worker profile with new rating
    UPDATE public.profiles 
    SET 
      rating = ROUND(new_average_rating, 2),
      last_rating_update = now()
    WHERE user_id = worker_id_param;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update worker ratings
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_from_submission();

-- Update existing workers to have 1.0 rating if they have no approved ratings
UPDATE public.profiles 
SET rating = 1.0
WHERE role = 'worker' 
AND rating = 3.0 
AND user_id NOT IN (
  SELECT DISTINCT worker_id 
  FROM public.task_submissions 
  WHERE status = 'approved' 
  AND employer_rating_given IS NOT NULL
);

COMMIT;

