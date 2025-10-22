-- TEST THE TRIGGER FUNCTIONALITY
-- This will test if the trigger is working by inserting a test assignment

-- Step 1: Check current state
SELECT 
    'BEFORE TEST' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    COUNT(ta.id) as actual_assignments
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = t.id
WHERE t.title LIKE '%Backend Developer%'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count;

-- Step 2: Insert a test assignment (replace with actual worker_id)
-- INSERT INTO task_assignments (task_id, worker_id, status) 
-- VALUES ('4b2c5ea7-04e9-47c5-aedf-72b721e52d56', 'test-worker-id', 'assigned');

-- Step 3: Check if assigned_count was updated
-- SELECT 
--     'AFTER TEST INSERT' as info,
--     t.id,
--     t.title,
--     t.max_workers,
--     t.assigned_count,
--     COUNT(ta.id) as actual_assignments
-- FROM tasks t
-- LEFT JOIN task_assignments ta ON t.id = ta.task_id
-- WHERE t.id = '4b2c5ea7-04e9-47c5-aedf-72b721e52d56'
-- GROUP BY t.id, t.title, t.max_workers, t.assigned_count;

-- Step 4: Clean up test assignment
-- DELETE FROM task_assignments 
-- WHERE task_id = '4b2c5ea7-04e9-47c5-aedf-72b721e52d56' 
-- AND worker_id = 'test-worker-id';




