-- Quick fix for task assignment issue
-- Run this if you're getting "Database configuration error" when assigning tasks

-- Step 1: Enable RLS and add basic policy
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Workers can view their own assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Employers can view assignments for their tasks" ON public.task_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.task_assignments;

-- Add simple policy that allows all authenticated users
CREATE POLICY "Allow all authenticated users" ON public.task_assignments
FOR ALL USING (auth.role() = 'authenticated');

-- Step 2: Grant permissions
GRANT ALL ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO anon;

-- Step 3: Check if table structure is correct
SELECT 'Table structure check:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Test basic functionality
SELECT 'Testing basic operations...' as info;

-- Check if we can select from the table
SELECT COUNT(*) as total_assignments FROM public.task_assignments;

-- Check if we have tasks and workers available
SELECT 
    (SELECT COUNT(*) FROM public.tasks WHERE status = 'pending') as available_tasks,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker' AND worker_status = 'active_employee') as available_workers;

SELECT '✅ Quick fix completed! Try assigning a task now.' as final_status;

