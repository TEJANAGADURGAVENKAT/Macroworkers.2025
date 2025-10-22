-- CLEANUP SCRIPT TO REMOVE HARDCODED VALUES
-- This script will remove test/demo/hardcoded data from the database

-- Step 1: Remove hardcoded test users
DELETE FROM profiles 
WHERE email IN (
    'test@example.com',
    'admin@admin.com',
    'user@test.com',
    'demo@demo.com',
    'sample@sample.com'
)
OR full_name ILIKE '%test%'
OR full_name ILIKE '%demo%'
OR full_name ILIKE '%sample%'
OR full_name ILIKE '%example%';

-- Step 2: Remove hardcoded test tasks
DELETE FROM tasks 
WHERE title ILIKE '%test%'
OR title ILIKE '%demo%'
OR title ILIKE '%sample%'
OR title ILIKE '%example%'
OR title ILIKE '%UNIVERSAL TRIGGER TEST%'
OR title ILIKE '%SLOT COUNTING TEST%'
OR title ILIKE '%CLEAN TRIGGER TEST%'
OR description ILIKE '%testing%'
OR description ILIKE '%UNIVERSAL TRIGGER%'
OR description ILIKE '%SLOT COUNTING%';

-- Step 3: Remove hardcoded test submissions
DELETE FROM task_submissions 
WHERE proof_text ILIKE '%test%'
OR proof_text ILIKE '%demo%'
OR proof_text ILIKE '%sample%'
OR proof_text ILIKE '%example%'
OR proof_text ILIKE '%testing%';

-- Step 4: Remove hardcoded test payments
DELETE FROM task_payment_records 
WHERE amount IN (0, 1, 100, 500, 1000, 9999)
AND created_at > NOW() - INTERVAL '7 days';

-- Step 5: Remove hardcoded test transactions
DELETE FROM payment_transactions 
WHERE description ILIKE '%test%'
OR description ILIKE '%demo%'
OR description ILIKE '%sample%'
OR description ILIKE '%example%'
OR amount IN (0, 100, 500, 1000)
AND created_at > NOW() - INTERVAL '7 days';

-- Step 6: Remove hardcoded wallet balances (reset to 0)
UPDATE wallet_balances 
SET 
    available_balance = 0,
    total_earned = 0,
    pending_balance = 0,
    updated_at = NOW()
WHERE available_balance IN (0, 100, 500, 1000)
OR total_earned IN (0, 100, 500, 1000)
OR pending_balance IN (0, 100, 500, 1000);

-- Step 7: Clean up hardcoded phone numbers
UPDATE profiles 
SET 
    phone = NULL,
    updated_at = NOW()
WHERE phone IN (
    '1234567890',
    '9876543210',
    '5555555555',
    '0000000000',
    '1111111111',
    '9999999999'
)
OR phone LIKE '123%'
OR phone LIKE '555%';

-- Step 8: Clean up hardcoded company information
UPDATE profiles 
SET 
    company_name = NULL,
    cin_number = NULL,
    updated_at = NOW()
WHERE company_name ILIKE '%test%'
OR company_name ILIKE '%demo%'
OR company_name ILIKE '%sample%'
OR company_name ILIKE '%example%'
OR cin_number LIKE '123%'
OR cin_number LIKE '000%';

-- Step 9: Clean up hardcoded skills and languages
UPDATE profiles 
SET 
    skills = '[]'::jsonb,
    languages = '[]'::jsonb,
    updated_at = NOW()
WHERE skills::text ILIKE '%test%'
OR skills::text ILIKE '%demo%'
OR skills::text ILIKE '%sample%'
OR languages::text ILIKE '%test%'
OR languages::text ILIKE '%demo%';

-- Step 10: Remove orphaned records after cleanup
-- Remove task assignments for deleted users
DELETE FROM task_assignments 
WHERE worker_id NOT IN (SELECT user_id FROM profiles);

-- Remove task submissions for deleted users
DELETE FROM task_submissions 
WHERE worker_id NOT IN (SELECT user_id FROM profiles);

-- Remove payment records for deleted users
DELETE FROM task_payment_records 
WHERE worker_id NOT IN (SELECT user_id FROM profiles)
OR employer_id NOT IN (SELECT user_id FROM profiles);

-- Remove wallet balances for deleted users
DELETE FROM wallet_balances 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

-- Remove payment transactions for deleted users
DELETE FROM payment_transactions 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

-- Step 11: Update tasks created by deleted users
UPDATE tasks 
SET 
    created_by = (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1),
    updated_at = NOW()
WHERE created_by NOT IN (SELECT user_id FROM profiles);

-- Step 12: Verification after cleanup
SELECT 
    'AFTER CLEANUP' as status,
    COUNT(*) as total_profiles
FROM profiles
UNION ALL
SELECT 
    'AFTER CLEANUP',
    COUNT(*)
FROM tasks
UNION ALL
SELECT 
    'AFTER CLEANUP',
    COUNT(*)
FROM task_submissions
UNION ALL
SELECT 
    'AFTER CLEANUP',
    COUNT(*)
FROM task_payment_records
UNION ALL
SELECT 
    'AFTER CLEANUP',
    COUNT(*)
FROM payment_transactions;

-- Step 13: Show remaining data
SELECT 
    'REMAINING PROFILES' as category,
    user_id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

SELECT 
    'REMAINING TASKS' as category,
    id,
    title,
    budget,
    status,
    created_at
FROM tasks 
ORDER BY created_at DESC
LIMIT 10;

