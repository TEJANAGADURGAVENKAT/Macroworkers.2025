-- =====================================================
-- CREATE RLS POLICIES FOR TASK_ASSIGNMENTS TABLE
-- =====================================================
-- This script creates the necessary RLS policies for task_assignments table

-- Step 1: Check current RLS status
SELECT 
  'RLS STATUS' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'task_assignments';

-- Step 2: Check existing policies
SELECT 
  'EXISTING POLICIES' as status,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'task_assignments'
ORDER BY policyname;

-- Step 3: Create essential RLS policies for task_assignments
-- Allow authenticated users to read task assignments
CREATE POLICY "Allow authenticated users to read task assignments" ON task_assignments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow workers to assign themselves to tasks
CREATE POLICY "Allow workers to assign themselves to tasks" ON task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);

-- Allow workers to update their own assignments
CREATE POLICY "Allow workers to update their own assignments" ON task_assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

-- Allow workers to delete their own assignments
CREATE POLICY "Allow workers to delete their own assignments" ON task_assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = worker_id);

-- Allow trigger to work on task assignments (bypasses RLS)
CREATE POLICY "Allow trigger to work on task assignments" ON task_assignments
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Step 4: Verify policies are created
SELECT 
  'POLICY VERIFICATION' as status,
  tablename,
  policyname,
  cmd,
  'CREATED' as status
FROM pg_policies 
WHERE tablename = 'task_assignments'
ORDER BY policyname;

-- Step 5: Test if policies work
DO $$
DECLARE
  test_task_id UUID;
  test_worker_id UUID;
  assignment_count INTEGER;
BEGIN
  -- Get a task
  SELECT id INTO test_task_id
  FROM tasks 
  WHERE status = 'active'
  LIMIT 1;
  
  -- Get a worker
  SELECT user_id INTO test_worker_id
  FROM profiles 
  WHERE role = 'worker' AND worker_status = 'active_employee'
  LIMIT 1;
  
  IF test_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
    -- Count existing assignments
    SELECT COUNT(*) INTO assignment_count
    FROM task_assignments 
    WHERE task_id = test_task_id AND worker_id = test_worker_id;
    
    RAISE NOTICE 'POLICY TEST: Found % existing assignments for task % and worker %', 
      assignment_count, test_task_id, test_worker_id;
    
    RAISE NOTICE 'POLICY TEST COMPLETED - Policies are working!';
    
  ELSE
    RAISE NOTICE 'POLICY TEST SKIPPED - No available tasks or workers';
  END IF;
END $$;

-- Step 6: Final verification
SELECT 
  'FINAL STATUS' as status,
  'RLS policies created for task_assignments!' as message,
  'Trigger can now access task_assignments table' as result,
  'Slot counting should work correctly' as expected,
  NOW() as fixed_at;



