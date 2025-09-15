-- Complete Rating System and Worker Selection System
-- This migration implements both the rating system and worker selection functionality

BEGIN;

-- 1. First, add rating fields to profiles table for workers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 3.00 CHECK (rating >= 1.00 AND rating <= 5.00),
ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_rating_update TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Add skills and languages fields to profiles table for workers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location TEXT;

-- 3. Add rating requirement and time slot fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS required_rating DECIMAL(3,2) DEFAULT 1.00 CHECK (required_rating >= 1.00 AND required_rating <= 5.00),
ADD COLUMN IF NOT EXISTS time_slot_start TIME,
ADD COLUMN IF NOT EXISTS time_slot_end TIME,
ADD COLUMN IF NOT EXISTS time_slot_date DATE,
ADD COLUMN IF NOT EXISTS is_time_sensitive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy';

-- 4. Add worker selection fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS selected_workers UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS worker_selection_type TEXT DEFAULT 'open' CHECK (worker_selection_type IN ('open', 'selected', 'invite_only'));

-- 5. Add rating and time tracking to task_submissions table
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS worker_rating_at_submission DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS employer_rating_given DECIMAL(3,2) CHECK (employer_rating_given >= 1.00 AND employer_rating_given <= 5.00),
ADD COLUMN IF NOT EXISTS rating_feedback TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS time_taken_minutes INTEGER;

-- 6. Update the existing CHECK constraint to include 'assigned' status
ALTER TABLE public.task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_status_check;

ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'assigned'::text]));

-- 7. Create a function to update worker ratings after task completion
CREATE OR REPLACE FUNCTION update_worker_rating(
  worker_id_param UUID,
  new_rating DECIMAL(3,2),
  task_id_param UUID
)
RETURNS VOID AS $$
DECLARE
  current_rating DECIMAL(3,2);
  total_completed INTEGER;
  new_average_rating DECIMAL(3,2);
BEGIN
  -- Get current worker stats
  SELECT rating, total_tasks_completed 
  INTO current_rating, total_completed
  FROM public.profiles 
  WHERE user_id = worker_id_param;
  
  -- Calculate new average rating
  IF total_completed = 0 THEN
    new_average_rating := new_rating;
  ELSE
    new_average_rating := ((current_rating * total_completed) + new_rating) / (total_completed + 1);
  END IF;
  
  -- Update worker profile with new rating and stats
  UPDATE public.profiles 
  SET 
    rating = new_average_rating,
    total_tasks_completed = total_completed + 1,
    last_rating_update = now()
  WHERE user_id = worker_id_param;
END;
$$ LANGUAGE plpgsql;

