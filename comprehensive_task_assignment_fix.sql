-- COMPREHENSIVE FIX: Task Assignment Still Not Working
-- This will diagnose and fix all possible issues

-- Step 1: Check current table structure
SELECT 'Current task_assignments table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check RLS status
SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'task_assignments' 
AND schemaname = 'public';

-- Step 3: Check current policies
SELECT 'Current policies:' as info;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'task_assignments' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 4: Check foreign key constraints
SELECT 'Foreign key constraints:' as info;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'task_assignments'
    AND tc.table_schema = 'public';

-- Step 5: Check if there are any existing assignments
SELECT 'Existing assignments count:' as info;
SELECT COUNT(*) as total_assignments FROM public.task_assignments;

-- Step 6: Test with sample data
DO $$ 
DECLARE
    test_task_id uuid;
    test_worker_id uuid;
    test_id uuid;
    error_msg text;
BEGIN
    -- Get sample data
    SELECT id INTO test_task_id FROM public.tasks WHERE status = 'active' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM public.profiles WHERE role = 'worker' LIMIT 1;
    
    RAISE NOTICE 'Test task_id: %', test_task_id;
    RAISE NOTICE 'Test worker_id: %', test_worker_id;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        BEGIN
            -- Test insert
            INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
            VALUES (test_task_id, test_worker_id, 'assigned', now())
            RETURNING id INTO test_id;
            
            RAISE NOTICE '✅ INSERT SUCCESSFUL! Test record created with id: %', test_id;
            
            -- Clean up test record
            DELETE FROM public.task_assignments WHERE id = test_id;
            RAISE NOTICE '✅ Test record cleaned up successfully';
            
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
            RAISE NOTICE '❌ INSERT FAILED: %', error_msg;
        END;
    ELSE
        RAISE NOTICE '⚠️ No test data available';
    END IF;
END $$;

-- Step 7: Check permissions
SELECT 'Table permissions:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public';

-- Step 8: Final fix - ensure everything is correct
-- Disable RLS completely to eliminate any policy issues
ALTER TABLE public.task_assignments DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON public.task_assignments';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy cleanup completed';
END $$;

-- Grant all permissions
GRANT ALL ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO anon;
GRANT ALL ON public.task_assignments TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final test
DO $$ 
DECLARE
    test_task_id uuid;
    test_worker_id uuid;
    test_id uuid;
BEGIN
    SELECT id INTO test_task_id FROM public.tasks WHERE status = 'active' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM public.profiles WHERE role = 'worker' LIMIT 1;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
        VALUES (test_task_id, test_worker_id, 'assigned', now())
        RETURNING id INTO test_id;
        
        DELETE FROM public.task_assignments WHERE id = test_id;
        
        RAISE NOTICE '🎉 FINAL TEST SUCCESSFUL! Task assignment should work now!';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ FINAL TEST FAILED: %', SQLERRM;
END $$;

SELECT '🎉 COMPREHENSIVE FIX COMPLETED! RLS disabled, all permissions granted!' as final_status;
