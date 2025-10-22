-- SIMPLE AUTOMATIC SLOT COUNTING FIX
-- This will work automatically without any buttons

-- Step 1: Create a simple function to update slot counts
CREATE OR REPLACE FUNCTION update_task_slot_counts_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT - when someone assigns to a task
    IF TG_OP = 'INSERT' THEN
        UPDATE tasks 
        SET assigned_count = assigned_count + 1,
            completed_slots = completed_slots + 1,
            updated_at = NOW()
        WHERE id = NEW.task_id;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE - when someone unassigns from a task
    IF TG_OP = 'DELETE' THEN
        UPDATE tasks 
        SET assigned_count = GREATEST(0, assigned_count - 1),
            completed_slots = GREATEST(0, completed_slots - 1),
            updated_at = NOW()
        WHERE id = OLD.task_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop all existing triggers
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_perfect ON task_assignments;
DROP TRIGGER IF EXISTS trigger_manual_slot_update_trigger ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON task_assignments;

-- Step 3: Create the simple trigger
CREATE TRIGGER trigger_update_task_slot_counts_simple
    AFTER INSERT OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION update_task_slot_counts_simple();

-- Step 4: Fix all existing tasks to have correct counts
UPDATE tasks 
SET assigned_count = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_id = tasks.id
),
completed_slots = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_id = tasks.id
);

-- Step 5: Verify the fix
SELECT 
    'SLOT COUNTING FIXED' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN assigned_count = (
        SELECT COUNT(*) 
        FROM task_assignments 
        WHERE task_id = tasks.id
    ) THEN 1 END) as correct_tasks
FROM tasks;

-- Step 6: Show sample results
SELECT 
    'SAMPLE RESULTS' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    t.completed_slots,
    COUNT(ta.id) as actual_assignments
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count, t.completed_slots
ORDER BY t.created_at DESC
LIMIT 3;




