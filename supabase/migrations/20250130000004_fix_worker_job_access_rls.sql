-- Fix Worker Job Access RLS Policy
-- This updates the RLS policy to allow workers with appropriate status to access jobs

BEGIN;

-- Drop the restrictive rating-based policy
DROP POLICY IF EXISTS "Workers can view tasks based on rating" ON public.tasks;

-- Create a new policy that allows workers with appropriate status to view tasks
CREATE POLICY "Workers can view tasks based on status" ON public.tasks
FOR SELECT USING (
  -- Workers with appropriate status can view tasks
  (auth.role() = 'authenticated' AND 
   EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() 
     AND p.role = 'worker'
     AND p.worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee')
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

-- Also ensure workers can view tasks they have submitted to (for dashboard)
CREATE POLICY "Workers can view tasks they submitted to" ON public.tasks
FOR SELECT USING (
  id IN (
    SELECT task_id FROM public.task_submissions WHERE worker_id = auth.uid()
  )
);

COMMIT;

