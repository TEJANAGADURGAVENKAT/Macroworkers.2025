-- TEST TRIGGER FUNCTIONALITY
-- Run this to test if the slot counting triggers are working

-- 1. Check current task assignments
SELECT 
    'CURRENT ASSIGNMENTS' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
        ELSE 'MISMATCH'
    END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 5;

-- 2. Test inserting a new assignment (replace with actual task_id and worker_id)
-- INSERT INTO task_assignments (task_id, worker_id, status) 
-- VALUES ('your-task-id-here', 'your-worker-id-here', 'assigned');

-- 3. Check if assigned_count was updated
-- SELECT id, title, max_workers, assigned_count FROM tasks WHERE id = 'your-task-id-here';




