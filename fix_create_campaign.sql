-- Fix Create Campaign functionality
-- Run this to ensure task creation works

BEGIN;

-- 1. Check current user and profile setup
SELECT 
  'CURRENT USER CHECK' as section,
  u.id as user_id,
  u.email,
  p.id as profile_id,
  p.user_id as profile_user_id,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 3;

-- 2. Fix the foreign key constraint if needed
-- The constraint should reference auth.users.id, not profiles.user_id
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Test task creation with minimal data
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
  assigned_count,
  slots,
  completed_slots
) VALUES (
  'Test Campaign Creation',
  'Testing the campaign creation system',
  'Social Media',
  'Digital Marketing',
  'easy',
  500,
  'active',
  (SELECT id FROM auth.users WHERE email IS NOT NULL LIMIT 1),
  1.00,
  5,
  0,
  5,
  0
) RETURNING id, title, max_workers, assigned_count;

-- 4. Verify the test task was created
SELECT 
  'VERIFICATION' as section,
  id, 
  title, 
  max_workers, 
  assigned_count, 
  created_by,
  budget
FROM public.tasks 
WHERE title = 'Test Campaign Creation';

-- 5. Clean up test task
DELETE FROM public.tasks WHERE title = 'Test Campaign Creation';

COMMIT;
