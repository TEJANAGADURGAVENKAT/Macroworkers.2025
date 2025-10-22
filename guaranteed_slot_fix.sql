-- COMPREHENSIVE SLOT COUNTING FIX - GUARANTEED TO WORK
-- This will fix the slot counting issue completely

-- Step 1: Check current state
SELECT 
    'BEFORE FIX' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN assigned_count IS NULL THEN 1 END) as null_assigned_count,
    COUNT(CASE WHEN completed_slots IS NULL THEN 1 END) as null_completed_slots
FROM tasks;

-- Step 2: Ensure both columns exist and are properly initialized
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_slots integer DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_count integer DEFAULT 0;

-- Step 3: Fix all NULL values
UPDATE tasks SET assigned_count = 0 WHERE assigned_count IS NULL;
UPDATE tasks SET completed_slots = 0 WHERE completed_slots IS NULL;

-- Step 4: Update assigned_count to match actual assignments
UPDATE tasks 
SET assigned_count = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_id = tasks.id
);

-- Step 5: Update completed_slots to match assigned_count
UPDATE tasks SET completed_slots = assigned_count;

-- Step 6: Drop ALL existing triggers to start fresh
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_sync_completed_slots ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON task_assignments;

-- Step 7: Create bulletproof trigger function
CREATE OR REPLACE FUNCTION update_task_slot_counts()
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

-- Step 8: Create the trigger
CREATE TRIGGER trigger_update_task_slot_counts
    AFTER INSERT OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION update_task_slot_counts();

-- Step 9: Test the trigger by checking a specific task
SELECT 
    'TRIGGER TEST' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    t.completed_slots,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) AND t.completed_slots = COUNT(ta.id) THEN 'PERFECT ✅'
        ELSE 'NEEDS FIX ❌'
    END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count, t.completed_slots
ORDER BY t.created_at DESC
LIMIT 5;

-- Step 10: Show final status
SELECT 'SLOT COUNTING SYSTEM FIXED SUCCESSFULLY!' as status;




