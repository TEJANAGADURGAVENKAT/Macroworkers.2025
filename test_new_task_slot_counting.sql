-- COMPREHENSIVE DATABASE TEST FOR NEW TASK SLOT COUNTING
-- This script will help observe what's happening with slot counting for new tasks

-- Step 1: Check current trigger status
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    'TRIGGER STATUS' as info
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'task_assignments'
ORDER BY trigger_name;

-- Step 2: Find the Backend Developer Task mentioned in the UI
SELECT 
    id,
    title,
    max_workers,
    assigned_count,
    (max_workers - COALESCE(assigned_count, 0)) as available_slots,
    created_at,
    updated_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'VERY RECENT'
        WHEN created_at > NOW() - INTERVAL '1 day' THEN 'RECENT'
        ELSE 'OLDER'
    END as task_age
FROM tasks 
WHERE title ILIKE '%Backend Developer%'
ORDER BY created_at DESC;

-- Step 3: Check assignments for Backend Developer tasks
SELECT 
    ta.id as assignment_id,
    ta.task_id,
    t.title as task_title,
    ta.worker_id,
    p.email as worker_email,
    ta.status as assignment_status,
    ta.assigned_at,
    ta.created_at
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
LEFT JOIN profiles p ON ta.worker_id = p.user_id
WHERE t.title ILIKE '%Backend Developer%'
ORDER BY ta.created_at DESC;

-- Step 4: Test trigger functionality with a new task
DO $$
DECLARE
    new_task_id UUID;
    test_worker_id UUID;
    test_employer_id UUID;
    test_assignment_id UUID;
    before_count INTEGER;
    after_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING SLOT COUNTING FOR NEW TASK ===';
    
    -- Get test users
    SELECT user_id INTO test_employer_id FROM profiles WHERE role = 'employer' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM profiles WHERE role = 'worker' LIMIT 1;
    
    IF test_employer_id IS NULL OR test_worker_id IS NULL THEN
        RAISE NOTICE 'ERROR: No test users found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Test employer: %, Test worker: %', test_employer_id, test_worker_id;
    
    -- Create a NEW test task
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
        'SLOT COUNTING TEST TASK', 
        'Testing slot counting for newly created tasks', 
        100.00, 
        'IT', 
        'active', 
        3, 
        0, 
        1.0, 
        test_employer_id,
        test_employer_id
    ) RETURNING id INTO new_task_id;
    
    RAISE NOTICE 'Created new test task: %', new_task_id;
    
    -- Check initial state
    SELECT COALESCE(assigned_count, 0) INTO before_count FROM tasks WHERE id = new_task_id;
    RAISE NOTICE 'Initial assigned_count: %', before_count;
    
    -- Create assignment
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (new_task_id, test_worker_id, 'assigned')
    RETURNING id INTO test_assignment_id;
    
    RAISE NOTICE 'Created assignment: %', test_assignment_id;
    
    -- Check if trigger updated the count
    SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = new_task_id;
    RAISE NOTICE 'After assignment assigned_count: %', after_count;
    
    -- Test result
    IF after_count = before_count + 1 THEN
        RAISE NOTICE 'SUCCESS: Trigger worked! Count: % -> %', before_count, after_count;
    ELSE
        RAISE NOTICE 'ERROR: Trigger failed! Count: % -> %', before_count, after_count;
    END IF;
    
    -- Test multiple assignments
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (new_task_id, test_worker_id, 'assigned');
    
    SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = new_task_id;
    RAISE NOTICE 'After second assignment: %', after_count;
    
    -- Clean up test data
    DELETE FROM task_assignments WHERE task_id = new_task_id;
    DELETE FROM tasks WHERE id = new_task_id;
    
    RAISE NOTICE 'Test completed and cleaned up';
    
END $$;

-- Step 5: Check recent tasks and their slot counts
SELECT 
    'RECENT TASKS SLOT ANALYSIS' as info,
    COUNT(*) as total_tasks,
    SUM(max_workers) as total_slots,
    SUM(COALESCE(assigned_count, 0)) as total_assigned,
    SUM(max_workers - COALESCE(assigned_count, 0)) as total_available
FROM tasks 
WHERE status = 'active'
AND created_at > NOW() - INTERVAL '1 day';

-- Step 6: Show recent tasks with detailed slot information
SELECT 
    id,
    title,
    max_workers,
    COALESCE(assigned_count, 0) as assigned_count,
    (max_workers - COALESCE(assigned_count, 0)) as available_slots,
    created_at,
    updated_at,
    CASE 
        WHEN assigned_count >= max_workers THEN 'FULL'
        WHEN assigned_count > 0 THEN 'PARTIAL'
        ELSE 'EMPTY'
    END as slot_status
FROM tasks 
WHERE status = 'active'
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;

-- Step 7: Check if there are any assignments without corresponding task updates
SELECT 
    'ORPHANED ASSIGNMENTS CHECK' as info,
    COUNT(*) as orphaned_assignments
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
WHERE t.assigned_count IS NULL 
OR t.assigned_count = 0
AND EXISTS (
    SELECT 1 FROM task_assignments ta2 
    WHERE ta2.task_id = t.id 
    AND ta2.status IN ('assigned', 'working', 'submitted', 'completed')
);

-- Step 8: Manual trigger test
DO $$
DECLARE
    test_task_id UUID;
    test_worker_id UUID;
    manual_count INTEGER;
BEGIN
    RAISE NOTICE '=== MANUAL TRIGGER TEST ===';
    
    -- Get a recent task
    SELECT id INTO test_task_id FROM tasks 
    WHERE status = 'active' 
    AND created_at > NOW() - INTERVAL '1 day'
    LIMIT 1;
    
    SELECT user_id INTO test_worker_id FROM profiles WHERE role = 'worker' LIMIT 1;
    
    IF test_task_id IS NULL OR test_worker_id IS NULL THEN
        RAISE NOTICE 'No test data available';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with task: %', test_task_id;
    
    -- Get current count
    SELECT COALESCE(assigned_count, 0) INTO manual_count FROM tasks WHERE id = test_task_id;
    RAISE NOTICE 'Current assigned_count: %', manual_count;
    
    -- Manually update the count (simulate what trigger should do)
    UPDATE tasks 
    SET 
        assigned_count = (
            SELECT COUNT(*) 
            FROM task_assignments 
            WHERE task_id = test_task_id 
            AND status IN ('assigned', 'working', 'submitted', 'completed')
        ),
        updated_at = NOW()
    WHERE id = test_task_id;
    
    -- Check result
    SELECT COALESCE(assigned_count, 0) INTO manual_count FROM tasks WHERE id = test_task_id;
    RAISE NOTICE 'After manual update: %', manual_count;
    
END $$;

-- Step 9: Final verification
SELECT 
    'FINAL VERIFICATION' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN assigned_count IS NULL THEN 1 END) as null_counts,
    COUNT(CASE WHEN assigned_count = 0 THEN 1 END) as zero_counts,
    COUNT(CASE WHEN assigned_count > 0 THEN 1 END) as positive_counts
FROM tasks 
WHERE status = 'active';

