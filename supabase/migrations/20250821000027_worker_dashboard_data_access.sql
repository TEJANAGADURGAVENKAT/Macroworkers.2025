-- Worker Dashboard Data Access
-- This ensures workers can view their submissions and related task data

BEGIN;

-- 1. Ensure workers can view their own submissions with task details
DROP POLICY IF EXISTS "Workers can view their own submissions with tasks" ON public.task_submissions;
CREATE POLICY "Workers can view their own submissions with tasks" ON public.task_submissions
  FOR SELECT USING (worker_id = auth.uid());

-- 2. Ensure workers can view tasks they have submitted to
DROP POLICY IF EXISTS "Workers can view tasks they submitted to" ON public.tasks;
CREATE POLICY "Workers can view tasks they submitted to" ON public.tasks
  FOR SELECT USING (
    id IN (
      SELECT task_id FROM public.task_submissions WHERE worker_id = auth.uid()
    )
  );

-- 3. Test the policies
SELECT 'Testing Worker Dashboard Access:' as info;

-- Show current user's submissions
SELECT 'Current user submissions:' as info;
SELECT 
  ts.id,
  ts.task_id,
  ts.status,
  ts.submitted_at,
  t.title as task_title,
  t.budget
FROM public.task_submissions ts
LEFT JOIN public.tasks t ON ts.task_id = t.id
WHERE ts.worker_id = auth.uid()
ORDER BY ts.submitted_at DESC;

-- Show current user's profile
SELECT 'Current user profile:' as info;
SELECT 
  user_id,
  full_name,
  role,
  email
FROM public.profiles
WHERE user_id = auth.uid();

-- Calculate worker stats
SELECT 'Worker Statistics:' as info;
SELECT 
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions,
  COALESCE(SUM(CASE WHEN status = 'approved' THEN t.budget ELSE 0 END), 0) as total_earnings
FROM public.task_submissions ts
LEFT JOIN public.tasks t ON ts.task_id = t.id
WHERE ts.worker_id = auth.uid();

COMMIT;
