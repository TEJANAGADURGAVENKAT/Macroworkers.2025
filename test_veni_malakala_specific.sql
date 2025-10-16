-- Test what should be returned for veni malakala specifically
-- This will help us understand why the frontend is not finding the data

-- Step 1: Check veni malakala's profile
SELECT 
    'VENI MALAKALA PROFILE' as test_type,
    user_id,
    full_name,
    worker_status,
    status,
    role
FROM profiles 
WHERE full_name = 'veni malakala';

-- Step 2: Check if veni malakala matches the query criteria
SELECT 
    'VENI MALAKALA QUERY MATCH' as test_type,
    user_id,
    full_name,
    worker_status,
    status,
    role,
    CASE 
        WHEN worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee') THEN 'MATCHES worker_status'
        WHEN status IN ('interview_pending', 'interview_scheduled', 'accepted') THEN 'MATCHES status'
        ELSE 'NO MATCH'
    END as query_match
FROM profiles 
WHERE full_name = 'veni malakala';

-- Step 3: Check veni malakala's interview data
SELECT 
    'VENI MALAKALA INTERVIEW' as test_type,
    wi.id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    wi.created_at
FROM worker_interviews wi
JOIN profiles w ON wi.worker_id = w.user_id
WHERE w.full_name = 'veni malakala'
ORDER BY wi.created_at DESC;

-- Step 4: Check the exact query that the frontend should run
SELECT 
    'FRONTEND QUERY SIMULATION' as test_type,
    user_id,
    full_name,
    worker_status,
    status
FROM profiles
WHERE role = 'worker'
    AND (
        worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee')
        OR status IN ('interview_pending', 'interview_scheduled', 'accepted')
    )
    AND full_name = 'veni malakala';

