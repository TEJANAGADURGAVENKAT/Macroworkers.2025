-- COMPLETE SLOT COUNTING FIX
-- This will fix the conflicting columns and create proper triggers

-- Step 1: Check current conflicting columns
SELECT 
    'CURRENT STATE' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN max_workers IS NULL THEN 1 END) as missing_max_workers,
    COUNT(CASE WHEN assigned_count IS NULL THEN 1 END) as missing_assigned_count,
    COUNT(CASE WHEN slots IS NOT NULL THEN 1 END) as has_old_slots_column,
    COUNT(CASE WHEN current_assignees IS NOT NULL THEN 1 END) as has_old_current_assignees
FROM tasks;

-- Step 2: Fix missing max_workers (use slots as fallback)
UPDATE tasks 
SET max_workers = COALESCE(max_workers, slots, 1)
WHERE max_workers IS NULL OR max_workers = 0;

-- Step 3: Fix missing assigned_count (use current_assignees as fallback)
UPDATE tasks 
SET assigned_count = COALESCE(assigned_count, current_assignees, 0)
WHERE assigned_count IS NULL;

-- Step 4: Ensure assigned_count never exceeds max_workers
UPDATE tasks 
SET assigned_count = LEAST(assigned_count, max_workers)
WHERE assigned_count > max_workers;

-- Step 5: Drop old conflicting columns
ALTER TABLE tasks DROP COLUMN IF EXISTS slots;
ALTER TABLE tasks DROP COLUMN IF EXISTS completed_slots;
ALTER TABLE tasks DROP COLUMN IF EXISTS max_assignees;
ALTER TABLE tasks DROP COLUMN IF EXISTS current_assignees;

-- Step 6: Drop ALL existing broken triggers
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assignee_count ON task_submissions;

-- Step 7: Create bulletproof trigger function
CREATE OR REPLACE FUNCTION update_task_assigned_count_unified()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT - when someone assigns to a task
    IF TG_OP = 'INSERT' THEN
        UPDATE tasks 
        SET assigned_count = assigned_count + 1,
            updated_at = NOW()
        WHERE id = NEW.task_id;
        
        -- Debug log
        RAISE NOTICE '✅ Assignment added: Task % now has assigned_count +1', NEW.task_id;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE - when someone unassigns from a task
    IF TG_OP = 'DELETE' THEN
        UPDATE tasks 
        SET assigned_count = GREATEST(0, assigned_count - 1),
            updated_at = NOW()
        WHERE id = OLD.task_id;
        
        -- Debug log
        RAISE NOTICE '❌ Assignment removed: Task % now has assigned_count -1', OLD.task_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create assignment limit check function
CREATE OR REPLACE FUNCTION check_assignment_limit_unified()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_count INTEGER;
BEGIN
    -- Get current assignment count and max workers
    SELECT assigned_count, max_workers 
    INTO current_count, max_count
    FROM tasks 
    WHERE id = NEW.task_id;
    
    -- Check if assignment would exceed limit
    IF current_count >= max_count THEN
        RAISE EXCEPTION '🚫 Task assignment limit exceeded! Current: %, Max: %', current_count, max_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create triggers
CREATE TRIGGER trigger_update_assigned_count_unified
    AFTER INSERT OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION update_task_assigned_count_unified();

CREATE TRIGGER trigger_check_assignment_limit_unified
    BEFORE INSERT ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION check_assignment_limit_unified();

-- Step 10: Fix ALL tasks to have correct assigned_count
UPDATE tasks 
SET assigned_count = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_id = tasks.id
);

-- Step 11: Verify the fix
SELECT 
    'AFTER FIX' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN max_workers IS NULL THEN 1 END) as missing_max_workers,
    COUNT(CASE WHEN assigned_count IS NULL THEN 1 END) as missing_assigned_count,
    COUNT(CASE WHEN assigned_count > max_workers THEN 1 END) as over_assigned_tasks
FROM tasks;

-- Step 12: Show task details
SELECT 
    id,
    title,
    max_workers,
    assigned_count,
    (max_workers - assigned_count) as available_slots,
    CASE 
        WHEN assigned_count >= max_workers THEN 'FULL'
        ELSE 'AVAILABLE'
    END as status
FROM tasks 
ORDER BY created_at DESC
LIMIT 10;

-- Step 13: Test assignment count accuracy
SELECT 
    'ASSIGNMENT ACCURACY CHECK' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT ✅'
        ELSE 'MISMATCH ❌'
    END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count
ORDER BY t.created_at DESC
LIMIT 10;




