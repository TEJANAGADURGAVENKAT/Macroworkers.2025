-- DIAGNOSE RATING ISSUES
-- Run this to understand the current state of the rating system

-- 1. Check current worker ratings
SELECT 
  'Current Worker Ratings' as section,
  full_name,
  rating,
  designation,
  last_rating_update
FROM public.profiles 
WHERE role = 'worker' 
ORDER BY rating DESC;

-- 2. Check submissions by status and rating
SELECT 
  'Submissions by Status' as section,
  status,
  COUNT(*) as total_submissions,
  COUNT(employer_rating_given) as rated_submissions,
  AVG(employer_rating_given) as avg_rating,
  MIN(employer_rating_given) as min_rating,
  MAX(employer_rating_given) as max_rating
FROM public.task_submissions 
WHERE employer_rating_given IS NOT NULL
GROUP BY status
ORDER BY status;

-- 3. Check individual worker rating breakdowns
SELECT 
  'Worker Rating Breakdown' as section,
  p.full_name,
  p.rating as profile_rating,
  p.designation,
  ts.status,
  COUNT(*) as submission_count,
  AVG(ts.employer_rating_given) as avg_rating_for_status,
  STRING_AGG(ts.employer_rating_given::text, ', ' ORDER BY ts.submitted_at) as individual_ratings
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id 
  AND ts.employer_rating_given IS NOT NULL
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation, ts.status
ORDER BY p.full_name, ts.status;

-- 4. Check if all workers have the same rating (the main issue)
SELECT 
  'Rating Distribution' as section,
  rating,
  COUNT(*) as worker_count,
  STRING_AGG(full_name, ', ') as workers_with_this_rating
FROM public.profiles 
WHERE role = 'worker'
GROUP BY rating
ORDER BY rating;

-- 5. Check for rejected submissions with ratings (should be 0 after fix)
SELECT 
  'Rejected Submissions with Ratings' as section,
  COUNT(*) as count,
  STRING_AGG(ts.id::text, ', ') as submission_ids
FROM public.task_submissions ts
WHERE ts.status = 'rejected' 
  AND ts.employer_rating_given IS NOT NULL;

-- 6. Check the current trigger function
SELECT 
  'Current Trigger Function' as section,
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'update_worker_rating_and_designation';

-- 7. Check if trigger exists
SELECT 
  'Trigger Status' as section,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_worker_rating_trigger';

-- 8. Calculate what ratings SHOULD be (based on approved submissions only)
SELECT 
  'Correct Ratings (Approved Only)' as section,
  p.full_name,
  p.rating as current_rating,
  COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) as correct_rating,
  COUNT(ts.employer_rating_given) as approved_ratings_count,
  CASE 
    WHEN COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) < 3.0 THEN 'L1'
    WHEN COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) >= 3.0 
     AND COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) < 4.0 THEN 'L2'
    ELSE 'L3'
  END as correct_designation
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id 
  AND ts.employer_rating_given IS NOT NULL
  AND ts.status = 'approved'
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating
ORDER BY correct_rating DESC;


