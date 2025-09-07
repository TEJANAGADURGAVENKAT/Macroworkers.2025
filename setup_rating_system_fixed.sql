-- Fixed rating system setup
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Add designation field to profiles table (only missing field)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS designation TEXT CHECK (designation IN ('L1', 'L2', 'L3')) DEFAULT 'L1';

-- 2. Create function to update worker rating and designation
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
      COALESCE(AVG(employer_rating_given), 3.00),
      COUNT(*)
    INTO avg_rating, total_ratings
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

-- 3. Create trigger to automatically update ratings
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.task_submissions;
CREATE TRIGGER update_worker_rating_trigger
  AFTER UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating_and_designation();

-- 4. Initialize existing workers with default ratings and designations
UPDATE public.profiles 
SET 
  designation = CASE 
    WHEN rating < 3.0 THEN 'L1'
    WHEN rating >= 3.0 AND rating < 4.0 THEN 'L2'
    ELSE 'L3'
  END,
  updated_at = now()
WHERE role = 'worker' AND designation IS NULL;

-- 5. Create a view for monitoring worker ratings (FIXED - no ellipsis)
CREATE OR REPLACE VIEW worker_rating_summary AS
SELECT 
  p.user_id,
  p.full_name,
  p.rating,
  p.designation,
  p.total_tasks_completed,
  p.total_earnings,
  COUNT(ts.id) as total_submissions,
  COUNT(CASE WHEN ts.employer_rating_given IS NOT NULL THEN 1 END) as rated_submissions,
  AVG(ts.employer_rating_given) as avg_employer_rating,
  p.last_rating_update,
  p.created_at
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation, p.total_tasks_completed, 
         p.total_earnings, p.last_rating_update, p.created_at
ORDER BY p.rating DESC, p.total_tasks_completed DESC;

-- 6. Grant permissions on the view
GRANT SELECT ON worker_rating_summary TO authenticated;

-- 7. Verify the setup
SELECT 
  'profiles' as table_name,
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'designation'

UNION ALL

SELECT 
  'task_submissions' as table_name,
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'task_submissions' 
  AND column_name IN ('employer_rating_given', 'rating_feedback')

ORDER BY table_name, column_name;

-- 8. Check if trigger was created successfully
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_worker_rating_trigger';

COMMIT;


