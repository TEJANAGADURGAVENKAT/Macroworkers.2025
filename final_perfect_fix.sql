-- FINAL COMPREHENSIVE FIX FOR YOUR DATABASE
-- This will work with your current schema and fix ALL issues

-- Step 1: Ensure all columns have proper defaults
UPDATE tasks SET assigned_count = 0 WHERE assigned_count IS NULL;
UPDATE tasks SET completed_slots = 0 WHERE completed_slots IS NULL;
UPDATE tasks SET max_workers = 1 WHERE max_workers IS NULL OR max_workers = 0;

-- Step 2: Fix all existing tasks to have correct counts
UPDATE tasks 
SET assigned_count = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_id = tasks.id
);

UPDATE tasks SET completed_slots = assigned_count;

-- Step 3: Drop ALL existing triggers to start completely fresh
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_sync_completed_slots ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON task_assignments;

-- Step 4: Create the PERFECT trigger function
CREATE OR REPLACE FUNCTION update_task_slot_counts_perfect()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT - when someone assigns to a task
    IF TG_OP = 'INSERT' THEN
        UPDATE tasks 
        SET assigned_count = assigned_count + 1,
            completed_slots = completed_slots + 1,
            updated_at = NOW()
        WHERE id = NEW.task_id;
        
        RAISE NOTICE '✅ Assignment added: Task % now has assigned_count +1', NEW.task_id;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE - when someone unassigns from a task
    IF TG_OP = 'DELETE' THEN
        UPDATE tasks 
        SET assigned_count = GREATEST(0, assigned_count - 1),
            completed_slots = GREATEST(0, completed_slots - 1),
            updated_at = NOW()
        WHERE id = OLD.task_id;
        
        RAISE NOTICE '❌ Assignment removed: Task % now has assigned_count -1', OLD.task_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create assignment limit check function
CREATE OR REPLACE FUNCTION check_assignment_limit_perfect()
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

-- Step 6: Create the triggers
CREATE TRIGGER trigger_update_task_slot_counts_perfect
    AFTER INSERT OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION update_task_slot_counts_perfect();

CREATE TRIGGER trigger_check_assignment_limit_perfect
    BEFORE INSERT ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION check_assignment_limit_perfect();

-- Step 7: Verify everything is working
SELECT 
    'FINAL VERIFICATION' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN assigned_count IS NULL THEN 1 END) as null_assigned_count,
    COUNT(CASE WHEN completed_slots IS NULL THEN 1 END) as null_completed_slots,
    COUNT(CASE WHEN max_workers IS NULL THEN 1 END) as null_max_workers
FROM tasks;

-- Step 8: Show task details with accuracy check
SELECT 
    'TASK ACCURACY CHECK' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    t.completed_slots,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) AND t.completed_slots = COUNT(ta.id) THEN 'PERFECT ✅'
        ELSE 'NEEDS ATTENTION ❌'
    END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count, t.completed_slots
ORDER BY t.created_at DESC
LIMIT 10;

-- Step 9: Show trigger status
SELECT 
    'TRIGGER STATUS' as info,
    trigger_name, 
    event_manipulation, 
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments'
ORDER BY trigger_name;

-- Step 10: Final success message
SELECT '🎉 SLOT COUNTING SYSTEM COMPLETELY FIXED! 🎉' as status;




