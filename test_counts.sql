-- Test Admin Dashboard Counts
-- Run this to verify what the dashboard should show

SELECT 'Workers Count:' as info;
SELECT COUNT(*) as workers_count FROM public.profiles WHERE role = 'worker';

SELECT 'Employers Count:' as info;
SELECT COUNT(*) as employers_count FROM public.profiles WHERE role = 'employer';

SELECT 'Submissions Count:' as info;
SELECT COUNT(*) as submissions_count FROM public.task_submissions;

SELECT 'Tasks Count:' as info;
SELECT COUNT(*) as tasks_count FROM public.tasks;

SELECT 'All Profiles with Roles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;
