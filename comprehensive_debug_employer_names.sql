-- COMPREHENSIVE DEBUG SCRIPT FOR EMPLOYER NAMES
-- Run this to debug why employer names are not showing

-- Step 1: Check if there are any interviews at all
SELECT 
    'TOTAL INTERVIEWS' as info,
    COUNT(*) as count
FROM worker_interviews;

-- Step 2: Check interviews with selected results
SELECT 
    'SELECTED INTERVIEWS' as info,
    COUNT(*) as count
FROM worker_interviews 
WHERE result = 'selected';

-- Step 3: Check the actual interview data with employer names
SELECT 
    'INTERVIEW DATA WITH EMPLOYER NAMES' as info,
    wi.id as interview_id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    w.full_name as worker_name,
    e.full_name as employer_name,
    wi.created_at
FROM worker_interviews wi
LEFT JOIN profiles w ON wi.worker_id = w.user_id
LEFT JOIN profiles e ON wi.employer_id = e.user_id
WHERE wi.result = 'selected'
ORDER BY wi.created_at DESC;

-- Step 4: Check if employer profiles exist and have names
SELECT 
    'EMPLOYER PROFILES CHECK' as info,
    user_id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE role = 'employer'
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Check workers with active_employee status
SELECT 
    'ACTIVE EMPLOYEES' as info,
    user_id,
    full_name,
    email,
    worker_status,
    created_at
FROM profiles 
WHERE worker_status = 'active_employee'
ORDER BY created_at DESC;

-- Step 6: Check if there are any interviews for active employees
SELECT 
    'INTERVIEWS FOR ACTIVE EMPLOYEES' as info,
    wi.id as interview_id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    w.full_name as worker_name,
    w.worker_status,
    e.full_name as employer_name
FROM worker_interviews wi
JOIN profiles w ON wi.worker_id = w.user_id
LEFT JOIN profiles e ON wi.employer_id = e.user_id
WHERE w.worker_status = 'active_employee'
ORDER BY wi.created_at DESC;

