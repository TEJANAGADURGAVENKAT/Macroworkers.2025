-- Test the exact data that should be returned for veni malakala
-- This will help us verify what the frontend should receive

-- Step 1: Get veni malakala's user ID
SELECT 
    'VENI MALAKALA USER ID' as test_type,
    user_id,
    full_name,
    worker_status
FROM profiles 
WHERE full_name = 'veni malakala';

-- Step 2: Get interview data for veni malakala
SELECT 
    'INTERVIEW DATA FOR VENI MALAKALA' as test_type,
    wi.id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    wi.created_at
FROM worker_interviews wi
JOIN profiles w ON wi.worker_id = w.user_id
WHERE w.full_name = 'veni malakala'
ORDER BY wi.created_at DESC
LIMIT 1;

-- Step 3: Get employer name for veni malakala's interview
SELECT 
    'EMPLOYER NAME FOR VENI MALAKALA' as test_type,
    p.full_name as employer_name,
    p.user_id as employer_id
FROM profiles p
WHERE p.user_id = 'bb1f7d2b-1d96-433b-a596-830d905f6188';

-- Step 4: Complete query (what frontend should get)
SELECT 
    'COMPLETE DATA FOR VENI MALAKALA' as test_type,
    wi.id as interview_id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    w.full_name as worker_name,
    w.worker_status,
    e.full_name as employer_name,
    e.user_id as employer_user_id
FROM worker_interviews wi
JOIN profiles w ON wi.worker_id = w.user_id
LEFT JOIN profiles e ON wi.employer_id = e.user_id
WHERE w.full_name = 'veni malakala'
ORDER BY wi.created_at DESC
LIMIT 1;

