-- COMPREHENSIVE AUDIT FOR HARDCODED VALUES IN DATABASE
-- This script will identify and help remove hardcoded values across all tables

-- Step 1: Check for hardcoded email addresses
SELECT 
    'HARDCODED EMAILS' as category,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE email IN (
    'test@example.com',
    'admin@admin.com',
    'user@test.com',
    'demo@demo.com',
    'sample@sample.com',
    'anitha@gmail.com',
    'kavya@techvitta.in'
)
ORDER BY created_at DESC;

-- Step 2: Check for hardcoded task titles (test/demo tasks)
SELECT 
    'HARDCODED TASK TITLES' as category,
    id,
    title,
    description,
    budget,
    status,
    created_at,
    created_by
FROM tasks 
WHERE title ILIKE '%test%'
OR title ILIKE '%demo%'
OR title ILIKE '%sample%'
OR title ILIKE '%example%'
OR title ILIKE '%UNIVERSAL TRIGGER TEST%'
OR title ILIKE '%SLOT COUNTING TEST%'
OR title ILIKE '%CLEAN TRIGGER TEST%'
ORDER BY created_at DESC;

-- Step 3: Check for hardcoded user names
SELECT 
    'HARDCODED USER NAMES' as category,
    user_id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE full_name ILIKE '%test%'
OR full_name ILIKE '%demo%'
OR full_name ILIKE '%sample%'
OR full_name ILIKE '%example%'
OR full_name ILIKE '%admin%'
OR full_name ILIKE '%user%'
ORDER BY created_at DESC;

-- Step 4: Check for hardcoded phone numbers
SELECT 
    'HARDCODED PHONE NUMBERS' as category,
    user_id,
    full_name,
    phone,
    email,
    created_at
FROM profiles 
WHERE phone IN (
    '1234567890',
    '9876543210',
    '5555555555',
    '0000000000',
    '1111111111',
    '9999999999'
)
OR phone LIKE '123%'
OR phone LIKE '555%'
ORDER BY created_at DESC;

-- Step 5: Check for hardcoded task descriptions
SELECT 
    'HARDCODED DESCRIPTIONS' as category,
    id,
    title,
    description,
    created_at
FROM tasks 
WHERE description ILIKE '%test%'
OR description ILIKE '%demo%'
OR description ILIKE '%sample%'
OR description ILIKE '%example%'
OR description ILIKE '%testing%'
OR description ILIKE '%UNIVERSAL TRIGGER%'
OR description ILIKE '%SLOT COUNTING%'
ORDER BY created_at DESC;

-- Step 6: Check for hardcoded submission data
SELECT 
    'HARDCODED SUBMISSIONS' as category,
    ts.id,
    ts.task_id,
    t.title as task_title,
    ts.proof_text,
    ts.status,
    ts.submitted_at
FROM task_submissions ts
JOIN tasks t ON ts.task_id = t.id
WHERE ts.proof_text ILIKE '%test%'
OR ts.proof_text ILIKE '%demo%'
OR ts.proof_text ILIKE '%sample%'
OR ts.proof_text ILIKE '%example%'
OR ts.proof_text ILIKE '%testing%'
ORDER BY ts.submitted_at DESC;

-- Step 7: Check for hardcoded payment amounts (suspicious values)
SELECT 
    'HARDCODED PAYMENT AMOUNTS' as category,
    id,
    task_id,
    worker_id,
    amount,
    payment_status,
    created_at
FROM task_payment_records 
WHERE amount IN (0, 1, 100, 500, 1000, 9999)
OR amount::text LIKE '%.00'
ORDER BY created_at DESC;

-- Step 8: Check for hardcoded wallet balances
SELECT 
    'HARDCODED WALLET BALANCES' as category,
    user_id,
    available_balance,
    total_earned,
    pending_balance,
    updated_at
FROM wallet_balances 
WHERE available_balance IN (0, 100, 500, 1000)
OR total_earned IN (0, 100, 500, 1000)
OR pending_balance IN (0, 100, 500, 1000)
ORDER BY updated_at DESC;

-- Step 9: Check for hardcoded transaction data
SELECT 
    'HARDCODED TRANSACTIONS' as category,
    id,
    transaction_id,
    user_id,
    amount,
    status,
    description,
    created_at
FROM payment_transactions 
WHERE description ILIKE '%test%'
OR description ILIKE '%demo%'
OR description ILIKE '%sample%'
OR amount IN (0, 100, 500, 1000)
ORDER BY created_at DESC;

-- Step 10: Check for hardcoded company information
SELECT 
    'HARDCODED COMPANY INFO' as category,
    user_id,
    full_name,
    company_name,
    cin_number,
    email,
    role
FROM profiles 
WHERE company_name ILIKE '%test%'
OR company_name ILIKE '%demo%'
OR company_name ILIKE '%sample%'
OR company_name ILIKE '%example%'
OR cin_number LIKE '123%'
OR cin_number LIKE '000%'
ORDER BY created_at DESC;

-- Step 11: Check for hardcoded skills and languages
SELECT 
    'HARDCODED SKILLS/LANGUAGES' as category,
    user_id,
    full_name,
    skills,
    languages,
    email
FROM profiles 
WHERE skills::text ILIKE '%test%'
OR skills::text ILIKE '%demo%'
OR skills::text ILIKE '%sample%'
OR languages::text ILIKE '%test%'
OR languages::text ILIKE '%demo%'
ORDER BY created_at DESC;

-- Step 12: Summary of hardcoded data found
SELECT 
    'SUMMARY' as category,
    'Total Profiles' as data_type,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'SUMMARY',
    'Total Tasks',
    COUNT(*)
FROM tasks
UNION ALL
SELECT 
    'SUMMARY',
    'Total Submissions',
    COUNT(*)
FROM task_submissions
UNION ALL
SELECT 
    'SUMMARY',
    'Total Payments',
    COUNT(*)
FROM task_payment_records
UNION ALL
SELECT 
    'SUMMARY',
    'Total Transactions',
    COUNT(*)
FROM payment_transactions;

