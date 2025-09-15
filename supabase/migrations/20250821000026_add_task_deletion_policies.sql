-- Add Task Deletion Policies
-- This ensures employers can delete their own tasks and related submissions

BEGIN;

-- 1. Add DELETE policy for tasks (task creators can delete their own tasks)
DROP POLICY IF EXISTS "Task creators can delete their own tasks" ON public.tasks;
CREATE POLICY "Task creators can delete their own tasks" ON public.tasks
  FOR DELETE USING (created_by = auth.uid());

-- 2. Add DELETE policy for task_submissions (task creators can delete submissions for their tasks)
DROP POLICY IF EXISTS "Task creators can delete submissions for their tasks" ON public.task_submissions;
CREATE POLICY "Task creators can delete submissions for their tasks" ON public.task_submissions
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE created_by = auth.uid()
    )
  );

-- 3. Also allow workers to delete their own submissions
DROP POLICY IF EXISTS "Workers can delete their own submissions" ON public.task_submissions;
CREATE POLICY "Workers can delete their own submissions" ON public.task_submissions
  FOR DELETE USING (worker_id = auth.uid());

-- 4. Test the policies
SELECT 'Testing Task Deletion Policies:' as info;

-- Show current user's tasks
SELECT 'Current user tasks:' as info;
SELECT id, title, created_by FROM public.tasks 
WHERE created_by = auth.uid()
ORDER BY created_at DESC;

-- Show submissions for current user's tasks
SELECT 'Submissions for current user tasks:' as info;
SELECT 
  ts.id,
  ts.task_id,
  ts.worker_id,
  ts.status,
  t.title as task_title
FROM public.task_submissions ts
JOIN public.tasks t ON ts.task_id = t.id
WHERE t.created_by = auth.uid()
ORDER BY ts.submitted_at DESC;

COMMIT;
