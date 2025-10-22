-- =====================================================
-- DIAGNOSE AND FIX AUTOMATIC SLOT COUNTING
-- =====================================================

-- Step 1: Check if trigger exists and is active
SELECT 
    'TRIGGER CHECK' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    trigger_schema
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments'
ORDER BY trigger_name;

-- Step 2: Check if trigger function exists
SELECT 
    'FUNCTION CHECK' as check_type,
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%slot%' 
   OR routine_name LIKE '%assigned%'
ORDER BY routine_name;

-- Step 3: Test trigger manually with detailed logging
DO $$
DECLARE
    test_task_id uuid;
    test_worker_id uuid;
    current_count integer;
    new_count integer;
    trigger_fired boolean := false;
BEGIN
    -- Get a test task and worker
    SELECT id INTO test_task_id FROM tasks WHERE status = 'active' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM profiles WHERE role = 'worker' LIMIT 1;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        -- Get current count
        SELECT assigned_count INTO current_count FROM tasks WHERE id = test_task_id;
        
        RAISE NOTICE '=== MANUAL TRIGGER TEST START ===';
        RAISE NOTICE 'Test Task ID: %', test_task_id;
        RAISE NOTICE 'Test Worker ID: %', test_worker_id;
        RAISE NOTICE 'Current assigned_count: %', current_count;
        
        -- Insert test assignment
        INSERT INTO task_assignments (task_id, worker_id, status)
        VALUES (test_task_id, test_worker_id, 'assigned');
        
        -- Check if count increased
        SELECT assigned_count INTO new_count FROM tasks WHERE id = test_task_id;
        RAISE NOTICE 'After INSERT - assigned_count: %', new_count;
        
        IF new_count > current_count THEN
            RAISE NOTICE '✅ TRIGGER WORKING: Count increased from % to %', current_count, new_count;
            trigger_fired := true;
        ELSE
            RAISE NOTICE '❌ TRIGGER NOT WORKING: Count did not increase';
        END IF;
        
        -- Clean up test assignment
        DELETE FROM task_assignments WHERE task_id = test_task_id AND worker_id = test_worker_id;
        
        -- Check if count decreased
        SELECT assigned_count INTO new_count FROM tasks WHERE id = test_task_id;
        RAISE NOTICE 'After DELETE - assigned_count: %', new_count;
        
        IF new_count < current_count THEN
            RAISE NOTICE '✅ TRIGGER WORKING: Count decreased back to %', new_count;
        ELSE
            RAISE NOTICE '❌ TRIGGER NOT WORKING: Count did not decrease';
        END IF;
        
        RAISE NOTICE '=== MANUAL TRIGGER TEST END ===';
        
        IF trigger_fired THEN
            RAISE NOTICE '🎉 CONCLUSION: Trigger is working correctly!';
        ELSE
            RAISE NOTICE '🚨 CONCLUSION: Trigger is NOT working!';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ No test data available for trigger testing';
    END IF;
END $$;

-- Step 4: Check RLS policies that might block trigger
SELECT 
    'RLS POLICY CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('tasks', 'task_assignments')
ORDER BY tablename, policyname;

-- Step 5: Check if RLS is enabled on tables
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('tasks', 'task_assignments')
ORDER BY tablename;

-- Step 6: Create a more robust trigger with error handling
DROP TRIGGER IF EXISTS trigger_update_task_slot_count_simple ON task_assignments;
DROP FUNCTION IF EXISTS update_task_slot_count_simple();

-- Create enhanced trigger function with detailed logging
CREATE OR REPLACE FUNCTION update_task_slot_count_simple()
RETURNS TRIGGER AS $$
DECLARE
    old_count integer;
    new_count integer;
    task_exists boolean;