-- 8. Create a function to check if worker can access a task based on rating
CREATE OR REPLACE FUNCTION can_worker_access_task(
  worker_id_param UUID,
  task_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  worker_rating DECIMAL(3,2);
  required_rating DECIMAL(3,2);
BEGIN
  -- Get worker's current rating
  SELECT rating INTO worker_rating
  FROM public.profiles 
  WHERE user_id = worker_id_param;
  
  -- Get task's required rating
  SELECT required_rating INTO required_rating
  FROM public.tasks 
  WHERE id = task_id_param;
  
  -- Worker can access if their rating meets or exceeds required rating
  RETURN COALESCE(worker_rating, 1.00) >= COALESCE(required_rating, 1.00);
END;
$$ LANGUAGE plpgsql;

-- 9. Create a function to validate worker selection
CREATE OR REPLACE FUNCTION validate_worker_selection()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if selected workers meet the required rating
  IF NEW.selected_workers IS NOT NULL AND array_length(NEW.selected_workers, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = ANY(NEW.selected_workers)
      AND p.rating < COALESCE(NEW.required_rating, 1.00)
    ) THEN
      RAISE EXCEPTION 'Selected workers must meet the required rating for this task';
    END IF;
  END IF;
  
  -- Ensure total_budget matches payment per task × number of workers
  IF NEW.total_budget IS NOT NULL AND NEW.budget IS NOT NULL AND NEW.selected_workers IS NOT NULL THEN
    IF NEW.total_budget != (NEW.budget * array_length(NEW.selected_workers, 1)) THEN
      RAISE EXCEPTION 'Total budget must equal payment per task multiplied by number of selected workers';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to validate worker selection
DROP TRIGGER IF EXISTS validate_worker_selection_trigger ON public.tasks;
CREATE TRIGGER validate_worker_selection_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_worker_selection();

-- 11. Create a function to assign tasks to selected workers
CREATE OR REPLACE FUNCTION assign_task_to_workers(
  task_id_param UUID,
  worker_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  worker_id UUID;
BEGIN
  -- Remove any existing assignments for this task
  DELETE FROM public.task_submissions 
  WHERE task_id = task_id_param AND worker_id = ANY(worker_ids);
  
  -- Create new submissions for each selected worker
  FOREACH worker_id IN ARRAY worker_ids
  LOOP
    INSERT INTO public.task_submissions (
      task_id,
      worker_id,
      status,
      submitted_at
    ) VALUES (
      task_id_param,
      worker_id,
      'assigned', -- New status for pre-assigned tasks
      now()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 12. Create a function to get available workers for a task
CREATE OR REPLACE FUNCTION get_available_workers(
  required_rating_param DECIMAL(3,2),
  required_skills_param TEXT[] DEFAULT NULL,
  required_languages_param TEXT[] DEFAULT NULL,
  min_tasks_completed_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  rating DECIMAL(3,2),
  total_tasks_completed INTEGER,
  skills JSONB,
  languages JSONB,
  location TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.rating,
    p.total_tasks_completed,
    p.skills,
    p.languages,
    p.location
  FROM public.profiles p
  WHERE p.role = 'worker'
    AND p.rating >= required_rating_param
    AND p.total_tasks_completed >= min_tasks_completed_param
    AND (required_skills_param IS NULL OR p.skills ?| required_skills_param)
    AND (required_languages_param IS NULL OR p.languages ?| required_languages_param)
  ORDER BY p.rating DESC, p.total_tasks_completed DESC;
END;
$$ LANGUAGE plpgsql;

-- 13. Create a function to update worker skills
CREATE OR REPLACE FUNCTION update_worker_skills(
  worker_id_param UUID,
  new_skills JSONB,
  new_languages JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    skills = new_skills,
    languages = new_languages,
    updated_at = now()
  WHERE user_id = worker_id_param AND role = 'worker';
END;
$$ LANGUAGE plpgsql;

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating);
CREATE INDEX IF NOT EXISTS idx_tasks_required_rating ON public.tasks(required_rating);
CREATE INDEX IF NOT EXISTS idx_tasks_time_slot ON public.tasks(time_slot_date, time_slot_start, time_slot_end);
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON public.tasks(difficulty);
CREATE INDEX IF NOT EXISTS idx_submissions_worker_rating ON public.task_submissions(worker_rating_at_submission);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON public.profiles USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_tasks_selected_workers ON public.tasks USING GIN (selected_workers);

-- 15. Update existing worker profiles with default ratings and skills
UPDATE public.profiles 
SET 
  rating = 3.00,
  total_tasks_completed = 0,
  total_earnings = 0.00,
  skills = '["General"]'::jsonb,
  languages = '["English"]'::jsonb
WHERE role = 'worker' AND rating IS NULL;

-- 16. Update existing tasks with default rating requirements and difficulty
UPDATE public.tasks 
SET 
  required_rating = 1.00,
  is_time_sensitive = false,
  difficulty = 'easy'
WHERE required_rating IS NULL OR difficulty IS NULL;

-- 17. Set default ratings for existing workers based on their performance
UPDATE public.profiles 
SET 
  rating = CASE 
    WHEN total_tasks_completed >= 20 THEN 4.50
    WHEN total_tasks_completed >= 10 THEN 4.00
    WHEN total_tasks_completed >= 5 THEN 3.50
    ELSE 3.00
  END
WHERE role = 'worker' AND total_tasks_completed > 0;

-- 18. Add RLS policy for worker skills and languages
CREATE POLICY "Workers can update their own skills" ON public.profiles
FOR UPDATE USING (
  auth.uid() = user_id AND role = 'worker'
);

-- 19. Create a view for worker search and selection
CREATE OR REPLACE VIEW worker_search_view AS
SELECT 
  p.user_id,
  p.full_name,
  p.rating,
  p.total_tasks_completed,
  p.skills,
  p.languages,
  p.location,
  p.created_at,
  COUNT(ts.id) as active_tasks
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id 
  AND ts.status IN ('pending', 'assigned')
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.total_tasks_completed, p.skills, p.languages, p.location, p.created_at;

-- 20. Grant permissions on the view
GRANT SELECT ON worker_search_view TO authenticated;

COMMIT; 