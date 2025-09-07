-- Fix Submissions Access
-- This ensures employers can view submissions for their tasks

BEGIN;

-- 1. Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Task creators can view submissions for their tasks" ON public.task_submissions;
DROP POLICY IF EXISTS "Workers can view their own submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Authenticated users can insert submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Task creators can update submissions" ON public.task_submissions;

-- 2. Create simple policies for task_submissions
CREATE POLICY "Task creators can view submissions for their tasks" ON public.task_submissions
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Workers can view their own submissions" ON public.task_submissions
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Authenticated users can insert submissions" ON public.task_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Task creators can update submissions" ON public.task_submissions
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE created_by = auth.uid()
    )
  );

-- 3. Test the policies
SELECT 'Testing Submissions Access:' as info;
SELECT COUNT(*) as submission_count FROM public.task_submissions 
WHERE task_id IN (SELECT id FROM public.tasks WHERE created_by = auth.uid());

-- 4. Show all submissions for debugging
SELECT 'All submissions in database:' as info;
SELECT 
  ts.id,
  ts.task_id,
  ts.worker_id,
  ts.status,
  t.title as task_title,
  t.created_by as task_creator
FROM public.task_submissions ts
LEFT JOIN public.tasks t ON ts.task_id = t.id
ORDER BY ts.submitted_at DESC;

COMMIT;
