-- MINIMAL FIX FOR SLOT COUNTING ISSUE
-- Run these commands one by one in your Supabase SQL editor

-- 1. First, check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('slots', 'max_workers', 'assigned_count', 'current_assignees', 'max_assignees');

-- 2. Fix missing max_workers (use slots as fallback)
UPDATE tasks 
SET max_workers = COALESCE(max_workers, slots, 1)
WHERE max_workers IS NULL OR max_workers = 0;

-- 3. Fix missing assigned_count (use current_assignees as fallback)
UPDATE tasks 
SET assigned_count = COALESCE(assigned_count, current_assignees, 0)
WHERE assigned_count IS NULL;

-- 4. Ensure assigned_count never exceeds max_workers
UPDATE tasks 
SET assigned_count = LEAST(assigned_count, max_workers)
WHERE assigned_count > max_workers;

-- 5. Check the results
SELECT 
    id,
    title,
    max_workers,
    assigned_count,
    (max_workers - assigned_count) as available_slots
FROM tasks 
ORDER BY created_at DESC
LIMIT 5;


