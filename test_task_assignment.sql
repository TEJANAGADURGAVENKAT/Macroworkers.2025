-- Test task assignment directly in database
-- This will help us see what's actually happening

-- Check if we can insert a record manually
DO $$ 
DECLARE
    test_task_id uuid;
    test_worker_id uuid;
    test_id uuid;
    error_details text;
BEGIN
    -- Get sample data
    SELECT id INTO test_task_id FROM public.tasks WHERE status = 'active' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM public.profiles WHERE role = 'worker' LIMIT 1;
    
    RAISE NOTICE 'Testing with task_id: %', test_task_id;
    RAISE NOTICE 'Testing with worker_id: %', test_worker_id;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        BEGIN
            -- Try to insert
            INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
            VALUES (test_task_id, test_worker_id, 'assigned', now())
            RETURNING id INTO test_id;
            
            RAISE NOTICE '✅ INSERT SUCCESSFUL! Created record with id: %', test_id;
            
            -- Check if the record exists
            IF EXISTS (SELECT 1 FROM public.task_assignments WHERE id = test_id) THEN
                RAISE NOTICE '✅ Record confirmed in database';
            ELSE
                RAISE NOTICE '❌ Record not found in database';
            END IF;
            
            -- Clean up
            DELETE FROM public.task_assignments WHERE id = test_id;
            RAISE NOTICE '✅ Test record cleaned up';
            
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_details = MESSAGE_TEXT;
            RAISE NOTICE '❌ INSERT FAILED: %', error_details;
        END;
    ELSE
        RAISE NOTICE '❌ No test data available';
        RAISE NOTICE 'Available tasks: %', (SELECT COUNT(*) FROM public.tasks WHERE status = 'active');
        RAISE NOTICE 'Available workers: %', (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker');
    END IF;
END $$;

-- Check current assignments
SELECT 'Current assignments:' as info;
SELECT COUNT(*) as total_assignments FROM public.task_assignments;

-- Check if there are any constraints blocking inserts
SELECT 'Table constraints:' as info;
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public';

SELECT 'Test completed!' as status;
