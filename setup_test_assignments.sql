-- Set up test data to demonstrate the new assignment system
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Update existing tasks with max_workers
UPDATE public.tasks 
SET 
  max_workers = 5,
  assigned_count = 0
WHERE max_workers IS NULL
LIMIT 5;

-- 2. Create a test assignment for the "Social Media Manager Task"
-- (Replace with actual task and user IDs from your database)

-- Find the Social Media Manager Task
DO $$
DECLARE
  social_task_id UUID;
  test_worker_id UUID;
BEGIN
  -- Get the Social Media Manager Task ID
  SELECT id INTO social_task_id 
  FROM public.tasks 
  WHERE title ILIKE '%social media%manager%' 
  LIMIT 1;
  
  -- Get a worker user ID
  SELECT user_id INTO test_worker_id 
  FROM public.profiles 
  WHERE role = 'worker' 
  LIMIT 1;
  
  -- Create assignment if both IDs exist
  IF social_task_id IS NOT NULL AND test_worker_id IS NOT NULL THEN
    INSERT INTO public.task_assignments (
      task_id,
      worker_id,
      status,
      assigned_at
    ) VALUES (
      social_task_id,
      test_worker_id,
      'assigned',
      NOW()
    ) ON CONFLICT (task_id, worker_id) DO NOTHING;
    
    RAISE NOTICE 'Created assignment for task % with worker %', social_task_id, test_worker_id;
  ELSE
    RAISE NOTICE 'Could not find required data. Task: %, Worker: %', social_task_id, test_worker_id;
  END IF;
END $$;

-- 3. Verify the data
SELECT 
  t.title,
  t.max_workers,
  t.assigned_count,
  ta.worker_id,
  ta.status,
  ta.assigned_at,
  p.full_name as worker_name,
  p.email as worker_email
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON ta.task_id = t.id
LEFT JOIN public.profiles p ON p.user_id = ta.worker_id
WHERE t.max_workers IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 10;

COMMIT;
