-- COMPREHENSIVE FIX FOR ALL SLOT COUNTING ISSUES
-- This will fix the trigger and update all task slot counts

-- Step 1: Check current state of ALL tasks
SELECT 
    'BEFORE FIX - ALL TASKS' as info,
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

-- Step 2: Drop ALL existing broken triggers
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON task_assignments;

-- Step 3: Create bulletproof trigger function
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

-- Step 4: Create the trigger
CREATE TRIGGER trigger_update_assigned_count_unified
    AFTER INSERT OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION update_task_assigned_count_unified();

-- Step 5: Fix ALL tasks at once
UPDATE tasks 
SET assigned_count = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_id = tasks.id
);

-- Step 6: Verify ALL tasks are fixed
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

-- Step 7: Test the trigger with a simple query
SELECT 'TRIGGER CREATED AND ALL TASKS FIXED SUCCESSFULLY' as status;




