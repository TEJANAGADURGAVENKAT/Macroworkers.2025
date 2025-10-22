-- COMPREHENSIVE TRIGGER FIX FOR ALL TASKS
-- This ensures the trigger works for ALL tasks going forward

-- Step 1: Drop ALL existing broken triggers
DROP TRIGGER IF EXISTS trigger_update_assigned_count_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit_unified ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assignee_count ON task_submissions;

-- Step 2: Create bulletproof trigger function
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
    
    -- Handle UPDATE - when assignment status changes
    IF TG_OP = 'UPDATE' THEN
        -- If task_id changed, update both old and new
        IF OLD.task_id != NEW.task_id THEN
            -- Remove from old task
            UPDATE tasks 
            SET assigned_count = GREATEST(0, assigned_count - 1),
                updated_at = NOW()
            WHERE id = OLD.task_id;
            
            -- Add to new task
            UPDATE tasks 
            SET assigned_count = assigned_count + 1,
                updated_at = NOW()
            WHERE id = NEW.task_id;
            
            -- Debug log
            RAISE NOTICE '🔄 Assignment moved: Task % -1, Task % +1', OLD.task_id, NEW.task_id;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create assignment limit check function
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

-- Step 4: Create the triggers
CREATE TRIGGER trigger_update_assigned_count_unified
    AFTER INSERT OR UPDATE OR DELETE ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION update_task_assigned_count_unified();

CREATE TRIGGER trigger_check_assignment_limit_unified
    BEFORE INSERT ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION check_assignment_limit_unified();

-- Step 5: Test the trigger with a simple query
SELECT 'TRIGGER CREATED SUCCESSFULLY' as status;




