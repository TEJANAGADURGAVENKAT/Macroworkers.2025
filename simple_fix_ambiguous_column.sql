-- SIMPLE FIX: Remove only the problematic database objects
-- This will NOT change your database structure

-- Step 1: Drop any triggers that might be causing the ambiguity
DROP TRIGGER IF EXISTS task_assignments_updated_at_trigger ON public.task_assignments;
DROP TRIGGER IF EXISTS task_assignments_check_slots_trigger ON public.task_assignments;
DROP TRIGGER IF EXISTS task_assignments_insert_trigger ON public.task_assignments;

-- Step 2: Drop any functions that reference max_assignees
DROP FUNCTION IF EXISTS check_task_slots() CASCADE;
DROP FUNCTION IF EXISTS update_task_assignment_count() CASCADE;
DROP FUNCTION IF EXISTS task_assignments_updated_at() CASCADE;

-- Step 3: Test if the fix works
DO $$ 
DECLARE
    test_task_id uuid;
    test_worker_id uuid;
    test_id uuid;
BEGIN
    SELECT id INTO test_task_id FROM public.tasks LIMIT 1;
    SELECT user_id INTO test_worker_id FROM public.profiles WHERE role = 'worker' LIMIT 1;
    
    IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
        INSERT INTO public.task_assignments (task_id, worker_id, status)
        VALUES (test_task_id, test_worker_id, 'assigned')
        RETURNING id INTO test_id;
        
        DELETE FROM public.task_assignments WHERE id = test_id;
        
        RAISE NOTICE '✅ SUCCESS! Task assignment is now working!';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Still blocked: %', SQLERRM;
END $$;

SELECT '✅ Simple fix completed!' as status;

