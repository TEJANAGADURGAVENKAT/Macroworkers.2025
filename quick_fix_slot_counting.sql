-- QUICK FIX FOR SLOT COUNTING - MANUAL UPDATE
-- This script will manually fix slot counts for all tasks

-- Step 1: Show current state before fix
SELECT 
    'BEFORE FIX' as status,
    COUNT(*) as total_tasks,
    SUM(max_workers) as total_slots,
    SUM(COALESCE(assigned_count, 0)) as total_assigned,
    SUM(max_workers - COALESCE(assigned_count, 0)) as total_available
FROM tasks 
WHERE status = 'active';

-- Step 2: Manual fix for all tasks
UPDATE tasks 
SET 
    assigned_count = (
        SELECT COUNT(*) 
        FROM task_assignments 
        WHERE task_assignments.task_id = tasks.id 
        AND task_assignments.status IN ('assigned', 'working', 'submitted', 'completed')
    ),
    updated_at = NOW()
WHERE status = 'active';

-- Step 3: Show state after fix
SELECT 
    'AFTER FIX' as status,
    COUNT(*) as total_tasks,
    SUM(max_workers) as total_slots,
    SUM(COALESCE(assigned_count, 0)) as total_assigned,
    SUM(max_workers - COALESCE(assigned_count, 0)) as total_available
FROM tasks 
WHERE status = 'active';

-- Step 4: Show specific tasks that were fixed
SELECT 
    id,
    title,
    max_workers,
    COALESCE(assigned_count, 0) as assigned_count,
    (max_workers - COALESCE(assigned_count, 0)) as available_slots,
    updated_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '1 day' THEN 'RECENT'
        ELSE 'EXISTING'
    END as task_type
FROM tasks 
WHERE status = 'active'
ORDER BY updated_at DESC
LIMIT 15;

-- Step 5: Test the universal trigger again
DO $$
DECLARE
    test_task_id UUID;
    test_worker_id UUID;
    before_count INTEGER;
    after_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING TRIGGER AFTER MANUAL FIX ===';
    
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
    SELECT COALESCE(assigned_count, 0) INTO before_count FROM tasks WHERE id = test_task_id;
    RAISE NOTICE 'Before assignment: %', before_count;
    
    -- Create test assignment
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (test_task_id, test_worker_id, 'assigned');
    
    -- Check if trigger worked
    SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = test_task_id;
    RAISE NOTICE 'After assignment: %', after_count;
    
    IF after_count = before_count + 1 THEN
        RAISE NOTICE 'SUCCESS: Trigger is working!';
    ELSE
        RAISE NOTICE 'ERROR: Trigger still not working!';
    END IF;
    
    -- Clean up
    DELETE FROM task_assignments WHERE task_id = test_task_id AND worker_id = test_worker_id;
    
END $$;

-- Step 6: Final verification
SELECT 
    'FINAL VERIFICATION' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN assigned_count IS NULL THEN 1 END) as null_counts,
    COUNT(CASE WHEN assigned_count = 0 THEN 1 END) as zero_counts,
    COUNT(CASE WHEN assigned_count > 0 THEN 1 END) as positive_counts
FROM tasks 
WHERE status = 'active';

