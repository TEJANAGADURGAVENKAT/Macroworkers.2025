-- TEST UNIVERSAL TRIGGER WITH NEW TASKS
-- This script tests if the universal trigger works for newly created tasks

-- Step 1: Verify the universal trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    'UNIVERSAL TRIGGER EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'task_assignments'
AND trigger_name = 'trigger_update_task_assigned_count_universal';

-- Step 2: Test with multiple new tasks
DO $$
DECLARE
    new_task_1_id UUID;
    new_task_2_id UUID;
    test_worker_1_id UUID;
    test_worker_2_id UUID;
    test_employer_id UUID;
    before_count INTEGER;
    after_count INTEGER;
    assignment_id UUID;
BEGIN
    -- Get test users
    SELECT user_id INTO test_employer_id FROM profiles WHERE role = 'employer' LIMIT 1;
    SELECT user_id INTO test_worker_1_id FROM profiles WHERE role = 'worker' LIMIT 1 OFFSET 0;
    SELECT user_id INTO test_worker_2_id FROM profiles WHERE role = 'worker' LIMIT 1 OFFSET 1;
    
    IF test_employer_id IS NOT NULL AND test_worker_1_id IS NOT NULL THEN
        RAISE NOTICE '=== TESTING UNIVERSAL TRIGGER WITH NEW TASKS ===';
        
        -- Create first new task
        INSERT INTO tasks (
            title, 
            description, 
            budget, 
            category, 
            status, 
            max_workers, 
            assigned_count, 
            required_rating, 
            created_by,
            user_id
        ) VALUES (
            'UNIVERSAL TEST TASK 1', 
            'Testing universal trigger with first new task', 
            300.00, 
            'IT', 
            'active', 
            3, 
            0, 
            1.0, 
            test_employer_id,
            test_employer_id
        ) RETURNING id INTO new_task_1_id;
        
        RAISE NOTICE 'Created new task 1: %', new_task_1_id;
        
        -- Test assignment to first new task
        SELECT COALESCE(assigned_count, 0) INTO before_count FROM tasks WHERE id = new_task_1_id;
        RAISE NOTICE 'Task 1 before assignment: %', before_count;
        
        INSERT INTO task_assignments (task_id, worker_id, status)
        VALUES (new_task_1_id, test_worker_1_id, 'assigned')
        RETURNING id INTO assignment_id;
        
        SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = new_task_1_id;
        RAISE NOTICE 'Task 1 after assignment: %', after_count;
        
        IF after_count = before_count + 1 THEN
            RAISE NOTICE 'SUCCESS: Task 1 trigger works! % -> %', before_count, after_count;
        ELSE
            RAISE NOTICE 'ERROR: Task 1 trigger failed! % -> %', before_count, after_count;
        END IF;
        
        -- Create second new task
        INSERT INTO tasks (
            title, 
            description, 
            budget, 
            category, 
            status, 
            max_workers, 
            assigned_count, 
            required_rating, 
            created_by,
            user_id
        ) VALUES (
            'UNIVERSAL TEST TASK 2', 
            'Testing universal trigger with second new task', 
            400.00, 
            'Digital Marketing', 
            'active', 
            2, 
            0, 
            2.0, 
            test_employer_id,
            test_employer_id
        ) RETURNING id INTO new_task_2_id;
        
        RAISE NOTICE 'Created new task 2: %', new_task_2_id;
        
        -- Test assignment to second new task
        SELECT COALESCE(assigned_count, 0) INTO before_count FROM tasks WHERE id = new_task_2_id;
        RAISE NOTICE 'Task 2 before assignment: %', before_count;
        
        INSERT INTO task_assignments (task_id, worker_id, status)
        VALUES (new_task_2_id, test_worker_1_id, 'assigned');
        
        SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = new_task_2_id;
        RAISE NOTICE 'Task 2 after assignment: %', after_count;
        
        IF after_count = before_count + 1 THEN
            RAISE NOTICE 'SUCCESS: Task 2 trigger works! % -> %', before_count, after_count;
        ELSE
            RAISE NOTICE 'ERROR: Task 2 trigger failed! % -> %', before_count, after_count;
        END IF;
        
        -- Test multiple assignments to same new task
        IF test_worker_2_id IS NOT NULL THEN
            INSERT INTO task_assignments (task_id, worker_id, status)
            VALUES (new_task_2_id, test_worker_2_id, 'assigned');
            
            SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = new_task_2_id;
            RAISE NOTICE 'Task 2 after second assignment: %', after_count;
            
            IF after_count = 2 THEN
                RAISE NOTICE 'SUCCESS: Task 2 multiple assignments work! Count: %', after_count;
            ELSE
                RAISE NOTICE 'ERROR: Task 2 multiple assignments failed! Count: %', after_count;
            END IF;
        END IF;
        
        -- Test unassignment
        DELETE FROM task_assignments WHERE task_id = new_task_2_id AND worker_id = test_worker_1_id;
        SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = new_task_2_id;
        RAISE NOTICE 'Task 2 after unassignment: %', after_count;
        
        -- Clean up test tasks
        DELETE FROM task_assignments WHERE task_id IN (new_task_1_id, new_task_2_id);
        DELETE FROM tasks WHERE id IN (new_task_1_id, new_task_2_id);
        
        RAISE NOTICE '=== UNIVERSAL TRIGGER TEST COMPLETED AND CLEANED UP ===';
    ELSE
        RAISE NOTICE 'SKIP: No test users found';
    END IF;
END $$;

-- Step 3: Show current task status
SELECT 
    'CURRENT TASK STATUS' as info,
    COUNT(*) as total_tasks,
    SUM(max_workers) as total_slots,
    SUM(COALESCE(assigned_count, 0)) as total_assigned,
    SUM(max_workers - COALESCE(assigned_count, 0)) as total_available
FROM tasks 
WHERE status = 'active';

-- Step 4: Show recent tasks (including any newly created ones)
SELECT 
    id,
    title,
    max_workers,
    COALESCE(assigned_count, 0) as assigned_count,
    (max_workers - COALESCE(assigned_count, 0)) as available_slots,
    created_at,
    updated_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '5 minutes' THEN 'VERY RECENT'
        WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'RECENT'
        ELSE 'EXISTING'
    END as task_age
FROM tasks 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 15;