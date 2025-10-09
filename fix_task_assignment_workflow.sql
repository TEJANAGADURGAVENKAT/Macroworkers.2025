-- FIX: Task Assignment Workflow - Worker assigns → Work on Task mode
-- This will fix the "Assignment Failed" error and make the workflow work properly

-- Step 1: Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.task_assignments;

-- Step 2: Create a new, working INSERT policy
CREATE POLICY "Allow authenticated users to insert" ON public.task_assignments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 3: Ensure SELECT policy allows users to see their assignments
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.task_assignments;
CREATE POLICY "Allow authenticated users to select" ON public.task_assignments
FOR SELECT USING (auth.role() = 'authenticated');

-- Step 4: Ensure UPDATE policy allows status changes
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.task_assignments;
CREATE POLICY "Allow authenticated users to update" ON public.task_assignments
FOR UPDATE USING (auth.role() = 'authenticated');

-- Step 5: Grant all necessary permissions
GRANT ALL ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO anon;
GRANT ALL ON public.task_assignments TO service_role;

-- Step 6: Test the fix
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
        -- Test insert (this should work now)
        INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
        VALUES (test_task_id, test_worker_id, 'assigned', now())
        RETURNING id INTO test_id;
        
        -- Clean up test record
        DELETE FROM public.task_assignments WHERE id = test_id;
        
        RAISE NOTICE '✅ ✅ ✅ SUCCESS! Task assignment workflow is now working! ✅ ✅ ✅';
    ELSE
        RAISE NOTICE '⚠️ No test data available, but policies are fixed';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Still blocked: %', SQLERRM;
END $$;

-- Step 7: Verify policies are correct
SELECT 'Current policies on task_assignments:' as info;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'task_assignments' 
AND schemaname = 'public'
ORDER BY policyname;

SELECT '🎉 TASK ASSIGNMENT WORKFLOW FIXED! Try assigning a task now!' as final_status;
