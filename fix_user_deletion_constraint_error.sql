-- FIX CHECK CONSTRAINT ERROR FOR USER STATUS
-- This script finds valid status values and provides correct deletion solution

-- Step 1: Check what status values are allowed in profiles table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';

-- Step 2: Check current status values in profiles table
SELECT DISTINCT status, COUNT(*) as count
FROM profiles 
GROUP BY status
ORDER BY count DESC;

-- Step 3: Check the worker_status column (this might be the correct field)
SELECT DISTINCT worker_status, COUNT(*) as count
FROM profiles 
GROUP BY worker_status
ORDER BY count DESC;

-- Step 4: CORRECTED SOLUTION - Use valid status values
-- Option 1: Use 'rejected' status (if it's valid)
UPDATE profiles 
SET 
    worker_status = 'rejected',
    updated_at = NOW()
WHERE email = 'anitha@gmail.com';

-- Option 2: Use 'inactive' or similar status
-- UPDATE profiles 
-- SET 
--     worker_status = 'inactive',
--     updated_at = NOW()
-- WHERE email = 'anitha@gmail.com';

-- Option 3: Add a custom field for deletion tracking
-- ALTER TABLE profiles ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
-- UPDATE profiles 
-- SET 
--     is_deleted = TRUE,
--     updated_at = NOW()
-- WHERE email = 'anitha@gmail.com';

-- Step 5: Verify the update worked
SELECT 
    user_id,
    email,
    full_name,
    status,
    worker_status,
    updated_at
FROM profiles 
WHERE email = 'anitha@gmail.com';

-- Step 6: Alternative approach - Handle the submission first, then delete
-- This approach removes the foreign key constraint issue

-- Step 6a: Check what we need to handle
SELECT 
    'task_submissions' as table_name,
    COUNT(*) as count
FROM task_submissions 
WHERE worker_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com');

-- Step 6b: Handle the submission (reject it)
UPDATE task_submissions 
SET 
    status = 'rejected',
    reviewed_at = NOW(),
    reviewer_notes = 'User account deleted'
WHERE worker_id = (SELECT user_id FROM profiles WHERE email = 'anitha@gmail.com');

-- Step 6c: Now we can safely delete the user
-- DELETE FROM profiles WHERE email = 'anitha@gmail.com';

-- Step 7: Complete deletion approach (if you want to actually delete)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT user_id INTO target_user_id FROM profiles WHERE email = 'anitha@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User anitha@gmail.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Deleting user: %', target_user_id;
    
    -- Delete in correct order to avoid foreign key violations
    -- 1. Delete task submissions
    DELETE FROM task_submissions WHERE worker_id = target_user_id;
    RAISE NOTICE 'Deleted task submissions';
    
    -- 2. Delete task assignments
    DELETE FROM task_assignments WHERE worker_id = target_user_id;
    RAISE NOTICE 'Deleted task assignments';
    
    -- 3. Delete wallet balances
    DELETE FROM wallet_balances WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted wallet balances';
    
    -- 4. Delete payment transactions
    DELETE FROM payment_transactions WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted payment transactions';
    
    -- 5. Delete payment records
    DELETE FROM task_payment_records WHERE worker_id = target_user_id OR employer_id = target_user_id;
    RAISE NOTICE 'Deleted payment records';
    
    -- 6. Transfer tasks created by this user to admin
    UPDATE tasks 
    SET 
        created_by = (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1),
        updated_at = NOW()
    WHERE created_by = target_user_id;
    RAISE NOTICE 'Transferred tasks to admin';
    
    -- 7. Finally delete the profile
    DELETE FROM profiles WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted user profile';
    
    -- 8. Delete from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
    RAISE NOTICE 'Deleted from auth.users';
    
    RAISE NOTICE 'SUCCESS: User completely deleted';
    
END $$;

-- Step 8: Verification
SELECT 
    'User deletion verification' as status,
    COUNT(*) as remaining_profiles
FROM profiles 
WHERE email = 'anitha@gmail.com';

