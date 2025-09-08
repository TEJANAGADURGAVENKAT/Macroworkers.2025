-- CLEANUP REJECTED RATINGS
-- This script removes ratings from rejected submissions and recalculates worker ratings

-- 1. Remove ratings from rejected submissions
UPDATE public.task_submissions 
SET 
  employer_rating_given = NULL,
  rating_feedback = NULL
WHERE status = 'rejected' 
  AND employer_rating_given IS NOT NULL;

-- 2. Recalculate all worker ratings based on approved submissions only
UPDATE public.profiles 
SET 
  rating = GREATEST(1.00, (
    SELECT COALESCE(AVG(ts.employer_rating_given), 1.00)
    FROM public.task_submissions ts
    WHERE ts.worker_id = profiles.user_id 
      AND ts.employer_rating_given IS NOT NULL
      AND ts.status = 'approved'  -- ONLY APPROVED
  )),
  designation = CASE 
    WHEN (
      SELECT COALESCE(AVG(ts.employer_rating_given), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED
    ) < 3.0 THEN 'L1'
    WHEN (
      SELECT COALESCE(AVG(ts.employer_rating_given), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED
    ) >= 3.0 AND (
      SELECT COALESCE(AVG(ts.employer_rating_given), 1.00)
      FROM public.task_submissions ts
      WHERE ts.worker_id = profiles.user_id 
        AND ts.employer_rating_given IS NOT NULL
        AND ts.status = 'approved'  -- ONLY APPROVED
    ) < 4.0 THEN 'L2'
    ELSE 'L3'
  END,
  last_rating_update = now(),
  updated_at = now()
WHERE role = 'worker';

-- 3. Show results
SELECT 
  full_name,
  rating,
  designation,
  last_rating_update
FROM public.profiles 
WHERE role = 'worker' 
ORDER BY rating DESC;

-- 4. Show submission status breakdown
SELECT 
  status,
  COUNT(*) as total_submissions,
  COUNT(employer_rating_given) as rated_submissions
FROM public.task_submissions 
GROUP BY status
ORDER BY status;

-- 5. Show detailed worker breakdown
SELECT 
  p.full_name,
  p.rating as current_rating,
  p.designation,
  COUNT(ts_all.id) as total_submissions,
  COUNT(ts_approved_rated.id) as approved_rated_submissions,
  COALESCE(AVG(ts_approved_rated.employer_rating_given), 1.00) as calculated_avg_rating
FROM public.profiles p
LEFT JOIN public.task_submissions ts_all ON p.user_id = ts_all.worker_id
LEFT JOIN public.task_submissions ts_approved_rated ON p.user_id = ts_approved_rated.worker_id 
  AND ts_approved_rated.employer_rating_given IS NOT NULL 
  AND ts_approved_rated.status = 'approved'
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.designation
ORDER BY p.rating DESC;




