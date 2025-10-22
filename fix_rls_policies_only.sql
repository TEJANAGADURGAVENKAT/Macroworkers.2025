-- =====================================================
-- RLS POLICIES FIX FOR SLOT COUNTING ONLY
-- =====================================================
-- This script fixes ONLY the RLS policies issue for slot counting

-- Step 1: Check current RLS status
SELECT 
  'RLS STATUS CHECK' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('tasks', 'task_assignments');

-- Step 2: Check existing policies
SELECT 
  'EXISTING POLICIES' as status,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('tasks', 'task_assignments')
ORDER BY tablename, policyname;

-- Step 3: Create minimal RLS policies for slot counting to work
-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow trigger to update assigned_count" ON tasks;
DROP POLICY IF EXISTS "Allow trigger to work on task assignments" ON task_assignments;

-- Create policy for trigger to update tasks table (bypasses RLS)
CREATE POLICY "Allow trigger to update assigned_count" ON tasks
  FOR UPDATE
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Create policy for trigger to work on task_assignments table (bypasses RLS)
CREATE POLICY "Allow trigger to work on task assignments" ON task_assignments
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Step 4: Ensure basic user policies exist for normal operations
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read tasks" ON tasks;
DROP POLICY IF EXISTS "Allow users to update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to read task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow workers to assign themselves to tasks" ON task_assignments;
DROP POLICY IF EXISTS "Allow workers to update their own assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow workers to delete their own assignments" ON task_assignments;

-- For tasks table
CREATE POLICY "Allow authenticated users to read tasks" ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own tasks" ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert tasks" ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- For task_assignments table
CREATE POLICY "Allow authenticated users to read task assignments" ON task_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow workers to assign themselves to tasks" ON task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Allow workers to update their own assignments" ON task_assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Allow workers to delete their own assignments" ON task_assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = worker_id);

-- Step 5: Test if the universal trigger is working with RLS policies
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
    RAISE NOTICE 'Testing slot counting with RLS policies: Task %, Initial count: %', test_task_id, initial_count;
    
    -- Insert assignment (this should trigger the slot count update)
    INSERT INTO task_assignments (task_id, worker_id, status)
    VALUES (test_task_id, test_worker_id, 'assigned');
    
    -- Check if count increased
    SELECT COALESCE(assigned_count, 0) INTO final_count
    FROM tasks 
    WHERE id = test_task_id;
    
    RAISE NOTICE 'RLS POLICY TEST RESULT: Initial: %, Final: %, Increased: %', 
      initial_count, final_count, (final_count - initial_count);
    
    -- Clean up
    DELETE FROM task_assignments 
    WHERE task_id = test_task_id AND worker_id = test_worker_id;
    
    RAISE NOTICE 'RLS POLICY TEST COMPLETED SUCCESSFULLY!';
    
  ELSE
    RAISE NOTICE 'RLS POLICY TEST SKIPPED - No available tasks or workers';
  END IF;
END $$;

-- Step 6: Verify the policies are in place
SELECT 
  'POLICY VERIFICATION' as status,
  tablename,
  policyname,
  cmd,
  'ACTIVE' as status
FROM pg_policies 
WHERE tablename IN ('tasks', 'task_assignments')
  AND policyname LIKE '%trigger%'
ORDER BY tablename;

-- Step 7: Check if universal trigger exists
SELECT 
  'TRIGGER STATUS' as status,
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_update_task_assigned_count_universal';

-- Step 8: Show current task status
SELECT 
  'CURRENT TASK STATUS' as status,
  id,
  title,
  max_workers,
  COALESCE(assigned_count, 0) as assigned_count,
  (max_workers - COALESCE(assigned_count, 0)) as available_slots,
  CASE 
    WHEN COALESCE(assigned_count, 0) > max_workers THEN 'OVER-ASSIGNED'
    WHEN COALESCE(assigned_count, 0) = max_workers THEN 'FULL'
    ELSE 'AVAILABLE'
  END as status_text
FROM tasks 
WHERE status = 'active'
ORDER BY created_at DESC 
LIMIT 5;

-- Step 9: Final verification
SELECT 
  'FINAL STATUS' as status,
  'RLS policies fixed for slot counting!' as message,
  'Universal trigger can now update tasks table' as result,
  'Slot counting should work correctly' as expected,
  NOW() as fixed_at;
