-- Simple fix for task assignment issue
-- This script will diagnose and fix the problem without changing your schema

-- First, let's check what's causing the issue
SELECT 'Checking task_assignments table...' as status;

-- Check if the table exists and has data
SELECT 
    COUNT(*) as total_assignments,
    COUNT(DISTINCT task_id) as unique_tasks,
    COUNT(DISTINCT worker_id) as unique_workers
FROM public.task_assignments;

-- Check for any constraint violations
SELECT 'Checking for constraint issues...' as status;

-- Check if there are orphaned worker_ids
SELECT 
    'Orphaned worker_ids' as issue_type,
    COUNT(*) as count
FROM public.task_assignments ta
LEFT JOIN public.profiles p ON ta.worker_id = p.user_id
WHERE p.user_id IS NULL;

-- Check if there are orphaned task_ids
SELECT 
    'Orphaned task_ids' as issue_type,
    COUNT(*) as count
FROM public.task_assignments ta
LEFT JOIN public.tasks t ON ta.task_id = t.id
WHERE t.id IS NULL;

-- Check RLS policies
SELECT 'Checking RLS policies...' as status;
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'task_assignments' 
AND schemaname = 'public';

-- If no policies exist, let's add them
DO $$ 
BEGIN
    -- Check if RLS is enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'task_assignments' 
        AND rowsecurity = true
        AND schemaname = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on task_assignments';
    END IF;
    
    -- Add basic policy for authenticated users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND policyname = 'Allow all authenticated users'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow all authenticated users" ON public.task_assignments
        FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Added basic RLS policy';
    END IF;
END $$;

-- Grant permissions if missing
GRANT ALL ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO anon;

-- Check if the table has proper permissions
SELECT 'Checking permissions...' as status;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public';

-- Test if we can insert a record (this will show any remaining issues)
SELECT 'Testing insert capability...' as status;

-- Check if there are any active tasks to assign
SELECT 
    COUNT(*) as available_tasks,
    MIN(id) as sample_task_id
FROM public.tasks 
WHERE status = 'pending' 
LIMIT 1;

-- Check if there are any workers to assign to
SELECT 
    COUNT(*) as available_workers,
    MIN(user_id) as sample_worker_id
FROM public.profiles 
WHERE role = 'worker' 
AND worker_status = 'active_employee'
LIMIT 1;

SELECT '✅ Task assignment fix completed!' as final_status;

