-- Debug task creation issues
-- Run this to identify and fix the problem

-- 1. Check the current user and profile relationship
SELECT 
  'USER CHECK' as check_type,
  u.id as auth_user_id,
  p.id as profile_id,
  p.user_id as profile_user_id,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.role = 'employer'
LIMIT 5;

-- 2. Check tasks table constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'tasks' AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Test minimal task creation
DO $$
DECLARE
  test_user_id UUID;
  test_profile_id UUID;
BEGIN
  -- Get an employer user
  SELECT u.id, p.id INTO test_user_id, test_profile_id
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE p.role = 'employer'
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try creating a minimal task
    INSERT INTO public.tasks (
      title,
      description,
      category,
      budget,
      status,
      created_by,
      max_workers,
      assigned_count
    ) VALUES (
      'Debug Test Task',
      'Testing task creation',
      'Social Media',
      500,
      'active',
      test_user_id,  -- Using auth.users.id
      5,
      0
    );
    
    RAISE NOTICE 'Task created successfully with user_id: %', test_user_id;
  ELSE
    RAISE NOTICE 'No employer found in database';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating task: %', SQLERRM;
END $$;

-- 4. Check if the test task was created
SELECT id, title, created_by, max_workers, assigned_count
FROM public.tasks 
WHERE title = 'Debug Test Task';

-- 5. Clean up test task
DELETE FROM public.tasks WHERE title = 'Debug Test Task';
