-- Test category filtering functionality
-- Run this to test that tasks show correctly based on worker categories

BEGIN;

-- 1. Create test tasks for each category
INSERT INTO public.tasks (
  title, description, category, role_category, difficulty, budget, status, 
  created_by, required_rating, max_workers, assigned_count
) VALUES 
  ('IT Developer Task', 'Need a skilled developer for React project', 'Data Entry', 'IT', 'medium', 1000, 'active', 
   (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1), 1.0, 3, 0),
  ('Digital Marketing Campaign', 'Create social media marketing campaign', 'Social Media', 'Digital Marketing', 'easy', 500, 'active', 
   (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1), 1.0, 2, 0),
  ('Blockchain Smart Contract', 'Audit smart contract for DeFi project', 'Content Creation', 'Blockchain/AI', 'hard', 2000, 'active', 
   (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1), 3.0, 1, 0),
  ('General Task', 'General task available to all workers', 'Surveys', 'General', 'easy', 100, 'active', 
   (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1), 1.0, 5, 0)
ON CONFLICT DO NOTHING;

-- 2. Show all test tasks with their categories
SELECT 
  'TEST TASKS CREATED' as section,
  title,
  category as task_category,
  role_category,
  required_rating,
  max_workers,
  assigned_count,
  status
FROM public.tasks 
WHERE title IN ('IT Developer Task', 'Digital Marketing Campaign', 'Blockchain Smart Contract', 'General Task')
ORDER BY role_category;

-- 3. Show worker profiles and their categories
SELECT 
  'WORKER PROFILES' as section,
  full_name,
  category as worker_category,
  rating,
  role
FROM public.profiles 
WHERE role = 'worker'
ORDER BY category, full_name;

-- 4. Test filtering logic - simulate what the frontend does
-- For IT workers
SELECT 
  'TASKS FOR IT WORKERS' as section,
  t.title,
  t.role_category,
  t.required_rating,
  'Should match IT workers' as note
FROM public.tasks t
WHERE t.status = 'active'
  AND (t.role_category IS NULL OR t.role_category = 'General' OR t.role_category = 'IT')
  AND t.required_rating <= 1.0
ORDER BY t.title;

-- For Digital Marketing workers
SELECT 
  'TASKS FOR DIGITAL MARKETING WORKERS' as section,
  t.title,
  t.role_category,
  t.required_rating,
  'Should match Digital Marketing workers' as note
FROM public.tasks t
WHERE t.status = 'active'
  AND (t.role_category IS NULL OR t.role_category = 'General' OR t.role_category = 'Digital Marketing')
  AND t.required_rating <= 1.0
ORDER BY t.title;

-- For Blockchain/AI workers
SELECT 
  'TASKS FOR BLOCKCHAIN/AI WORKERS' as section,
  t.title,
  t.role_category,
  t.required_rating,
  'Should match Blockchain/AI workers' as note
FROM public.tasks t
WHERE t.status = 'active'
  AND (t.role_category IS NULL OR t.role_category = 'General' OR t.role_category = 'Blockchain/AI')
  AND t.required_rating <= 3.0  -- Higher rating requirement for blockchain tasks
ORDER BY t.title;

-- 5. Cleanup test data
DELETE FROM public.tasks 
WHERE title IN ('IT Developer Task', 'Digital Marketing Campaign', 'Blockchain Smart Contract', 'General Task');

COMMIT;
