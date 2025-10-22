-- INVESTIGATE USER DELETION ERROR FOR ANITHA PADALA
-- This script will help identify why the user cannot be deleted

-- Step 1: Find the user ID for anitha padala
SELECT 
    user_id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE email = 'anitha@gmail.com' 
OR full_name ILIKE '%anitha%'
OR full_name ILIKE '%padala%';

-- Step 2: Check what data is associated with this user
-- Check task assignments
SELECT 
    'task_assignments' as table_name,
    COUNT(*) as record_count
FROM task_assignments 
WHERE worker_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com');

-- Check task submissions
SELECT 
    'task_submissions' as table_name,
    COUNT(*) as record_count
FROM task_submissions 
WHERE worker_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com');

-- Check tasks created by this user
SELECT 
    'tasks_created' as table_name,
    COUNT(*) as record_count
FROM tasks 
WHERE created_by = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com');

-- Check payment records
SELECT 
    'task_payment_records' as table_name,
    COUNT(*) as record_count
FROM task_payment_records 
WHERE worker_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com')
OR employer_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com');

-- Check wallet balances
SELECT 
    'wallet_balances' as table_name,
    COUNT(*) as record_count
FROM wallet_balances 
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com');

-- Check payment transactions
SELECT 
    'payment_transactions' as table_name,
    COUNT(*) as record_count
FROM payment_transactions 
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com');

-- Step 3: Check foreign key constraints that might prevent deletion
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND ccu.table_name = 'profiles'
AND ccu.column_name = 'user_id';

-- Step 4: Show detailed records for this user
-- Task assignments
SELECT 
    'TASK ASSIGNMENTS' as data_type,
    ta.id,
    ta.task_id,
    t.title as task_title,
    ta.status,
    ta.assigned_at
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
WHERE ta.worker_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com')
LIMIT 5;

-- Task submissions
SELECT 
    'TASK SUBMISSIONS' as data_type,
    ts.id,
    ts.task_id,
    t.title as task_title,
    ts.status,
    ts.submitted_at
FROM task_submissions ts
JOIN tasks t ON ts.task_id = t.id
WHERE ts.worker_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com')
LIMIT 5;

-- Tasks created
SELECT 
    'TASKS CREATED' as data_type,
    t.id,
    t.title,
    t.status,
    t.created_at
FROM tasks t
WHERE t.created_by = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com')
LIMIT 5;

-- Payment records
SELECT 
    'PAYMENT RECORDS' as data_type,
    tpr.id,
    tpr.task_id,
    t.title as task_title,
    tpr.payment_status,
    tpr.amount
FROM task_payment_records tpr
JOIN tasks t ON tpr.task_id = t.id
WHERE tpr.worker_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com')
OR tpr.employer_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com')
LIMIT 5;

