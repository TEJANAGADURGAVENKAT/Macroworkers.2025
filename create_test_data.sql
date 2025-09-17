-- Create test data to demonstrate the new features
-- Run this in Supabase SQL Editor

BEGIN;

-- First, let's update some existing tasks with the new constraints
UPDATE public.tasks 
SET 
  assignment_start_time = '09:00',
  assignment_end_time = '17:00',
  max_assignees = 5,
  current_assignees = 0
WHERE id IN (
  SELECT id FROM public.tasks 
  WHERE created_by IS NOT NULL
  ORDER BY created_at DESC 
  LIMIT 3
);

-- Create a test task submission with 'assigned' status to show worker details
-- (Replace the UUIDs with actual IDs from your database)

-- First, let's see what tasks and users we have:
DO $$
DECLARE
  test_task_id UUID;
  test_user_id UUID;
  test_employer_id UUID;
BEGIN
  -- Get a task ID
  SELECT id INTO test_task_id FROM public.tasks LIMIT 1;
  
  -- Get a worker user ID (assuming you have users with role 'worker')
  SELECT u.id INTO test_user_id 
  FROM auth.users u 
  JOIN public.profiles p ON p.user_id = u.id 
  WHERE p.role = 'worker' 
  LIMIT 1;
  
  -- Get an employer user ID
  SELECT created_by INTO test_employer_id FROM public.tasks WHERE id = test_task_id;
  
  -- Only proceed if we found the necessary IDs
  IF test_task_id IS NOT NULL AND test_user_id IS NOT NULL AND test_employer_id IS NOT NULL THEN
    -- Create a test assignment
    INSERT INTO public.task_submissions (
      task_id,
      worker_id,
      employer_id,
      status,
      submitted_at
    ) VALUES (
      test_task_id,
      test_user_id,
      test_employer_id,
      'assigned',
      NOW()
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created test assignment for task % with worker %', test_task_id, test_user_id;
  ELSE
    RAISE NOTICE 'Could not find required test data. Task ID: %, User ID: %, Employer ID: %', test_task_id, test_user_id, test_employer_id;
  END IF;
END $$;

COMMIT;

-- Verify the test data was created
SELECT 
  t.id as task_id,
  t.title,
  t.assignment_start_time,
  t.assignment_end_time,
  t.max_assignees,
  t.current_assignees,
  ts.status as submission_status,
  p.full_name as worker_name
FROM public.tasks t
LEFT JOIN public.task_submissions ts ON ts.task_id = t.id
LEFT JOIN public.profiles p ON p.user_id = ts.worker_id
WHERE t.assignment_start_time IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 5;
