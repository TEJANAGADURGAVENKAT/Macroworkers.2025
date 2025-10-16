-- Test the exact query that the frontend is running
-- This will help us understand why veni malakala is not being found

-- Step 1: Test the exact frontend query
SELECT 
    'FRONTEND QUERY TEST' as info,
    user_id,
    full_name,
    email,
    phone,
    category,
    worker_status,
    status,
    created_at
FROM profiles
WHERE role = 'worker'
    AND (
        worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee')
        OR status IN ('interview_pending', 'interview_scheduled', 'accepted')
    )
ORDER BY created_at DESC;

-- Step 2: Check specifically for veni malakala
SELECT 
    'VENI MALAKALA SPECIFIC CHECK' as info,
    user_id,
    full_name,
    email,
    phone,
    category,
    worker_status,
    status,
    created_at,
    CASE 
        WHEN worker_status IN ('interview_pending', 'interview_scheduled', 'active_employee') THEN 'MATCHES worker_status'
        WHEN status IN ('interview_pending', 'interview_scheduled', 'accepted') THEN 'MATCHES status'
        ELSE 'NO MATCH'
    END as query_match
FROM profiles
WHERE role = 'worker'
    AND full_name = 'veni malakala';

-- Step 3: Check all workers with active_employee status
SELECT 
    'ALL ACTIVE EMPLOYEES' as info,
    user_id,
    full_name,
    worker_status,
    status
FROM profiles
WHERE role = 'worker'
    AND worker_status = 'active_employee'
ORDER BY created_at DESC;

