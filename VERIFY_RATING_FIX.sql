-- Verify that the rating fix is working correctly
-- This will show the current state of all workers and their ratings

SELECT 'VERIFICATION: Current Worker Ratings' as status;

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
    -- Count rejected ratings (should be 0)
    (SELECT COUNT(*) 
     FROM public.task_submissions ts 
     WHERE ts.worker_id = p.user_id 
       AND ts.employer_rating_given IS NOT NULL 
       AND ts.status = 'rejected') as rejected_ratings_count,
    -- Show what the rating should be
    (SELECT COALESCE(GREATEST(1.00, AVG(ts.employer_rating_given)), 1.00)
     FROM public.task_submissions ts 
     WHERE ts.worker_id = p.user_id 
       AND ts.employer_rating_given IS NOT NULL 
       AND ts.status = 'approved') as calculated_rating
FROM public.profiles p
WHERE p.role = 'worker'
ORDER BY p.rating DESC;

-- Show all submissions with ratings for debugging
SELECT 'VERIFICATION: All Submissions with Ratings' as status;

SELECT 
    ts.worker_id,
    p.full_name as worker_name,
    ts.status,
    ts.employer_rating_given,
    ts.submitted_at,
    t.title as task_title
FROM public.task_submissions ts
JOIN public.profiles p ON ts.worker_id = p.user_id
LEFT JOIN public.tasks t ON ts.task_id = t.id
WHERE ts.employer_rating_given IS NOT NULL
ORDER BY ts.submitted_at DESC;

SELECT 'VERIFICATION COMPLETE - Check the results above' as result;


