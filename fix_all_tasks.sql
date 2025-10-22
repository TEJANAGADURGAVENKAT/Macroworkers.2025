-- COMPREHENSIVE FIX FOR ALL TASKS
-- This will fix the assigned_count for ALL tasks in your database

-- Step 1: Check current state of ALL tasks
SELECT 
    'CURRENT STATE - ALL TASKS' as info,
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
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC;

-- Step 2: Fix ALL tasks at once
UPDATE tasks 
SET assigned_count = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_id = tasks.id
);

-- Step 3: Verify ALL tasks are fixed
SELECT 
    'AFTER FIX - ALL TASKS' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) THEN 'FIXED ✅'
        ELSE 'STILL BROKEN ❌'
    END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC;

-- Step 4: Show summary
SELECT 
    'SUMMARY' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN t.assigned_count = COUNT(ta.id) THEN 1 END) as correct_tasks,
    COUNT(CASE WHEN t.assigned_count != COUNT(ta.id) THEN 1 END) as broken_tasks
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count;




