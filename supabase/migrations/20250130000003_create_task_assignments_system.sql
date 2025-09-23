-- Create task assignments system with proper structure
-- This creates a clean task assignment system as requested

BEGIN;

-- 1. Create task_assignments table
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'working', 'submitted', 'completed')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one assignment per worker per task
  UNIQUE(task_id, worker_id)
);

-- 2. Add max_workers and assigned_count to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS max_workers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assigned_count INTEGER DEFAULT 0;

-- 3. Enable RLS on task_assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for task_assignments
CREATE POLICY "Workers can insert their own assignments" 
ON public.task_assignments 
FOR INSERT 
WITH CHECK (worker_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'worker'
));

CREATE POLICY "Workers can view their own assignments" 
ON public.task_assignments 
FOR SELECT 
USING (worker_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'worker'
));

CREATE POLICY "Employers can view assignments for their tasks" 
ON public.task_assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tasks t 
  WHERE t.id = task_id AND t.created_by = auth.uid()
) AND EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'employer'
));

CREATE POLICY "Admins can view all assignments" 
ON public.task_assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- 5. Create function to update assigned_count
CREATE OR REPLACE FUNCTION update_task_assigned_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when new assignment is made
    UPDATE public.tasks 
    SET assigned_count = COALESCE(assigned_count, 0) + 1 
    WHERE id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when assignment is removed
    UPDATE public.tasks 
    SET assigned_count = GREATEST(COALESCE(assigned_count, 0) - 1, 0) 
    WHERE id = OLD.task_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for automatic count updates
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON public.task_assignments;
CREATE TRIGGER trigger_update_assigned_count
  AFTER INSERT OR DELETE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assigned_count();

-- 7. Create function to check assignment limits
CREATE OR REPLACE FUNCTION check_assignment_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Get current assignment count and max limit
  SELECT assigned_count, max_workers 
  INTO current_count, max_limit
  FROM public.tasks 
  WHERE id = NEW.task_id;
  
  -- Check if assignment would exceed limit
  IF max_limit IS NOT NULL AND COALESCE(current_count, 0) >= max_limit THEN
    RAISE EXCEPTION 'Assignment limit exceeded. Maximum % workers allowed for this task.', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to enforce assignment limits
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON public.task_assignments;
CREATE TRIGGER trigger_check_assignment_limit
  BEFORE INSERT ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_assignment_limit();

-- 9. Initialize assigned_count for existing tasks
UPDATE public.tasks 
SET assigned_count = COALESCE((
  SELECT COUNT(*) 
  FROM public.task_assignments 
  WHERE task_id = tasks.id
), 0)
WHERE assigned_count IS NULL OR assigned_count = 0;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_worker_id ON public.task_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON public.task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_tasks_max_workers ON public.tasks(max_workers, assigned_count);

COMMIT;
