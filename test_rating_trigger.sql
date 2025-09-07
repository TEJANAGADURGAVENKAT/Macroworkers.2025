-- Test script for rating trigger
-- Run this after setting up the trigger to verify it works

-- 1. Check if designation column exists
SELECT 
  column_name, 
  data_type, 
  column_default
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

-- 4. View current worker ratings (if any exist)
SELECT 
  p.user_id,
  p.full_name,
  p.rating,
  p.designation,
  COUNT(ts.id) as total_submissions,
  COUNT(CASE WHEN ts.employer_rating_given IS NOT NULL THEN 1 END) as rated_submissions,
  AVG(ts.employer_rating_given) as avg_employer_rating
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation
ORDER BY p.rating DESC;

-- 5. Test the trigger by updating a submission (uncomment to test)
-- UPDATE public.task_submissions 
-- SET employer_rating_given = 4.5
-- WHERE id = 'your-submission-id-here';

-- 6. Check worker rating after update
-- SELECT user_id, full_name, rating, designation 
-- FROM public.profiles 
-- WHERE user_id = 'your-worker-id-here';


