-- CHECK SPECIFIC TASK SLOT ISSUE
-- This will check the Performance Marketer task specifically

-- Step 1: Check the specific task
SELECT 
    'PERFORMANCE MARKETER TASK CHECK' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
        ELSE 'BROKEN - NEEDS FIX'
    END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
WHERE t.id = 'a277143d-cf0f-43da-9ad2-ac60c2509d0d'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count;

-- Step 2: Check all assignments for this task
SELECT 
    'ASSIGNMENTS FOR PERFORMANCE MARKETER TASK' as info,
    ta.id as assignment_id,
    ta.worker_id,
    ta.status,
    ta.assigned_at,
    p.full_name as worker_name
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
LEFT JOIN profiles p ON ta.worker_id = p.user_id
WHERE t.id = 'a277143d-cf0f-43da-9ad2-ac60c2509d0d'
ORDER BY ta.assigned_at DESC;

-- Step 3: Check if trigger is working
SELECT 
    'TRIGGER STATUS CHECK' as info,
    trigger_name, 
    event_manipulation, 
    action_timing, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments';




