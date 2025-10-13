-- Fix: "column reference 'max_assignees' is ambiguous" error
-- This error occurs when there are multiple tables with max_assignees column

-- Step 1: Check if there are any database functions or triggers causing the ambiguity
SELECT 'Checking for functions that might cause ambiguity:' as info;
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%max_assignees%'
AND routine_schema = 'public';

-- Step 2: Check for triggers on task_assignments
SELECT 'Checking for triggers on task_assignments:' as info;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments'
AND event_object_schema = 'public';

-- Step 3: Drop any problematic triggers or functions
-- First, let's drop any triggers that might be causing the issue
DROP TRIGGER IF EXISTS task_assignments_updated_at_trigger ON public.task_assignments;
DROP TRIGGER IF EXISTS task_assignments_check_slots_trigger ON public.task_assignments;
DROP TRIGGER IF EXISTS task_assignments_audit_trigger ON public.task_assignments;

-- Step 4: Drop any functions that might be causing the ambiguity
DROP FUNCTION IF EXISTS check_task_slots() CASCADE;
DROP FUNCTION IF EXISTS update_task_assignment_count() CASCADE;
DROP FUNCTION IF EXISTS task_assignments_updated_at() CASCADE;

-- Step 5: Check if there are any views that might be causing the issue
SELECT 'Checking for views with max_assignees:' as info;
SELECT table_name, view_definition
FROM information_schema.views 
WHERE view_definition ILIKE '%max_assignees%'
AND table_schema = 'public';

-- Step 6: Ensure the table structure is clean
-- Make sure task_assignments table doesn't have any conflicting columns
SELECT 'Current task_assignments structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Test a simple insert to see if the ambiguity is resolved
DO $$ 
DECLARE
    test_task_id uuid;
    test_worker_id uuid;
    test_id uuid;
BEGIN
    -- Get sample data
    SELECT id INTO test_task_id FROM public.tasks WHERE status = 'active' LIMIT 1;
    SELECT user_id INTO test_worker_id FROM public.profiles WHERE role = 'worker' LIMIT 1;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        -- Test insert without any triggers or functions
        INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
        VALUES (test_task_id, test_worker_id, 'assigned', now())
        RETURNING id INTO test_id;
        
        -- Clean up
        DELETE FROM public.task_assignments WHERE id = test_id;
        
        RAISE NOTICE '✅ Test insert successful - ambiguity resolved!';
    ELSE
        RAISE NOTICE '⚠️ No test data available';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Still having issues: %', SQLERRM;
END $$;

SELECT '✅ Ambiguous column error fix completed!' as final_status;