-- FIX RATING INCONSISTENCY
-- This will fix the rating display issue between profile and calculated rating

-- Step 1: Update profile.rating to match calculated rating
UPDATE profiles 
SET rating = (
    SELECT 
        CASE 
            WHEN COUNT(CASE WHEN ts.status = 'approved' AND ts.employer_rating_given IS NOT NULL THEN 1 END) > 0 
            THEN ROUND(AVG(CASE WHEN ts.status = 'approved' AND ts.employer_rating_given IS NOT NULL THEN ts.employer_rating_given END)::numeric, 2)
            ELSE 1.0
        END
    FROM task_submissions ts 
    WHERE ts.worker_id = profiles.user_id
)
WHERE role = 'worker';

-- Step 2: Verify the fix
SELECT 
    'AFTER FIX' as info,
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
    END as calculated_rating,
    CASE 
        WHEN p.rating = CASE 
            WHEN COUNT(CASE WHEN ts.status = 'approved' AND ts.employer_rating_given IS NOT NULL THEN 1 END) > 0 
            THEN ROUND(AVG(CASE WHEN ts.status = 'approved' AND ts.employer_rating_given IS NOT NULL THEN ts.employer_rating_given END)::numeric, 2)
            ELSE 1.0
        END THEN 'FIXED ✅'
        ELSE 'STILL BROKEN ❌'
    END as status_check
FROM profiles p
LEFT JOIN task_submissions ts ON p.user_id = ts.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.rating, p.total_tasks_completed
ORDER BY p.created_at DESC
LIMIT 5;




