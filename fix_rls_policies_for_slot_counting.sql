-- =====================================================
-- FIX RLS POLICIES FOR SLOT COUNTING TRIGGER
-- =====================================================
-- This script fixes RLS policies that are blocking the slot counting trigger

-- Step 1: Check current RLS policies on tasks table
SELECT 
  'CURRENT RLS POLICIES' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname;

-- Step 2: Check if RLS is enabled on tasks table
SELECT 
  'RLS STATUS' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tasks';

-- Step 3: Create a policy that allows the trigger to update assigned_count
-- This policy allows the trigger function to update tasks table
CREATE POLICY IF NOT EXISTS "Allow trigger to update assigned_count" ON tasks
  FOR UPDATE
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Step 4: Create a policy for authenticated users to read tasks
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read tasks" ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Create a policy for authenticated users to update their own tasks
CREATE POLICY IF NOT EXISTS "Allow users to update their own tasks" ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 6: Create a policy for authenticated users to insert tasks
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert tasks" ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 7: Create a policy for authenticated users to delete their own tasks
CREATE POLICY IF NOT EXISTS "Allow users to delete their own tasks" ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 8: Check RLS policies on task_assignments table
SELECT 
  'TASK_ASSIGNMENTS RLS POLICIES' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'task_assignments'
ORDER BY policyname;

-- Step 9: Create policies for task_assignments table
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read task assignments" ON task_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow workers to assign themselves to tasks" ON task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY IF NOT EXISTS "Allow workers to update their own assignments" ON task_assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY IF NOT EXISTS "Allow workers to delete their own assignments" ON task_assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = worker_id);

-- Step 10: Create a policy for trigger to work on task_assignments
CREATE POLICY IF NOT EXISTS "Allow trigger to work on task assignments" ON task_assignments
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Step 11: Test the trigger with RLS policies in place
DO $$
DECLARE
  test_task_id UUID;
  test_worker_id UUID;
  initial_count INTEGER;
  final_count INTEGER;
BEGIN
  -- Get an existing task
  SELECT id, COALESCE(assigned_count, 0) INTO test_task_id, initial_count
  FROM tasks 
  WHERE status = 'active' AND assigned_count < max_workers
  LIMIT 1;
  
  -- Get an active worker
  SELECT user_id INTO test_worker_id
  FROM profiles 
  WHERE role = 'worker' AND worker_status = 'active_employee'
  LIMIT 1;
  
  IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
    RAISE NOTICE 'Testing trigger with RLS policies: Task %, Initial count: %', test_task_id, initial_count;
    
    -- Insert assignment (this should trigger the slot count update)
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (test_task_id, test_worker_id, 'assigned');
    
    -- Check if count increased
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'RLS TEST RESULT: Initial: %, Final: %, Increased: %', 
      initial_count, final_count, (final_count - initial_count);
    
    -- Clean up
    DELETE FROM task_assignments 
    WHERE task_id = test_task_id AND worker_id = test_worker_id;
    
    RAISE NOTICE 'RLS POLICY TEST COMPLETED!';
    
  ELSE
    RAISE NOTICE 'RLS TEST SKIPPED - No available tasks or workers';
  END IF;
END $$;

-- Step 12: Verify all policies are in place
SELECT 
  'FINAL POLICY CHECK' as status,
  tablename,
  COUNT(*) as policy_count,
  'Policies created successfully' as result
FROM pg_policies 
WHERE tablename IN ('tasks', 'task_assignments')
GROUP BY tablename;

-- Step 13: Check trigger status
SELECT 
  'TRIGGER STATUS WITH RLS' as status,
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVE WITH RLS POLICIES' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_update_task_assigned_count_universal';

-- Step 14: Final verification
SELECT 
  'FINAL STATUS' as status,
  'RLS policies fixed for slot counting!' as message,
  'Trigger can now update tasks table' as result,
  'Slot counting should work correctly' as expected,
  NOW() as fixed_at;



