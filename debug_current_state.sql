-- Debug current state of tasks and workers
-- Run this to see what data currently exists

-- 1. Check if required columns exist
SELECT 
  'COLUMN CHECK' as section,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('role_category', 'required_rating', 'max_workers', 'assigned_count')
ORDER BY column_name;

-- 2. Check current tasks
SELECT 
  'CURRENT TASKS' as section,
  id,
  title,
  category,
  role_category,
  required_rating,
  status,
  max_workers,
  assigned_count,
  created_at
FROM public.tasks 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check current worker profiles
SELECT 
  'CURRENT WORKERS' as section,
  user_id,
  full_name,
  role,
  category,
  rating,
  total_tasks_completed
FROM public.profiles 
WHERE role = 'worker'
ORDER BY full_name
LIMIT 10;

-- 4. Check for any tasks without role_category
SELECT 
  'TASKS WITHOUT ROLE_CATEGORY' as section,
  COUNT(*) as count
FROM public.tasks 
WHERE role_category IS NULL;

-- 5. Check for workers without category
SELECT 
  'WORKERS WITHOUT CATEGORY' as section,
  COUNT(*) as count
FROM public.profiles 
WHERE role = 'worker' AND category IS NULL;

-- 6. Show task distribution by role_category
SELECT 
  'TASK DISTRIBUTION' as section,
  role_category,
  COUNT(*) as task_count,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
FROM public.tasks 
GROUP BY role_category
ORDER BY task_count DESC;

-- 7. Show worker distribution by category
SELECT 
  'WORKER DISTRIBUTION' as section,
  category,
  COUNT(*) as worker_count,
  AVG(rating) as avg_rating
FROM public.profiles 
WHERE role = 'worker'
GROUP BY category
ORDER BY worker_count DESC;
