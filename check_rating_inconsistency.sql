-- CHECK RATING INCONSISTENCY
-- This will show the difference between profile.rating and calculated rating

-- Step 1: Check profile rating vs calculated rating
SELECT 
    'PROFILE RATING CHECK' as info,
    p.user_id,
    p.full_name,
    p.rating as profile_rating,
    p.total_tasks_completed,
    COUNT(ts.id) as total_submissions,
    COUNT(CASE WHEN ts.status = 'approved' AND ts.employer_rating_given IS NOT NULL THEN 1 END) as approved_ratings,
    CASE 
        WHEN COUNT(CASE WHEN ts.status = 'approved' AND ts.employer_rating_given IS NOT NULL THEN 1 END) > 0 
        THEN ROUND(AVG(CASE WHEN ts.status = 'approved' AND ts.employer_rating_given IS NOT NULL THEN ts.employer_rating_given END)::numeric, 2)
        ELSE 1.0
    END as calculated_rating
FROM profiles p
LEFT JOIN task_submissions ts ON p.user_id = ts.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.total_tasks_completed
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 2: Check if there are any approved ratings
SELECT 
    'APPROVED RATINGS CHECK' as info,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
    COUNT(CASE WHEN status = 'approved' AND employer_rating_given IS NOT NULL THEN 1 END) as approved_with_ratings,
    AVG(CASE WHEN status = 'approved' AND employer_rating_given IS NOT NULL THEN employer_rating_given END) as avg_rating
FROM task_submissions;