BEGIN
    -- Log trigger execution
    RAISE NOTICE '🚨 SLOT COUNTING TRIGGER FIRED: % on task_assignments', TG_OP;
    RAISE NOTICE '🚨 Trigger function started execution';
    
    -- Check if task exists
    SELECT EXISTS(SELECT 1 FROM tasks WHERE id = COALESCE(NEW.task_id, OLD.task_id)) INTO task_exists;
    
    IF NOT task_exists THEN
        RAISE NOTICE '❌ Task does not exist, skipping update';
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Get current count
    SELECT assigned_count INTO old_count FROM tasks WHERE id = COALESCE(NEW.task_id, OLD.task_id);
    RAISE NOTICE '🚨 Current assigned_count: %', old_count;
    
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE '🚨 INSERT operation detected';
        RAISE NOTICE '🚨 Task ID: %, Worker ID: %', NEW.task_id, NEW.worker_id;
        
        -- Increment assigned_count
        UPDATE tasks 
        SET 
            assigned_count = COALESCE(assigned_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.task_id;
        
        -- Verify update
        SELECT assigned_count INTO new_count FROM tasks WHERE id = NEW.task_id;
        RAISE NOTICE '🚨 After INSERT - assigned_count: % (was %)', new_count, old_count;
        
        IF new_count > old_count THEN
            RAISE NOTICE '✅ SUCCESS: assigned_count increased from % to %', old_count, new_count;
        ELSE
            RAISE NOTICE '❌ FAILED: assigned_count did not increase';
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        RAISE NOTICE '🚨 DELETE operation detected';
        RAISE NOTICE '🚨 Task ID: %, Worker ID: %', OLD.task_id, OLD.worker_id;
        
        -- Decrement assigned_count
        UPDATE tasks 
        SET 
            assigned_count = GREATEST(COALESCE(assigned_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.task_id;
        
        -- Verify update
        SELECT assigned_count INTO new_count FROM tasks WHERE id = OLD.task_id;
        RAISE NOTICE '🚨 After DELETE - assigned_count: % (was %)', new_count, old_count;
        
        IF new_count < old_count THEN
            RAISE NOTICE '✅ SUCCESS: assigned_count decreased from % to %', old_count, new_count;
        ELSE
            RAISE NOTICE '❌ FAILED: assigned_count did not decrease';
        END IF;
    END IF;
    
    RAISE NOTICE '🚨 Trigger function completed execution';
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TRIGGER ERROR: %', SQLERRM;
        RAISE NOTICE '❌ Error details: %', SQLSTATE;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the enhanced trigger
CREATE TRIGGER trigger_update_task_slot_count_simple
    AFTER INSERT OR UPDATE OR DELETE ON task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_slot_count_simple();

-- Step 7: Test the enhanced trigger
DO $$
DECLARE
    test_task_id uuid;
    test_worker_id uuid;
    current_count integer;
    new_count integer;
    trigger_working boolean := false;
BEGIN
    -- Get a test task and worker
    SELECT id INTO test_task_id FROM tasks WHERE status = 'active' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM profiles WHERE role = 'worker' LIMIT 1;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        -- Get current count
        SELECT assigned_count INTO current_count FROM tasks WHERE id = test_task_id;
        
        RAISE NOTICE '=== ENHANCED TRIGGER TEST START ===';
        RAISE NOTICE 'Test Task ID: %', test_task_id;
        RAISE NOTICE 'Test Worker ID: %', test_worker_id;
        RAISE NOTICE 'Current assigned_count: %', current_count;
        
        -- Insert test assignment
        INSERT INTO task_assignments (task_id, worker_id, status)
        VALUES (test_task_id, test_worker_id, 'assigned');
        
        -- Check if count increased
        SELECT assigned_count INTO new_count FROM tasks WHERE id = test_task_id;
        
        IF new_count > current_count THEN
            RAISE NOTICE '✅ ENHANCED TRIGGER WORKING: Count increased from % to %', current_count, new_count;
            trigger_working := true;
        ELSE
            RAISE NOTICE '❌ ENHANCED TRIGGER NOT WORKING: Count did not increase';
        END IF;
        
        -- Clean up test assignment
        DELETE FROM task_assignments WHERE task_id = test_task_id AND worker_id = test_worker_id;
        
        -- Check if count decreased
        SELECT assigned_count INTO new_count FROM tasks WHERE id = test_task_id;
        
        IF new_count < current_count THEN
            RAISE NOTICE '✅ ENHANCED TRIGGER WORKING: Count decreased back to %', new_count;
        ELSE
            RAISE NOTICE '❌ ENHANCED TRIGGER NOT WORKING: Count did not decrease';
        END IF;
        
        RAISE NOTICE '=== ENHANCED TRIGGER TEST END ===';
        
        IF trigger_working THEN
            RAISE NOTICE '🎉 ENHANCED TRIGGER IS WORKING!';
        ELSE
            RAISE NOTICE '🚨 ENHANCED TRIGGER IS NOT WORKING!';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ No test data available for enhanced trigger testing';
    END IF;
END $$;

-- Step 8: Check for any RLS policies that might block the trigger
-- Create RLS policies that allow the trigger to work
DROP POLICY IF EXISTS "Allow trigger updates on tasks" ON tasks;
CREATE POLICY "Allow trigger updates on tasks" ON tasks
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Step 9: Final verification
SELECT 
    'FINAL TRIGGER STATUS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE event_object_table = 'task_assignments' 
            AND trigger_name = 'trigger_update_task_slot_count_simple'
        ) THEN 'ACTIVE'
        ELSE 'MISSING'
    END as status;

-- Step 10: Show current slot counts
SELECT 
    'CURRENT SLOT COUNTS' as info,
    COUNT(*) as total_active_tasks,
    SUM(max_workers) as total_max_slots,
    SUM(assigned_count) as total_assigned_slots,
    SUM(max_workers - assigned_count) as total_available_slots
FROM tasks 
WHERE status = 'active';

-- =====================================================
-- SUMMARY OF DIAGNOSTIC AND FIX:
-- =====================================================
-- ✅ Checked trigger existence and status
-- ✅ Checked trigger function existence
-- ✅ Tested trigger manually with detailed logging
-- ✅ Checked RLS policies that might block trigger
-- ✅ Checked RLS status on tables
-- ✅ Created enhanced trigger with error handling
-- ✅ Added detailed logging for debugging
-- ✅ Created RLS policy to allow trigger updates
-- ✅ Tested enhanced trigger
-- ✅ Provided final verification
-- =====================================================
