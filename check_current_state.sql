-- Quick diagnostic query to see current state
SELECT 
    'CURRENT STATE' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN max_workers IS NULL THEN 1 END) as missing_max_workers,
    COUNT(CASE WHEN assigned_count IS NULL THEN 1 END) as missing_assigned_count,
    COUNT(CASE WHEN assigned_count > max_workers THEN 1 END) as over_assigned_tasks
FROM tasks;

-- Show specific task details
SELECT 
    id,
    title,
    max_workers,
    assigned_count,
    slots,
    current_assignees,
    (max_workers - assigned_count) as available_slots,
    CASE 
        WHEN assigned_count >= max_workers THEN 'FULL'
        ELSE 'AVAILABLE'
    END as status
FROM tasks 
ORDER BY created_at DESC
LIMIT 5;

