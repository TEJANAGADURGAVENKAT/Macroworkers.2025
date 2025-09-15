-- Quick diagnostic script to check current rating state
-- Run this first to see what needs to be fixed

-- 1. Check all worker profiles and their ratings
SELECT 
    'WORKER PROFILES' as section,
    p.user_id,
    p.full_name,
    p.rating,
    p.designation,
    p.last_rating_update
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

-- 2. Check all task submissions with ratings
SELECT 
    'TASK SUBMISSIONS WITH RATINGS' as section,
    ts.id,
    ts.worker_id,
    p.full_name as worker_name,
    ts.status,
    ts.employer_rating_given,
    ts.rating_feedback,
    ts.submitted_at,
    t.title as task_title
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
LEFT JOIN public.tasks t ON ts.task_id = t.id
WHERE ts.employer_rating_given IS NOT NULL
ORDER BY ts.submitted_at DESC;

-- 3. Check rejected submissions that still have ratings (this should be empty after fix)
SELECT 
    'REJECTED SUBMISSIONS WITH RATINGS (SHOULD BE EMPTY)' as section,
    ts.id,
    ts.worker_id,
    p.full_name as worker_name,
    ts.status,
    ts.employer_rating_given,
    ts.rating_feedback,
    ts.submitted_at
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
WHERE ts.status = 'rejected' 
  AND (ts.employer_rating_given IS NOT NULL OR ts.rating_feedback IS NOT NULL)
ORDER BY ts.submitted_at DESC;

-- 4. Calculate what each worker's rating SHOULD be based on approved submissions only
SELECT 
    'CALCULATED RATINGS (APPROVED ONLY)' as section,
    p.user_id,
    p.full_name,
    p.rating as current_rating,
    p.designation as current_designation,
    COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) as calculated_rating,
    CASE 
        WHEN COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) < 3.0 THEN 'L1'
        WHEN COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) >= 3.0 
         AND COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) < 4.0 THEN 'L2'
        ELSE 'L3'
    END as calculated_designation,
    COUNT(ts.id) as approved_ratings_count
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id 
    AND ts.employer_rating_given IS NOT NULL 
    AND ts.status = 'approved'
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation
ORDER BY calculated_rating DESC;

-- 5. Show all submissions for each worker (for debugging)
SELECT 
    'ALL SUBMISSIONS BY WORKER' as section,
    p.full_name as worker_name,
    ts.status,
    ts.employer_rating_given,
    ts.submitted_at,
    t.title as task_title
FROM public.profiles p
LEFT JOIN public.task_submissions ts ON p.user_id = ts.worker_id
LEFT JOIN public.tasks t ON ts.task_id = t.id
WHERE p.role = 'worker'
ORDER BY p.full_name, ts.submitted_at DESC;




