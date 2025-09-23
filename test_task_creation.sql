-- Test task creation to see what's failing
-- Run this to check what's required for task creation

-- 1. Check current tasks table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 2. Check what constraints exist on tasks table
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'tasks';

-- 3. Try creating a minimal test task
INSERT INTO public.tasks (
  title,
  description,
  category,
  role_category,
  difficulty,
  budget,
  status,
  created_by,
  required_rating,
  max_workers,
  assigned_count
) VALUES (
  'Test Task Creation',
  'Test description',
  'Social Media',
  'Digital Marketing',
  'easy',
  500,
  'active',
  (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1),
  1.00,
  5,
  0
) RETURNING id, title, max_workers, assigned_count;

-- 4. Check if the test task was created
SELECT id, title, max_workers, assigned_count, created_by
FROM public.tasks 
WHERE title = 'Test Task Creation';
