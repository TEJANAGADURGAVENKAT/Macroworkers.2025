-- SAFE CLEANUP SCRIPT - TARGETED REMOVAL OF HARDCODED VALUES
-- This script safely removes only obvious test/demo data

-- Step 1: Show what will be removed (DRY RUN)
SELECT 
    'PROFILES TO REMOVE' as category,
    user_id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE email IN (
    'test@example.com',
    'admin@admin.com',
    'user@test.com',
    'demo@demo.com',
    'sample@sample.com'
)
OR (full_name ILIKE '%test%' AND created_at > NOW() - INTERVAL '7 days')
OR (full_name ILIKE '%demo%' AND created_at > NOW() - INTERVAL '7 days')
OR (full_name ILIKE '%sample%' AND created_at > NOW() - INTERVAL '7 days')
ORDER BY created_at DESC;

-- Step 2: Show test tasks to remove
SELECT 
    'TASKS TO REMOVE' as category,
    id,
    title,
    description,
    budget,
    status,
    created_at
FROM tasks 
WHERE title ILIKE '%UNIVERSAL TRIGGER TEST%'
OR title ILIKE '%SLOT COUNTING TEST%'
OR title ILIKE '%CLEAN TRIGGER TEST%'
OR title ILIKE '%TEST TASK%'
OR (title ILIKE '%test%' AND created_at > NOW() - INTERVAL '7 days')
OR (title ILIKE '%demo%' AND created_at > NOW() - INTERVAL '7 days')
ORDER BY created_at DESC;

-- Step 3: SAFE REMOVAL - Only remove obvious test data
-- Remove test users (only obvious test emails)
DELETE FROM profiles 
WHERE email IN (
    'test@example.com',
    'admin@admin.com',
    'user@test.com',
    'demo@demo.com',
    'sample@sample.com'
);

-- Step 4: Remove test tasks (only obvious test titles)
DELETE FROM tasks 
WHERE title ILIKE '%UNIVERSAL TRIGGER TEST%'
OR title ILIKE '%SLOT COUNTING TEST%'
OR title ILIKE '%CLEAN TRIGGER TEST%'
OR title ILIKE '%TEST TASK%';

-- Step 5: Remove test submissions
DELETE FROM task_submissions 
WHERE proof_text ILIKE '%testing%'
OR proof_text ILIKE '%UNIVERSAL TRIGGER%'
OR proof_text ILIKE '%SLOT COUNTING%';

-- Step 6: Clean up orphaned records
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

-- Step 7: Update tasks created by deleted users
UPDATE tasks 
SET 
    created_by = (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1),
    updated_at = NOW()
WHERE created_by NOT IN (SELECT user_id FROM profiles);

-- Step 8: Clean up specific hardcoded values
-- Reset suspicious wallet balances
UPDATE wallet_balances 
SET 
    available_balance = 0,
    total_earned = 0,
    pending_balance = 0,
    updated_at = NOW()
WHERE available_balance = 100
OR total_earned = 100
OR pending_balance = 100;

-- Clean up test phone numbers
UPDATE profiles 
SET 
    phone = NULL,
    updated_at = NOW()
WHERE phone IN (
    '1234567890',
    '9876543210',
    '5555555555',
    '0000000000'
);

-- Clean up test company info
UPDATE profiles 
SET 
    company_name = NULL,
    cin_number = NULL,
    updated_at = NOW()
WHERE company_name ILIKE '%test%'
OR company_name ILIKE '%demo%'
OR cin_number LIKE '123%';

-- Step 9: Final verification
SELECT 
    'FINAL VERIFICATION' as status,
    COUNT(*) as total_profiles
FROM profiles
UNION ALL
SELECT 
    'FINAL VERIFICATION',
    COUNT(*)
FROM tasks
UNION ALL
SELECT 
    'FINAL VERIFICATION',
    COUNT(*)
FROM task_submissions
UNION ALL
SELECT 
    'FINAL VERIFICATION',
    COUNT(*)
FROM task_payment_records;

-- Step 10: Show remaining clean data
SELECT 
    'CLEAN PROFILES' as category,
    user_id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 15;

SELECT 
    'CLEAN TASKS' as category,
    id,
    title,
    budget,
    status,
    created_at
FROM tasks 
ORDER BY created_at DESC
LIMIT 15;

