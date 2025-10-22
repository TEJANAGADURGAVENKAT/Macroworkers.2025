-- Test if the slot counting trigger is working properly
-- This script will help diagnose the slot counting issue

-- 1. Check if the trigger exists and is active
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'task_assignments'
AND trigger_name LIKE '%slot%';

-- 2. Check the trigger function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%slot%';

-- 3. Test the trigger by creating a test assignment
-- First, let's see what tasks exist
SELECT 
    id,
    title,
    max_workers,
    assigned_count,
    (max_workers - assigned_count) as available_slots
FROM tasks 
WHERE status = 'active'
LIMIT 5;

-- 4. Check if there are any existing assignments for testing
SELECT 
    ta.id,
    ta.task_id,
    t.title,
    ta.worker_id,
    ta.status,
    ta.created_at
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
WHERE t.status = 'active'
ORDER BY ta.created_at DESC
LIMIT 5;

-- 5. Check the current state of a specific task (replace with actual task ID)
-- SELECT 
--     id,
--     title,
--     max_workers,
--     assigned_count,
--     (max_workers - assigned_count) as available_slots,
--     updated_at
-- FROM tasks 
-- WHERE id = 'YOUR_TASK_ID_HERE';

-- 6. Test assignment creation (replace with actual IDs)
-- INSERT INTO task_assignments (task_id, worker_id, status)
-- VALUES ('TASK_ID', 'WORKER_ID', 'assigned')
-- RETURNING *;

-- 7. Check if the trigger updated the task
-- SELECT 
--     id,
--     title,
--     max_workers,
--     assigned_count,
--     (max_workers - assigned_count) as available_slots,
--     updated_at
-- FROM tasks 
-- WHERE id = 'TASK_ID';

-- 8. Clean up test assignment (if needed)
-- DELETE FROM task_assignments WHERE id = 'ASSIGNMENT_ID';

