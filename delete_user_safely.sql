-- Safe user deletion script
-- Run this in your Supabase SQL Editor to delete a user and all related data

-- Replace 'kavya@techvitta.in' with the actual email you want to delete
-- Or replace the user_id with the actual user ID

BEGIN;

-- First, let's find the user ID
-- Uncomment the line below and run it to find the user ID
-- SELECT id, email FROM auth.users WHERE email = 'kavya@techvitta.in';

-- Replace 'USER_ID_HERE' with the actual user ID from the query above
-- Example: '12345678-1234-1234-1234-123456789012'

-- Step 1: Delete from task_submissions (if user is a worker)
DELETE FROM public.task_submissions 
WHERE worker_id = 'USER_ID_HERE';

-- Step 2: Delete from task_assignments (if user is a worker)
DELETE FROM public.task_assignments 
WHERE worker_id = 'USER_ID_HERE';

-- Step 3: Delete from worker_documents (if user is a worker)
DELETE FROM public.worker_documents 
WHERE worker_id = 'USER_ID_HERE';

-- Step 4: Delete from worker_interviews (if user is a worker)
DELETE FROM public.worker_interviews 
WHERE worker_id = 'USER_ID_HERE';

-- Step 5: Delete from worker_status_logs (if user is a worker)
DELETE FROM public.worker_status_logs 
WHERE worker_id = 'USER_ID_HERE';

-- Step 6: Delete from tasks (if user is an employer)
DELETE FROM public.tasks 
WHERE created_by = 'USER_ID_HERE';

-- Step 7: Delete from task_submissions (if user is an employer)
DELETE FROM public.task_submissions 
WHERE employer_id = 'USER_ID_HERE';

-- Step 8: Delete from worker_interviews (if user is an employer)
DELETE FROM public.worker_interviews 
WHERE employer_id = 'USER_ID_HERE';

-- Step 9: Delete from worker_status_logs (if user changed other workers' status)
DELETE FROM public.worker_status_logs 
WHERE changed_by = 'USER_ID_HERE';

-- Step 10: Delete from worker_documents (if user verified other workers' documents)
DELETE FROM public.worker_documents 
WHERE verified_by = 'USER_ID_HERE';

-- Step 11: Delete from profiles
DELETE FROM public.profiles 
WHERE user_id = 'USER_ID_HERE';

-- Step 12: Delete from auth.users (this will cascade to other auth tables)
DELETE FROM auth.users 
WHERE id = 'USER_ID_HERE';

COMMIT;

-- If you want to delete by email instead, use this version:
-- Replace 'kavya@techvitta.in' with the actual email

/*
BEGIN;

-- Get the user ID first
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'kavya@techvitta.in';
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found with email: kavya@techvitta.in';
    END IF;
    
    -- Delete all related data
    DELETE FROM public.task_submissions WHERE worker_id = user_uuid;
    DELETE FROM public.task_assignments WHERE worker_id = user_uuid;
    DELETE FROM public.worker_documents WHERE worker_id = user_uuid;
    DELETE FROM public.worker_interviews WHERE worker_id = user_uuid;
    DELETE FROM public.worker_status_logs WHERE worker_id = user_uuid;
    DELETE FROM public.tasks WHERE created_by = user_uuid;
    DELETE FROM public.task_submissions WHERE employer_id = user_uuid;
    DELETE FROM public.worker_interviews WHERE employer_id = user_uuid;
    DELETE FROM public.worker_status_logs WHERE changed_by = user_uuid;
    DELETE FROM public.worker_documents WHERE verified_by = user_uuid;
    DELETE FROM public.profiles WHERE user_id = user_uuid;
    DELETE FROM auth.users WHERE id = user_uuid;
    
    RAISE NOTICE 'User deleted successfully: %', user_uuid;
END $$;

COMMIT;
*/


