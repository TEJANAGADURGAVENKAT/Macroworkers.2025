-- Simple test to check employer names in interviews
-- Run this to debug the employer name issue

-- Test 1: Check if there are any interviews with selected results
SELECT 
    'SELECTED INTERVIEWS' as test_type,
    COUNT(*) as count
FROM worker_interviews 
WHERE result = 'selected';

-- Test 2: Check interviews with employer names
SELECT 
    'INTERVIEWS WITH EMPLOYER NAMES' as test_type,
    wi.id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    e.full_name as employer_name,
    w.full_name as worker_name
FROM worker_interviews wi
LEFT JOIN profiles e ON wi.employer_id = e.user_id
LEFT JOIN profiles w ON wi.worker_id = w.user_id
WHERE wi.result = 'selected'
ORDER BY wi.created_at DESC
LIMIT 5;

-- Test 3: Check if employer profiles exist
SELECT 
    'EMPLOYER PROFILES' as test_type,
    COUNT(*) as total_employers,
    COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as employers_with_names
FROM profiles 
WHERE role = 'employer';

-- Test 4: Check specific employer names
SELECT 
    'EMPLOYER NAMES' as test_type,
    user_id,
    full_name,
    email,
    role
FROM profiles 
WHERE role = 'employer'
ORDER BY created_at DESC
LIMIT 10;

