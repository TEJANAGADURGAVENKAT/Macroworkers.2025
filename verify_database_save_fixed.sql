-- =====================================================
-- VERIFY DATABASE SAVE - CHECK SLOT COUNTS (FIXED)
-- =====================================================

-- Step 1: Check current slot counts in database
SELECT 
    'CURRENT DATABASE SLOT COUNTS' as check_type,
    id,
    title,
    max_workers,
    assigned_count,
    (max_workers - assigned_count) as available_slots,
    updated_at
FROM tasks 
WHERE status = 'active'
ORDER BY updated_at DESC
LIMIT 10;

-- Step 2: Check specific task (Mobile App Developer Task)
SELECT 
    'MOBILE APP DEVELOPER TASK' as check_type,
    id,
    title,
    max_workers,
    assigned_count,
    (max_workers - assigned_count) as available_slots,
    updated_at
FROM tasks 
WHERE title ILIKE '%Mobile App Developer%'
   OR title ILIKE '%mobile%'
ORDER BY updated_at DESC;

-- Step 3: Count actual assignments from task_assignments table
SELECT 
    'ACTUAL ASSIGNMENTS COUNT' as check_type,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count as db_assigned_count,
    COUNT(ta.id) as actual_assignments,
    (t.max_workers - COUNT(ta.id)) as actual_available_slots,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id 
    AND ta.status IN ('assigned', 'working', 'submitted', 'completed')
WHERE t.status = 'active'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.updated_at DESC
LIMIT 10;

-- Step 4: Check if database is being updated by frontend
SELECT 
    'DATABASE UPDATE STATUS' as check_type,
    COUNT(*) as total_active_tasks,
    SUM(max_workers) as total_max_slots,
    SUM(assigned_count) as total_assigned_slots,
    SUM(max_workers - assigned_count) as total_available_slots,
    MAX(updated_at) as last_updated
FROM tasks 
WHERE status = 'active';

-- Step 5: Check recent task_assignments
SELECT 
    'RECENT ASSIGNMENTS' as check_type,
    ta.id,
    ta.task_id,
    t.title,
    ta.worker_id,
    ta.status,
    ta.assigned_at,
    ta.created_at
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
WHERE t.status = 'active'
ORDER BY ta.created_at DESC
LIMIT 10;

