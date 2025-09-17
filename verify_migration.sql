-- Verify that the migration was applied correctly
-- Run this in Supabase SQL Editor to check the database structure

-- 1. Check if the new columns exist in tasks table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('assignment_start_time', 'assignment_end_time', 'max_assignees', 'current_assignees')
ORDER BY column_name;

-- 2. Check if there are any tasks with the new fields
SELECT id, title, assignment_start_time, assignment_end_time, max_assignees, current_assignees
FROM public.tasks 
LIMIT 5;

-- 3. Check if the trigger function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_task_assignee_count';

-- 4. Check if the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_assignee_count';

-- 5. Test creating a task with the new fields
INSERT INTO public.tasks (
    title, 
    description, 
    created_by, 
    assignment_start_time, 
    assignment_end_time, 
    max_assignees,
    current_assignees,
    budget,
    status
) VALUES (
    'Test Task with Limits',
    'Test task to verify new fields work',
    (SELECT id FROM auth.users LIMIT 1),
    '09:00',
    '17:00',
    5,
    0,
    1000,
    'active'
) RETURNING id, title, assignment_start_time, assignment_end_time, max_assignees, current_assignees;
