-- Fix specific worker rating manually
-- Replace 'vivek_user_id' with the actual user ID of the worker

-- First, let's find the worker's user ID
SELECT 
  p.user_id,
  p.full_name,
  p.rating,
  p.designation
FROM public.profiles p
WHERE p.full_name ILIKE '%vivek%' AND p.role = 'worker';

-- Then check their submissions and ratings
SELECT 
  ts.id,
  ts.worker_id,
  ts.employer_rating_given,
  ts.rating_feedback,
  ts.status,
  ts.submitted_at,
  t.title as task_title
FROM public.task_submissions ts
JOIN public.tasks t ON ts.task_id = t.id
WHERE ts.worker_id = (
  SELECT p.user_id 
  FROM public.profiles p 
  WHERE p.full_name ILIKE '%vivek%' AND p.role = 'worker'
  LIMIT 1
)
ORDER BY ts.submitted_at DESC;

-- Manual rating calculation for this worker
WITH worker_ratings AS (
  SELECT 
    ts.worker_id,
    AVG(ts.employer_rating_given) as avg_rating,
    COUNT(ts.employer_rating_given) as total_ratings
  FROM public.task_submissions ts
  WHERE ts.worker_id = (
    SELECT p.user_id 
    FROM public.profiles p 
    WHERE p.full_name ILIKE '%vivek%' AND p.role = 'worker'
    LIMIT 1
  )
  AND ts.employer_rating_given IS NOT NULL
  GROUP BY ts.worker_id
)
UPDATE public.profiles 
SET 
  rating = wr.avg_rating,
  designation = CASE 
    WHEN wr.avg_rating < 3.0 THEN 'L1'
    WHEN wr.avg_rating >= 3.0 AND wr.avg_rating < 4.0 THEN 'L2'
    ELSE 'L3'
  END,
  last_rating_update = now(),
  updated_at = now()
FROM worker_ratings wr
WHERE profiles.user_id = wr.worker_id 
  AND profiles.role = 'worker';

-- Verify the update
SELECT 
  p.user_id,
  p.full_name,
  p.rating,
  p.designation,
  p.last_rating_update
FROM public.profiles p
WHERE p.full_name ILIKE '%vivek%' AND p.role = 'worker';



