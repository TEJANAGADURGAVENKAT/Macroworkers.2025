<<<<<<< HEAD
-- Test script for the rating system
-- Run this after setup_rating_system_final.sql to verify everything works

-- 1. Check if designation column exists
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'designation';

-- 2. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_worker_rating_trigger';

-- 3. Check if function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'update_worker_rating_and_designation';

-- 4. View current worker ratings and designations
SELECT 
  user_id,
  full_name,
  rating,
  designation,
  total_tasks_completed,
  total_earnings,
  last_rating_update
FROM public.profiles 
WHERE role = 'worker'
ORDER BY rating DESC;

-- 5. View worker rating summary
SELECT 
  full_name,
  rating,
  designation,
  total_tasks_completed,
  total_submissions,
  rated_submissions,
  avg_employer_rating
FROM worker_rating_summary
ORDER BY rating DESC
LIMIT 10;

-- 6. Check task_submissions with ratings
SELECT 
  ts.id,
  ts.worker_id,
  p.full_name as worker_name,
  ts.employer_rating_given,
  ts.rating_feedback,
  ts.status,
  ts.submitted_at
FROM public.task_submissions ts
LEFT JOIN public.profiles p ON ts.worker_id = p.user_id
WHERE ts.employer_rating_given IS NOT NULL
ORDER BY ts.submitted_at DESC
LIMIT 10;

-- 7. Test the trigger (uncomment and modify to test with real data)
/*
-- Example test - replace with actual submission ID
UPDATE public.task_submissions 
SET employer_rating_given = 4.5,
    rating_feedback = 'Excellent work!'
WHERE id = 'your-submission-id-here';

-- Check if worker's rating was updated
SELECT user_id, full_name, rating, designation 
FROM public.profiles 
WHERE user_id = 'your-worker-id-here';
*/
=======
-- Test Script for Rating System
-- Run this after applying the migration to verify everything works

-- 1. Check if all new columns were added
SELECT 'Checking new columns in profiles table:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('rating', 'total_tasks_completed', 'total_earnings', 'skills', 'languages')
ORDER BY column_name;

SELECT 'Checking new columns in tasks table:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN ('required_rating', 'time_slot_start', 'time_slot_end', 'time_slot_date', 'is_time_sensitive', 'difficulty')
ORDER BY column_name;

-- 2. Check if existing data was updated with defaults
SELECT 'Checking existing worker profiles:' as info;
SELECT 
  role,
  rating,
  total_tasks_completed,
  total_earnings,
  skills,
  languages
FROM profiles 
WHERE role = 'worker'
LIMIT 5;

SELECT 'Checking existing tasks:' as info;
SELECT 
  title,
  required_rating,
  difficulty,
  is_time_sensitive
FROM tasks 
LIMIT 5;

-- 3. Test the rating functions
SELECT 'Testing can_worker_access_task function:' as info;
-- This will test if a worker with rating 3.0 can access a task requiring rating 2.0
SELECT 
  p.full_name,
  p.rating as worker_rating,
  t.title as task_title,
  t.required_rating as task_required_rating,
  can_worker_access_task(p.user_id, t.id) as can_access
FROM profiles p
CROSS JOIN tasks t
WHERE p.role = 'worker' 
  AND p.rating >= 3.0
  AND t.required_rating <= 2.0
LIMIT 3;

-- 4. Check if indexes were created
SELECT 'Checking new indexes:' as info;
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%rating%' 
   OR indexname LIKE 'idx_%difficulty%'
   OR indexname LIKE 'idx_%time_slot%'
ORDER BY indexname;

-- 5. Test worker search view
SELECT 'Testing worker_search_view:' as info;
SELECT 
  full_name,
  rating,
  total_tasks_completed,
  skills,
  languages
FROM worker_search_view
LIMIT 5;

-- 6. Check RLS policies
SELECT 'Checking RLS policies:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'tasks', 'task_submissions')
ORDER BY tablename, policyname;

-- Success message
SELECT 'Rating system test completed successfully!' as status; 
>>>>>>> 8923d1417afa2f21dcb51ed1cb6520730dfd74f7
