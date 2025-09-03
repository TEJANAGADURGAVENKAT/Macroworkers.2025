-- Test Script for Rating System
-- Run this after applying the migration to verify everything works

-- 1. Check if all new columns were added
SELECT 'Checking new columns in profiles table:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('rating', 'total_tasks_completed', 'total_earnings', 'skills', 'languages')
ORDER BY column_name;

SELECT 'Checking new columns in tasks table:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN ('required_rating', 'time_slot_start', 'time_slot_end', 'time_slot_date', 'is_time_sensitive', 'difficulty')
ORDER BY column_name;

-- 2. Check if existing data was updated with defaults
SELECT 'Checking existing worker profiles:' as info;
SELECT 
  role,
  rating,
  total_tasks_completed,
  total_earnings,
  skills,
  languages
FROM profiles 
WHERE role = 'worker'
LIMIT 5;

SELECT 'Checking existing tasks:' as info;
SELECT 
  title,
  required_rating,
  difficulty,
  is_time_sensitive
FROM tasks 
LIMIT 5;

-- 3. Test the rating functions
SELECT 'Testing can_worker_access_task function:' as info;
-- This will test if a worker with rating 3.0 can access a task requiring rating 2.0
SELECT 
  p.full_name,
  p.rating as worker_rating,
  t.title as task_title,
  t.required_rating as task_required_rating,
  can_worker_access_task(p.user_id, t.id) as can_access
FROM profiles p
CROSS JOIN tasks t
WHERE p.role = 'worker' 
  AND p.rating >= 3.0
  AND t.required_rating <= 2.0
LIMIT 3;

-- 4. Check if indexes were created
SELECT 'Checking new indexes:' as info;
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%rating%' 
   OR indexname LIKE 'idx_%difficulty%'
   OR indexname LIKE 'idx_%time_slot%'
ORDER BY indexname;

-- 5. Test worker search view
SELECT 'Testing worker_search_view:' as info;
SELECT 
  full_name,
  rating,
  total_tasks_completed,
  skills,
  languages
FROM worker_search_view
LIMIT 5;

-- 6. Check RLS policies
SELECT 'Checking RLS policies:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'tasks', 'task_submissions')
ORDER BY tablename, policyname;

-- Success message
SELECT 'Rating system test completed successfully!' as status; 