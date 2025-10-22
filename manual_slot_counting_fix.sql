-- ALTERNATIVE APPROACH - MANUAL SLOT COUNTING
-- This will work by updating slot counts manually instead of relying on triggers

-- Step 1: Check current state
SELECT 
    'CURRENT STATE CHECK' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    t.completed_slots,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
        ELSE 'WRONG - NEEDS FIX'
    END as status
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count, t.completed_slots
ORDER BY t.created_at DESC
LIMIT 5;

-- Step 2: Create a function to manually update slot counts
CREATE OR REPLACE FUNCTION update_all_task_slot_counts()
RETURNS void AS $$
BEGIN
    -- Update assigned_count for all tasks
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
    ),
    updated_at = NOW();
    
    RAISE NOTICE 'Updated slot counts for all tasks';
END;
$$ LANGUAGE plpgsql;

-- Step 3: Run the manual update
SELECT update_all_task_slot_counts();

-- Step 4: Verify the fix
SELECT 
    'AFTER MANUAL FIX' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    t.completed_slots,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) AND t.completed_slots = COUNT(ta.id) THEN 'PERFECT ✅'
        ELSE 'STILL WRONG ❌'
    END as status
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers, t.assigned_count, t.completed_slots
ORDER BY t.created_at DESC
LIMIT 5;

-- Step 5: Create a simple trigger that calls the manual update function
CREATE OR REPLACE FUNCTION trigger_manual_slot_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the manual update function
    PERFORM update_all_task_slot_counts();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 6: Drop old triggers and create new one
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_perfect ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON task_assignments;

CREATE TRIGGER trigger_manual_slot_update_trigger
    AFTER INSERT OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION trigger_manual_slot_update();

-- Step 7: Test by checking trigger status
SELECT 
    'TRIGGER STATUS' as info,
    trigger_name, 
    event_manipulation, 
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments';

-- Step 8: Final verification
SELECT 'MANUAL SLOT COUNTING SYSTEM ACTIVATED!' as status;




