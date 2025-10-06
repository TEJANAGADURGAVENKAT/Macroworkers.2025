-- Fix task assignment RLS policies based on your actual database schema
-- This script will resolve the 400 Bad Request error

BEGIN;

-- 1. First, let's check if RLS is enabled and drop existing policies
SELECT 'Current RLS status:' as info, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE tablename = 'task_assignments';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "workers_insert_own_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "workers_view_own_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "employers_view_task_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "admins_view_all_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Workers can insert their own assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Workers can view their own assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Employers can view assignments for their tasks" ON public.task_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.task_assignments;

-- 2. Enable RLS on task_assignments table
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Create simple, working RLS policies
-- Policy for workers to insert their own assignments
CREATE POLICY "allow_workers_insert_assignments" 
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
CREATE POLICY "allow_workers_view_own_assignments" 
ON public.task_assignments 
FOR SELECT 
USING (
  worker_id = auth.uid()
);

-- Policy for employers to view assignments for their tasks
CREATE POLICY "allow_employers_view_assignments" 
ON public.task_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id 
    AND t.created_by = auth.uid()
  )
);

-- Policy for admins to view all assignments
CREATE POLICY "allow_admins_view_all" 
ON public.task_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- 4. Ensure the table has the required columns
ALTER TABLE public.task_assignments 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 5. Create a simple trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_task_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_task_assignments_updated_at ON public.task_assignments;
CREATE TRIGGER trigger_update_task_assignments_updated_at
  BEFORE UPDATE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assignments_updated_at();

-- 6. Ensure tasks table has the required columns for assignment limits
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS max_workers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assigned_count INTEGER DEFAULT 0;

-- 7. Create a simple function to update assigned_count (without complex triggers)
CREATE OR REPLACE FUNCTION update_task_assigned_count_simple()
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

-- 8. Create simple trigger for assignment count updates
DROP TRIGGER IF EXISTS trigger_update_assigned_count_simple ON public.task_assignments;
CREATE TRIGGER trigger_update_assigned_count_simple
  AFTER INSERT OR DELETE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assigned_count_simple();

-- 9. Initialize assigned_count for existing tasks
UPDATE public.tasks 
SET assigned_count = (
  SELECT COUNT(*) 
  FROM public.task_assignments ta 
  WHERE ta.task_id = tasks.id
)
WHERE assigned_count IS NULL;

-- 10. Test the policies by checking if they exist
SELECT 'Policies created:' as info, policyname 
FROM pg_policies 
WHERE tablename = 'task_assignments';

COMMIT;

-- Verification queries (run these after the above script)
-- Check if RLS is enabled
SELECT 'RLS Status:' as info, rowsecurity as enabled FROM pg_tables WHERE tablename = 'task_assignments';

-- Check policies
SELECT 'Policies:' as info, policyname, cmd, permissive FROM pg_policies WHERE tablename = 'task_assignments';

-- Check table structure
SELECT 'Columns:' as info, column_name, data_type FROM information_schema.columns 
WHERE table_name = 'task_assignments' ORDER BY ordinal_position;
