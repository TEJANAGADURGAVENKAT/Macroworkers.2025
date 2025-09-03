-- Fix RLS Policies for Task Loading
-- This migration ensures employers can view their own tasks

BEGIN;

-- 1. Check current RLS policies on tasks table
SELECT 'Current RLS Policies on tasks:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 2. Check if RLS is enabled on tasks table
SELECT 'RLS Status on tasks table:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tasks';

-- 3. Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employers can view their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators can view their tasks" ON public.tasks;

-- 4. Create a simple policy that allows task creators to view their tasks
CREATE POLICY "Task creators can view their tasks" ON public.tasks
  FOR SELECT USING (
    created_by = auth.uid()
  );

-- 5. Create policy for task creation
CREATE POLICY "Authenticated users can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 6. Create policy for task updates
CREATE POLICY "Task creators can update their tasks" ON public.tasks
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- 7. Test the policy by checking if current user can see their tasks
SELECT 'Testing RLS Policy:' as info;
SELECT 
  'Current auth.uid(): ' || auth.uid()::text as current_user,
  'Tasks for current user: ' || COUNT(*)::text as task_count
FROM public.tasks 
WHERE created_by = auth.uid();

-- 8. Show all tasks (for debugging)
SELECT 'All tasks in database:' as info;
SELECT id, title, status, created_by, created_at 
FROM public.tasks 
ORDER BY created_at DESC;

COMMIT;
