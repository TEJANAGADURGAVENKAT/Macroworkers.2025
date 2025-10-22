-- FINAL FIX: Add back completed_slots column temporarily for compatibility
-- This will prevent task creation errors while we update the frontend

-- Step 1: Add completed_slots column back temporarily
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_slots integer DEFAULT 0;

-- Step 2: Update completed_slots to match assigned_count
UPDATE tasks SET completed_slots = assigned_count;

-- Step 3: Create trigger to keep completed_slots in sync
CREATE OR REPLACE FUNCTION sync_completed_slots()
RETURNS TRIGGER AS $$
BEGIN
    -- Update completed_slots to match assigned_count
    UPDATE tasks 
    SET completed_slots = assigned_count,
        updated_at = NOW()
    WHERE id = NEW.task_id OR id = OLD.task_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to sync completed_slots
DROP TRIGGER IF EXISTS trigger_sync_completed_slots ON task_assignments;
CREATE TRIGGER trigger_sync_completed_slots
    AFTER INSERT OR UPDATE OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION sync_completed_slots();

-- Step 5: Verify the fix
SELECT 
    'COMPLETED SLOTS SYNC CHECK' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN completed_slots = assigned_count THEN 1 END) as synced_tasks,
    COUNT(CASE WHEN completed_slots != assigned_count THEN 1 END) as unsynced_tasks
FROM tasks;




