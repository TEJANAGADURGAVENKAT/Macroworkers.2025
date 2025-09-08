-- Force UI refresh by updating timestamps and ensuring data consistency
-- This will trigger the frontend to reload rating data

BEGIN;

-- 1. Update all worker profile timestamps to force UI refresh
UPDATE public.profiles 
SET last_rating_update = now(),
    updated_at = now()
WHERE role = 'worker';

-- 2. Ensure the rating calculation is correct for all workers
UPDATE public.profiles 
SET 
  rating = COALESCE((
    SELECT GREATEST(1.00, AVG(ts.employer_rating_given))
    FROM public.task_submissions ts
    WHERE ts.worker_id = profiles.user_id 
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'
  ), 1.00),
  designation = CASE 
    WHEN COALESCE((
      SELECT GREATEST(1.00, AVG(ts.employer_rating_given))
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ), 1.00) < 3.0 THEN 'L1'
    WHEN COALESCE((
      SELECT GREATEST(1.00, AVG(ts.employer_rating_given))
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ), 1.00) >= 3.0 AND COALESCE((
      SELECT GREATEST(1.00, AVG(ts.employer_rating_given))
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ), 1.00) < 4.0 THEN 'L2'
    ELSE 'L3'
  END
WHERE role = 'worker';

-- 3. Show the current state after update
SELECT 'CURRENT WORKER RATINGS AFTER UPDATE:' as status;

SELECT 
    p.user_id,
    p.full_name,
    p.rating,
    p.designation,
    p.last_rating_update,
    -- Count approved ratings
    (SELECT COUNT(*) 
     FROM public.task_submissions ts 
     WHERE ts.worker_id = p.user_id 
       AND ts.employer_rating_given IS NOT NULL 
       AND ts.status = 'approved') as approved_ratings_count,
    -- Count total submissions
    (SELECT COUNT(*) 
     FROM public.task_submissions ts 
     WHERE ts.worker_id = p.user_id) as total_submissions
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

-- 4. Show detailed breakdown for debugging
SELECT 'DETAILED BREAKDOWN FOR UI DEBUGGING:' as status;

SELECT 
    p.full_name,
    p.rating as profile_rating,
    p.designation as profile_designation,
    -- Approved submissions with ratings
    (SELECT json_agg(
        json_build_object(
            'task_title', t.title,
            'rating', ts.employer_rating_given,
            'status', ts.status,
            'submitted_at', ts.submitted_at,
            'is_counted', (ts.status = 'approved' AND ts.employer_rating_given IS NOT NULL)
        )
    )
    FROM public.task_submissions ts
    LEFT JOIN public.tasks t ON ts.task_id = t.id
    WHERE ts.worker_id = p.user_id 
      AND ts.employer_rating_given IS NOT NULL
    ) as all_rated_submissions
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

COMMIT;

SELECT 'UI refresh completed! Please refresh your browser and check the My Ratings tab.' as result;



