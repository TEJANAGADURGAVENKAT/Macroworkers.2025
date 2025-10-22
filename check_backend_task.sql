-- QUICK CHECK: Verify actual assignments vs database counts
-- Run this to see the real situation

SELECT 
    'BACKEND DEVELOPER TASK ANALYSIS' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) THEN 'DATABASE CORRECT'
        ELSE 'DATABASE MISMATCH'
    END as database_status
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
WHERE t.title LIKE '%Backend Developer%'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count;

-- Show all assignments for this task
SELECT 
    'ASSIGNMENTS FOR BACKEND TASK' as info,
    ta.id as assignment_id,
    ta.worker_id,
    ta.status,
    ta.assigned_at,
    p.full_name as worker_name
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
LEFT JOIN profiles p ON ta.worker_id = p.user_id
WHERE t.title LIKE '%Backend Developer%'
ORDER BY ta.assigned_at DESC;




