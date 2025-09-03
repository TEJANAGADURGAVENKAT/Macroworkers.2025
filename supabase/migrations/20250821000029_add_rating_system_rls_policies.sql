-- Add RLS Policies for Rating System
-- This ensures proper access control for rating-based task assignment

BEGIN;

-- 1. Enable RLS on all tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies that might conflict
DROP POLICY IF EXISTS "Workers can view tasks based on rating" ON public.tasks;
DROP POLICY IF EXISTS "Workers can view their own rating" ON public.profiles;
DROP POLICY IF EXISTS "Employers can rate workers" ON public.task_submissions;

-- 3. Create policy for workers to view tasks based on their rating
CREATE POLICY "Workers can view tasks based on rating" ON public.tasks
FOR SELECT USING (
  -- Workers can only see tasks they're qualified for based on rating
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'worker'
     AND p.rating >= COALESCE(tasks.required_rating, 1.00)
   ))
  OR
  -- Employers can see all tasks they created
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'employer'
     AND p.user_id = tasks.created_by
   ))
  OR
  -- Admins can see all tasks
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'admin'
   ))
);

-- 4. Create policy for workers to view their own rating and stats
CREATE POLICY "Workers can view their own rating" ON public.profiles
FOR SELECT USING (
  -- Users can view their own profile
  auth.uid() = user_id
  OR
  -- Employers can view worker profiles for rating purposes
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'employer'
   ))
  OR
  -- Admins can view all profiles
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'admin'
   ))
);

-- 5. Create policy for employers to rate workers after task completion
CREATE POLICY "Employers can rate workers" ON public.task_submissions
FOR UPDATE USING (
  -- Employers can update submissions for tasks they created
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.tasks t 
     WHERE t.id = task_submissions.task_id 
     AND t.created_by = auth.uid()
   ))
  OR
  -- Admins can update all submissions
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'admin'
   ))
);

-- 6. Create policy for workers to view their submission ratings
CREATE POLICY "Workers can view their submission ratings" ON public.task_submissions
FOR SELECT USING (
  -- Workers can view their own submissions
  auth.uid() = worker_id
  OR
  -- Employers can view submissions for their tasks
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.tasks t 
     WHERE t.id = task_submissions.task_id 
     AND t.created_by = auth.uid()
   ))
  OR
  -- Admins can view all submissions
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'admin'
   ))
);

-- 7. Create policy for time-sensitive task access
CREATE POLICY "Time-sensitive task access control" ON public.tasks
FOR SELECT USING (
  -- For time-sensitive tasks, check if current time is within slot
  (NOT is_time_sensitive) OR
  (
    is_time_sensitive AND
    (
      -- Current time is within the time slot
      (time_slot_date = CURRENT_DATE AND
       CURRENT_TIME BETWEEN time_slot_start AND time_slot_end)
      OR
      -- Task is not yet started
      (time_slot_date > CURRENT_DATE)
      OR
      -- Task is past due but still accessible for a grace period (24 hours)
      (time_slot_date < CURRENT_DATE AND 
       time_slot_date >= CURRENT_DATE - INTERVAL '1 day')
    )
  )
);

-- 8. Create policy for rating updates
CREATE POLICY "Rating update access" ON public.profiles
FOR UPDATE USING (
  -- Workers can update their own profile (except rating)
  (auth.uid() = user_id AND 
   NOT (TG_OP = 'UPDATE' AND OLD.rating IS DISTINCT FROM NEW.rating))
  OR
  -- Employers can update worker ratings after task completion
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'employer'
   ))
  OR
  -- Admins can update all profiles
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'admin'
   ))
);

-- 9. Create function to enforce rating-based access
CREATE OR REPLACE FUNCTION enforce_rating_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if worker is trying to access a task they're not qualified for
  IF EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = NEW.task_id 
    AND t.required_rating > (
      SELECT COALESCE(rating, 1.00) 
      FROM public.profiles 
      WHERE user_id = NEW.worker_id
    )
  ) THEN
    RAISE EXCEPTION 'Worker rating does not meet task requirements';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to enforce rating access on submission creation
DROP TRIGGER IF EXISTS enforce_rating_access_trigger ON public.task_submissions;
CREATE TRIGGER enforce_rating_access_trigger
  BEFORE INSERT ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_rating_access();

COMMIT; 