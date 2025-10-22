-- SOLUTION FOR USER DELETION WITH RELATED DATA
-- This script provides options to handle user deletion when there are foreign key constraints

-- Step 1: Get the user ID for anitha padala
DO $$
DECLARE
    target_user_id UUID;
    task_count INTEGER;
    assignment_count INTEGER;
    submission_count INTEGER;
    payment_count INTEGER;
BEGIN
    -- Get the user ID
    SELECT user_id INTO target_user_id FROM profiles WHERE email = 'anitha@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User anitha@gmail.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: %', target_user_id;
    
    -- Count related records
    SELECT COUNT(*) INTO task_count FROM tasks WHERE created_by = target_user_id;
    SELECT COUNT(*) INTO assignment_count FROM task_assignments WHERE worker_id = target_user_id;
    SELECT COUNT(*) INTO submission_count FROM task_submissions WHERE worker_id = target_user_id;
    SELECT COUNT(*) INTO payment_count FROM task_payment_records 
    WHERE worker_id = target_user_id OR employer_id = target_user_id;
    
    RAISE NOTICE 'Related records:';
    RAISE NOTICE '  Tasks created: %', task_count;
    RAISE NOTICE '  Task assignments: %', assignment_count;
    RAISE NOTICE '  Task submissions: %', submission_count;
    RAISE NOTICE '  Payment records: %', payment_count;
    
END $$;

-- Step 2: OPTION 1 - SOFT DELETE (RECOMMENDED)
-- Instead of deleting, mark the user as inactive
UPDATE profiles 
SET 
    status = 'deleted',
    updated_at = NOW()
WHERE email = 'anitha@gmail.com';

-- Step 3: OPTION 2 - CASCADE DELETE (DANGEROUS - USE WITH CAUTION)
-- This will delete ALL related data
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
    
    RAISE NOTICE 'WARNING: This will delete ALL data for user: %', target_user_id;
    RAISE NOTICE 'Proceeding with cascade delete...';
    
    -- Delete in correct order to avoid foreign key violations
    -- 1. Delete task assignments
    DELETE FROM task_assignments WHERE worker_id = target_user_id;
    RAISE NOTICE 'Deleted task assignments';
    
    -- 2. Delete task submissions
    DELETE FROM task_submissions WHERE worker_id = target_user_id;
    RAISE NOTICE 'Deleted task submissions';
    
    -- 3. Delete payment records
    DELETE FROM task_payment_records WHERE worker_id = target_user_id OR employer_id = target_user_id;
    RAISE NOTICE 'Deleted payment records';
    
    -- 4. Delete wallet balances
    DELETE FROM wallet_balances WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted wallet balances';
    
    -- 5. Delete payment transactions
    DELETE FROM payment_transactions WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted payment transactions';
    
    -- 6. Update tasks created by this user (transfer to admin or mark as inactive)
    UPDATE tasks 
    SET 
        created_by = (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1),
        updated_at = NOW()
    WHERE created_by = target_user_id;
    RAISE NOTICE 'Transferred tasks to admin';
    
    -- 7. Finally delete the profile
    DELETE FROM profiles WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted user profile';
    
    -- 8. Delete from auth.users (if needed)
    DELETE FROM auth.users WHERE id = target_user_id;
    RAISE NOTICE 'Deleted from auth.users';
    
    RAISE NOTICE 'SUCCESS: User and all related data deleted';
    
END $$;

-- Step 4: OPTION 3 - TRANSFER DATA TO ANOTHER USER
-- Transfer all data to another user before deletion
DO $$
DECLARE
    target_user_id UUID;
    transfer_user_id UUID;
BEGIN
    -- Get the user ID to delete
    SELECT user_id INTO target_user_id FROM profiles WHERE email = 'anitha@gmail.com';
    
    -- Get a user to transfer data to (admin or another user)
    SELECT user_id INTO transfer_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User anitha@gmail.com not found';
        RETURN;
    END IF;
    
    IF transfer_user_id IS NULL THEN
        RAISE NOTICE 'No admin user found to transfer data to';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Transferring data from % to %', target_user_id, transfer_user_id;
    
    -- Transfer task assignments
    UPDATE task_assignments 
    SET worker_id = transfer_user_id 
    WHERE worker_id = target_user_id;
    
    -- Transfer task submissions
    UPDATE task_submissions 
    SET worker_id = transfer_user_id 
    WHERE worker_id = target_user_id;
    
    -- Transfer payment records
    UPDATE task_payment_records 
    SET worker_id = transfer_user_id 
    WHERE worker_id = target_user_id;
    
    UPDATE task_payment_records 
    SET employer_id = transfer_user_id 
    WHERE employer_id = target_user_id;
    
    -- Transfer wallet balances
    UPDATE wallet_balances 
    SET user_id = transfer_user_id 
    WHERE user_id = target_user_id;
    
    -- Transfer payment transactions
    UPDATE payment_transactions 
    SET user_id = transfer_user_id 
    WHERE user_id = target_user_id;
    
    -- Transfer tasks created
    UPDATE tasks 
    SET created_by = transfer_user_id 
    WHERE created_by = target_user_id;
    
    RAISE NOTICE 'Data transfer completed';
    
    -- Now delete the user
    DELETE FROM profiles WHERE user_id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RAISE NOTICE 'User deleted after data transfer';
    
END $$;

-- Step 5: Verify deletion
SELECT 
    'User deletion verification' as status,
    COUNT(*) as remaining_profiles
FROM profiles 
WHERE email = 'anitha@gmail.com';

-- Step 6: Check for orphaned records
SELECT 
    'Orphaned records check' as status,
    COUNT(*) as orphaned_assignments
FROM task_assignments ta
LEFT JOIN profiles p ON ta.worker_id = p.user_id
WHERE p.user_id IS NULL;

