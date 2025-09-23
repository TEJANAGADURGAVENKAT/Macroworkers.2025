-- Add Worker Selection System
-- This migration implements the worker selection functionality for tasks

BEGIN;

-- 1. Add skills and languages fields to profiles table for workers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Add worker selection fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS selected_workers UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS worker_selection_type TEXT DEFAULT 'open' CHECK (worker_selection_type IN ('open', 'selected', 'invite_only'));

-- 3. Create a function to validate worker selection
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

-- 4. Create trigger to validate worker selection
DROP TRIGGER IF EXISTS validate_worker_selection_trigger ON public.tasks;
CREATE TRIGGER validate_worker_selection_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_worker_selection();

-- 5. Create a function to assign tasks to selected workers
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

-- 6. Add new status for pre-assigned tasks
ALTER TYPE public.task_submission_status ADD VALUE IF NOT EXISTS 'assigned';

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON public.profiles USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_tasks_selected_workers ON public.tasks USING GIN (selected_workers);

-- 8. Update existing worker profiles with default skills and languages
UPDATE public.profiles 
SET 
  skills = '["General"]'::jsonb,
  languages = '["English"]'::jsonb
WHERE role = 'worker' AND (skills IS NULL OR skills = '[]'::jsonb);

-- 9. Create a function to get available workers for a task
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

-- 10. Create a function to update worker skills
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

-- 11. Add RLS policy for worker skills and languages
CREATE POLICY "Workers can update their own skills" ON public.profiles
FOR UPDATE USING (
  auth.uid() = user_id AND role = 'worker'
);

-- 12. Create a view for worker search and selection
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

-- 13. Grant permissions on the view
GRANT SELECT ON worker_search_view TO authenticated;

COMMIT; 