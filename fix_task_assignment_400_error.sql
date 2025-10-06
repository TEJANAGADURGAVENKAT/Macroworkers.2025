-- Fix 400 Bad Request error in task assignment
-- This script addresses RLS policies and database triggers that may be causing the issue

BEGIN;

-- 1. First, let's check and fix RLS policies for task_assignments table
-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Workers can insert their own assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Workers can view their own assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Employers can view assignments for their tasks" ON public.task_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.task_assignments;

-- 2. Create simplified and working RLS policies
-- Policy for workers to insert their own assignments
CREATE POLICY "workers_insert_own_assignments" 
ON public.task_assignments 
FOR INSERT 
WITH CHECK (
  worker_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'worker'
  )
);

-- Policy for workers to view their own assignments
CREATE POLICY "workers_view_own_assignments" 
ON public.task_assignments 
FOR SELECT 
USING (
  worker_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'worker'
  )
);

-- Policy for employers to view assignments for their tasks
CREATE POLICY "employers_view_task_assignments" 
ON public.task_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id 
    AND t.created_by = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'employer'
  )
);

-- Policy for admins to view all assignments
CREATE POLICY "admins_view_all_assignments" 
ON public.task_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- 3. Drop and recreate the assignment limit check function with better error handling
DROP FUNCTION IF EXISTS check_assignment_limit() CASCADE;

CREATE OR REPLACE FUNCTION check_assignment_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
  task_exists BOOLEAN;
BEGIN
  -- First check if the task exists
  SELECT EXISTS(SELECT 1 FROM public.tasks WHERE id = NEW.task_id) INTO task_exists;
  
  IF NOT task_exists THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  
  -- Get current assignment count and max limit with explicit table reference
  SELECT COALESCE(t.assigned_count, 0), COALESCE(t.max_workers, 1)
  INTO current_count, max_limit
  FROM public.tasks t
  WHERE t.id = NEW.task_id;
  
  -- Check if assignment would exceed limit
  IF max_limit IS NOT NULL AND current_count >= max_limit THEN
    RAISE EXCEPTION 'Assignment limit exceeded. Maximum % workers allowed for this task.', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop and recreate the assigned count update function
DROP FUNCTION IF EXISTS update_task_assigned_count() CASCADE;

CREATE OR REPLACE FUNCTION update_task_assigned_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when new assignment is made
    UPDATE public.tasks t
    SET assigned_count = COALESCE(t.assigned_count, 0) + 1 
    WHERE t.id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when assignment is removed
    UPDATE public.tasks t
    SET assigned_count = GREATEST(COALESCE(t.assigned_count, 0) - 1, 0) 
    WHERE t.id = OLD.task_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Recreate triggers
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON public.task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON public.task_assignments;

CREATE TRIGGER trigger_check_assignment_limit
  BEFORE INSERT ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_assignment_limit();

CREATE TRIGGER trigger_update_assigned_count
  AFTER INSERT OR DELETE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assigned_count();

-- 6. Ensure all tasks have proper assigned_count values
UPDATE public.tasks t
SET assigned_count = (
  SELECT COUNT(*) 
  FROM public.task_assignments ta 
  WHERE ta.task_id = t.id AND ta.status = 'assigned'
)
WHERE t.assigned_count IS NULL;

-- 7. Add missing columns if they don't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS max_workers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assigned_count INTEGER DEFAULT 0;

-- 8. Ensure RLS is enabled on task_assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

COMMIT;
