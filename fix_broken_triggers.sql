-- FIX DATABASE TRIGGER ISSUE
-- The assigned_count is not being updated when task_assignments are inserted

-- Step 1: Check if triggers exist
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments';

-- Step 2: Drop existing broken triggers
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit_unified ON task_assignments;

-- Step 3: Create working trigger function
CREATE OR REPLACE FUNCTION update_task_assigned_count_unified()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE tasks 
        SET assigned_count = assigned_count + 1,
            updated_at = NOW()
        WHERE id = NEW.task_id;
        
        -- Debug log
        RAISE NOTICE 'Updated assigned_count for task %: +1', NEW.task_id;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE tasks 
        SET assigned_count = GREATEST(0, assigned_count - 1),
            updated_at = NOW()
        WHERE id = OLD.task_id;
        
        -- Debug log
        RAISE NOTICE 'Updated assigned_count for task %: -1', OLD.task_id;
        RETURN OLD;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If task_id changed, update both old and new
        IF OLD.task_id != NEW.task_id THEN
            UPDATE tasks 
            SET assigned_count = GREATEST(0, assigned_count - 1),
                updated_at = NOW()
            WHERE id = OLD.task_id;
            
            UPDATE tasks 
            SET assigned_count = assigned_count + 1,
                updated_at = NOW()
            WHERE id = NEW.task_id;
            
            -- Debug log
            RAISE NOTICE 'Updated assigned_count: task % -1, task % +1', OLD.task_id, NEW.task_id;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create assignment limit check function
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
        RAISE EXCEPTION 'Task assignment limit exceeded. Current: %, Max: %', current_count, max_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create triggers
CREATE TRIGGER trigger_update_assigned_count_unified
    AFTER INSERT OR UPDATE OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION update_task_assigned_count_unified();

CREATE TRIGGER trigger_check_assignment_limit_unified
    BEFORE INSERT ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION check_assignment_limit_unified();

-- Step 6: Fix the Backend Developer Task specifically
UPDATE tasks 
SET assigned_count = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_id = tasks.id
)
WHERE id = '4b2c5ea7-04e9-47c5-aedf-72b721e52d56';

-- Step 7: Verify the fix
SELECT 
    'AFTER FIX' as info,
    t.id,
    t.title,
    t.max_workers,
    t.assigned_count,
    COUNT(ta.id) as actual_assignments,
    CASE 
        WHEN t.assigned_count = COUNT(ta.id) THEN 'CORRECT'
        ELSE 'STILL BROKEN'
    END as status_check
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
WHERE t.id = '4b2c5ea7-04e9-47c5-aedf-72b721e52d56'
GROUP BY t.id, t.title, t.max_workers, t.assigned_count;




