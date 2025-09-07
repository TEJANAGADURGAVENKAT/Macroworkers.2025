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