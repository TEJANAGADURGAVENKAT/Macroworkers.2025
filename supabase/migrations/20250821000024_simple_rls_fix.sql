-- Simple RLS Fix for Tasks
-- This ensures employers can view their tasks

BEGIN;

-- 1. Check current RLS status
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tasks';

-- 2. Drop all existing policies on tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employers can view their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators can view their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators can update their tasks" ON public.tasks;

-- 3. Create simple policies
CREATE POLICY "Enable read access for task creators" ON public.tasks
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Enable insert for authenticated users" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for task creators" ON public.tasks
  FOR UPDATE USING (created_by = auth.uid());

-- 4. Test the policies
SELECT 'Testing policies:' as info;
SELECT 
  'Current user: ' || auth.uid()::text as current_user,
  'Tasks count: ' || COUNT(*)::text as task_count
FROM public.tasks 
WHERE created_by = auth.uid();

COMMIT;
