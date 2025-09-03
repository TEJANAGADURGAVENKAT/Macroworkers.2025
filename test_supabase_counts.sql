-- Test Supabase Count Queries
-- This simulates what the React app should be doing

-- Test 1: Workers count
SELECT 'Test 1 - Workers Count:' as info;
SELECT COUNT(*) as workers_count FROM public.profiles WHERE role = 'worker';

-- Test 2: Employers count  
SELECT 'Test 2 - Employers Count:' as info;
SELECT COUNT(*) as employers_count FROM public.profiles WHERE role = 'employer';

-- Test 3: Submissions count
SELECT 'Test 3 - Submissions Count:' as info;
SELECT COUNT(*) as submissions_count FROM public.task_submissions;

-- Test 4: Tasks count
SELECT 'Test 4 - Tasks Count:' as info;
SELECT COUNT(*) as tasks_count FROM public.tasks;

-- Test 5: Show all profiles with their roles
SELECT 'Test 5 - All Profiles:' as info;
SELECT id, user_id, full_name, role, email FROM public.profiles ORDER BY created_at DESC;

-- Test 6: Show all tasks
SELECT 'Test 6 - All Tasks:' as info;
SELECT id, title, created_by FROM public.tasks ORDER BY created_at DESC;

-- Test 7: Show all submissions
SELECT 'Test 7 - All Submissions:' as info;
SELECT id, task_id, worker_id, employer_id FROM public.task_submissions ORDER BY submitted_at DESC;
