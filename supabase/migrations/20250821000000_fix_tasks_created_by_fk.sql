-- Align tasks.created_by to reference auth.users(id) to match RLS policies
-- and app logic that sets created_by = auth.uid(). Because RLS policies
-- reference the column, we must drop and recreate them during the change.

BEGIN;

-- Drop RLS policies that reference tasks.created_by
DROP POLICY IF EXISTS "Employees can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employees can view their created tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workers can view available tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can update all tasks" ON public.tasks;
-- Also drop dependent policy on task_submissions that references t.created_by
DROP POLICY IF EXISTS "Task creators can view submissions for their tasks" ON public.task_submissions;

-- Drop existing FK if it points to the wrong table
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

-- Ensure the column type is UUID
ALTER TABLE public.tasks
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

-- Recreate FK to auth.users(id)
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Recreate RLS policies for tasks (copied from prior migration)
CREATE POLICY "Employees can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'employee'
) AND created_by = auth.uid());

CREATE POLICY "Employees can view their created tasks" 
ON public.tasks 
FOR SELECT 
USING (created_by = auth.uid() AND EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'employee'
));

CREATE POLICY "Workers can view available tasks" 
ON public.tasks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'worker'
));

CREATE POLICY "Admins can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

CREATE POLICY "Admins can update all tasks" 
ON public.tasks 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- Recreate dependent policy on task_submissions
CREATE POLICY "Task creators can view submissions for their tasks" 
ON public.task_submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tasks t 
  WHERE t.id = task_id AND t.created_by = auth.uid()
));

COMMIT;


