-- UNIVERSAL SLOT COUNTING TRIGGER - WORKS FOR ALL TASKS (EXISTING AND FUTURE)
-- This script ensures slot counting works for ALL tasks, not just existing ones

-- Step 1: Drop ALL existing triggers and functions to start fresh
DROP TRIGGER IF EXISTS trigger_update_task_slot_count ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_slot_counts_on_assignment ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_assigned_count_universal ON task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_assigned_count ON task_assignments;

DROP FUNCTION IF EXISTS update_task_slot_count();
DROP FUNCTION IF EXISTS update_task_slot_counts_on_assignment();
DROP FUNCTION IF EXISTS update_task_assigned_count_universal();
DROP FUNCTION IF EXISTS update_task_assigned_count();

-- Step 2: Create a UNIVERSAL trigger function that works for ANY task
CREATE OR REPLACE FUNCTION update_task_assigned_count_universal()
RETURNS TRIGGER AS $$
DECLARE
    task_exists BOOLEAN;
    current_count INTEGER;
BEGIN
    -- Log the trigger execution
    RAISE NOTICE 'UNIVERSAL TRIGGER FIRED: % on task_assignments', TG_OP;
    
    IF TG_OP = 'INSERT' THEN
        -- Check if the task exists (works for ANY task, existing or future)
        SELECT EXISTS(SELECT 1 FROM tasks WHERE id = NEW.task_id) INTO task_exists;
        
        IF task_exists THEN
            -- Get current assigned_count (handle NULL values)
            SELECT COALESCE(assigned_count, 0) INTO current_count 
            FROM tasks WHERE id = NEW.task_id;
            
            -- Increment assigned_count for ANY task
            UPDATE tasks 
            SET 
                assigned_count = current_count + 1,
                updated_at = NOW()
            WHERE id = NEW.task_id;
            
            RAISE NOTICE 'UNIVERSAL: Incremented assigned_count for task % from % to %', 
                NEW.task_id, current_count, current_count + 1;
        ELSE
            RAISE WARNING 'UNIVERSAL: Task % does not exist, skipping update', NEW.task_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Check if the task exists
        SELECT EXISTS(SELECT 1 FROM tasks WHERE id = OLD.task_id) INTO task_exists;
        
        IF task_exists THEN
            -- Get current assigned_count (handle NULL values)
            SELECT COALESCE(assigned_count, 0) INTO current_count 
            FROM tasks WHERE id = OLD.task_id;
            
            -- Decrement assigned_count for ANY task (never go below 0)
            UPDATE tasks 
            SET 
                assigned_count = GREATEST(current_count - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.task_id;
            
            RAISE NOTICE 'UNIVERSAL: Decremented assigned_count for task % from % to %', 
                OLD.task_id, current_count, GREATEST(current_count - 1, 0);
        ELSE
            RAISE WARNING 'UNIVERSAL: Task % does not exist, skipping update', OLD.task_id;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle task_id changes (moving assignment from one task to another)
        IF OLD.task_id != NEW.task_id THEN
            -- Decrement old task
            SELECT EXISTS(SELECT 1 FROM tasks WHERE id = OLD.task_id) INTO task_exists;
            IF task_exists THEN
                SELECT COALESCE(assigned_count, 0) INTO current_count 
                FROM tasks WHERE id = OLD.task_id;
                
                UPDATE tasks 
                SET 
                    assigned_count = GREATEST(current_count - 1, 0),
                    updated_at = NOW()
                WHERE id = OLD.task_id;
                
                RAISE NOTICE 'UNIVERSAL: Decremented old task % from % to %', 
                    OLD.task_id, current_count, GREATEST(current_count - 1, 0);
            END IF;
            
            -- Increment new task
            SELECT EXISTS(SELECT 1 FROM tasks WHERE id = NEW.task_id) INTO task_exists;
            IF task_exists THEN
                SELECT COALESCE(assigned_count, 0) INTO current_count 
                FROM tasks WHERE id = NEW.task_id;
                
                UPDATE tasks 
                SET 
                    assigned_count = current_count + 1,
                    updated_at = NOW()
                WHERE id = NEW.task_id;
                
                RAISE NOTICE 'UNIVERSAL: Incremented new task % from % to %', 
                    NEW.task_id, current_count, current_count + 1;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the UNIVERSAL trigger
CREATE TRIGGER trigger_update_task_assigned_count_universal
    AFTER INSERT OR UPDATE OR DELETE ON task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_assigned_count_universal();

-- Step 4: Fix existing data - ensure all tasks have correct assigned_count
UPDATE tasks 
SET assigned_count = (
    SELECT COUNT(*) 
    FROM task_assignments 
    WHERE task_assignments.task_id = tasks.id 
    AND task_assignments.status IN ('assigned', 'working', 'submitted', 'completed')
)
WHERE status = 'active';

-- Step 5: Test with EXISTING tasks
DO $$
DECLARE
    existing_task_id UUID;
    test_worker_id UUID;
    test_assignment_id UUID;
    before_count INTEGER;
    after_count INTEGER;
BEGIN
    -- Get an existing task and worker
    SELECT id INTO existing_task_id FROM tasks WHERE status = 'active' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM profiles WHERE role = 'worker' LIMIT 1;
    
    IF existing_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        RAISE NOTICE 'TESTING EXISTING TASK: %', existing_task_id;
        
        -- Get count before
        SELECT COALESCE(assigned_count, 0) INTO before_count FROM tasks WHERE id = existing_task_id;
        
        -- Create test assignment
        INSERT INTO task_assignments (task_id, worker_id, status)
        VALUES (existing_task_id, test_worker_id, 'assigned')
        RETURNING id INTO test_assignment_id;
        
        -- Get count after
        SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = existing_task_id;
        
        -- Check if trigger worked
        IF after_count = before_count + 1 THEN
            RAISE NOTICE 'SUCCESS: Existing task trigger works! Count: % -> %', before_count, after_count;
        ELSE
            RAISE NOTICE 'ERROR: Existing task trigger failed! Count: % -> %', before_count, after_count;
        END IF;
        
        -- Clean up test assignment
        DELETE FROM task_assignments WHERE id = test_assignment_id;
        
        -- Verify cleanup
        SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = existing_task_id;
        IF after_count = before_count THEN
            RAISE NOTICE 'SUCCESS: Existing task cleanup worked! Count back to %', after_count;
        ELSE
            RAISE NOTICE 'ERROR: Existing task cleanup failed! Count is %', after_count;
        END IF;
    ELSE
        RAISE NOTICE 'SKIP: No existing task or worker found for testing';
    END IF;
END $$;

-- Step 6: Test with NEWLY CREATED task
DO $$
DECLARE
    new_task_id UUID;
    test_worker_id UUID;
    test_assignment_id UUID;
    before_count INTEGER;
    after_count INTEGER;
    test_employer_id UUID;
BEGIN
    -- Get a test employer and worker
    SELECT user_id INTO test_employer_id FROM profiles WHERE role = 'employer' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM profiles WHERE role = 'worker' LIMIT 1;
    
    IF test_employer_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        -- Create a NEW task
        INSERT INTO tasks (
            title, 
            description, 
            budget, 
            category, 
            status, 
            max_workers, 
            assigned_count, 
            required_rating, 
            created_by,
            user_id
        ) VALUES (
            'UNIVERSAL TRIGGER TEST TASK', 
            'Testing if universal trigger works for newly created tasks', 
            500.00, 
            'IT', 
            'active', 
            5, 
            0, 
            1.0, 
            test_employer_id,
            test_employer_id
        ) RETURNING id INTO new_task_id;
        
        RAISE NOTICE 'TESTING NEW TASK: %', new_task_id;
        
        -- Get count before (should be 0)
        SELECT COALESCE(assigned_count, 0) INTO before_count FROM tasks WHERE id = new_task_id;
        
        -- Create test assignment for the NEW task
        INSERT INTO task_assignments (task_id, worker_id, status)
        VALUES (new_task_id, test_worker_id, 'assigned')
        RETURNING id INTO test_assignment_id;
        
        -- Get count after
        SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = new_task_id;
        
        -- Check if trigger worked for NEW task
        IF after_count = before_count + 1 THEN
            RAISE NOTICE 'SUCCESS: New task trigger works! Count: % -> %', before_count, after_count;
        ELSE
            RAISE NOTICE 'ERROR: New task trigger failed! Count: % -> %', before_count, after_count;
        END IF;
        
        -- Test multiple assignments
        INSERT INTO task_assignments (task_id, worker_id, status)
        VALUES (new_task_id, test_worker_id, 'assigned');
        
        SELECT COALESCE(assigned_count, 0) INTO after_count FROM tasks WHERE id = new_task_id;
        RAISE NOTICE 'After second assignment: %', after_count;
        
        -- Clean up test task and assignments
        DELETE FROM task_assignments WHERE task_id = new_task_id;
        DELETE FROM tasks WHERE id = new_task_id;
        
        RAISE NOTICE 'SUCCESS: New task testing completed and cleaned up';
    ELSE
        RAISE NOTICE 'SKIP: No employer or worker found for new task testing';
    END IF;
END $$;

-- Step 7: Show current status of ALL tasks
SELECT 
    'UNIVERSAL TRIGGER STATUS' as info,
    COUNT(*) as total_tasks,
    SUM(max_workers) as total_slots,
    SUM(COALESCE(assigned_count, 0)) as total_assigned,
    SUM(max_workers - COALESCE(assigned_count, 0)) as total_available
FROM tasks 
WHERE status = 'active';

-- Step 8: Show individual task status
SELECT 
    id,
    title,
    max_workers,
    COALESCE(assigned_count, 0) as assigned_count,
    (max_workers - COALESCE(assigned_count, 0)) as available_slots,
    updated_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'RECENT'
        ELSE 'EXISTING'
    END as task_type
FROM tasks 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- Step 9: Verify trigger is active
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    'UNIVERSAL TRIGGER ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'task_assignments'
AND trigger_name = 'trigger_update_task_assigned_count_universal';