-- Test the simplified approach
-- This simulates what the frontend code will now do

-- Step 1: Get interview data for a specific worker
SELECT 
    'INTERVIEW DATA FOR VENI MALAKALA' as test_type,
    wi.id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status
FROM worker_interviews wi
JOIN profiles w ON wi.worker_id = w.user_id
WHERE w.full_name = 'veni malakala'
ORDER BY wi.created_at DESC
LIMIT 1;

-- Step 2: Get employer name for that interview
SELECT 
    'EMPLOYER NAME FOR VENI MALAKALA' as test_type,
    p.full_name as employer_name,
    p.user_id as employer_id
FROM profiles p
WHERE p.user_id = 'bb1f7d2b-1d96-433b-a596-830d905f6188';

-- Step 3: Combined result (what the frontend should get)
SELECT 
    'COMBINED RESULT FOR VENI MALAKALA' as test_type,
    wi.id as interview_id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    w.full_name as worker_name,
    e.full_name as employer_name
FROM worker_interviews wi
JOIN profiles w ON wi.worker_id = w.user_id
LEFT JOIN profiles e ON wi.employer_id = e.user_id
WHERE w.full_name = 'veni malakala'
ORDER BY wi.created_at DESC
LIMIT 1;

