-- Quick fix to recalculate worker ratings based on approved submissions only
-- This will fix the L1 designation issue

BEGIN;

-- 1. First, let's see the current state
SELECT 'BEFORE FIX - Current worker ratings:' as status;

SELECT 
    p.user_id,
    p.full_name,
    p.rating,
    p.designation,
    -- Count approved ratings
    (SELECT COUNT(*) 
     FROM public.task_submissions ts 
     WHERE ts.worker_id = p.user_id 
       AND ts.employer_rating_given IS NOT NULL 
       AND ts.status = 'approved') as approved_ratings_count,
    -- Show what the rating should be
    (SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00)
     FROM public.task_submissions ts 
     WHERE ts.worker_id = p.user_id 
       AND ts.employer_rating_given IS NOT NULL 
       AND ts.status = 'approved') as calculated_rating
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.full_name;

-- 2. Update all worker ratings based on approved submissions only
UPDATE public.profiles 
SET 
  rating = (
    SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00)
    FROM public.task_submissions ts
    WHERE ts.worker_id = profiles.user_id 
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'
  ),
  designation = CASE 
    WHEN (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) 
      FROM public.task_submissions ts 
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ) < 3.0 THEN 'L1'
    WHEN (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) 
      FROM public.task_submissions ts 
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ) >= 3.0 AND (
      SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00) 
      FROM public.task_submissions ts 
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'
    ) < 4.0 THEN 'L2'
    ELSE 'L3'
  END,
  last_rating_update = now(),
  updated_at = now()
WHERE role = 'worker';

-- 3. Show the results after fix
SELECT 'AFTER FIX - Updated worker ratings:' as status;

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
       AND ts.status = 'approved') as approved_ratings_count
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

-- 4. Show detailed breakdown for each worker
SELECT 'DETAILED BREAKDOWN:' as status;

SELECT 
    p.full_name,
    p.rating,
    p.designation,
    -- Show all approved submissions with ratings
    (SELECT json_agg(
        json_build_object(
            'task_title', t.title,
            'rating', ts.employer_rating_given,
            'status', ts.status,
            'submitted_at', ts.submitted_at
        )
    )
    FROM public.task_submissions ts
    LEFT JOIN public.tasks t ON ts.task_id = t.id
    WHERE ts.worker_id = p.user_id 
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'
    ) as approved_ratings
FROM public.profiles p
WHERE p.role = 'worker'
  AND p.rating > 1.0  -- Only show workers with actual ratings
ORDER BY p.rating DESC;

COMMIT;

SELECT 'Rating fix completed! Workers should now show correct ratings and designations.' as result;