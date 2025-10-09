-- Check for task assignment database issues
-- This will help diagnose the "Database configuration error" you're seeing

-- Check if task_assignments table exists and has proper structure
SELECT 'Checking task_assignments table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any foreign key constraint issues
SELECT 'Checking foreign key constraints for task_assignments:' as info;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'task_assignments'
    AND tc.table_schema = 'public';

-- Check if there are any data type mismatches
SELECT 'Checking for potential data type issues:' as info;
SELECT 
    'task_assignments.worker_id' as column_name,
    'Should reference auth.users(id) or profiles(user_id)' as expected_reference,
    'Check if worker_id values exist in referenced table' as action_needed;

-- Check if profiles table has proper user_id column
SELECT 'Checking profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('id', 'user_id')
ORDER BY column_name;

-- Check if there are any orphaned records
SELECT 'Checking for orphaned task assignments:' as info;
SELECT COUNT(*) as orphaned_assignments
FROM public.task_assignments ta
LEFT JOIN public.profiles p ON ta.worker_id = p.user_id
WHERE p.user_id IS NULL;

-- Check if there are any missing indexes that might cause performance issues
SELECT 'Checking indexes on task_assignments:' as info;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'task_assignments' 
AND schemaname = 'public';

-- Check if RLS policies are properly configured
SELECT 'Checking RLS policies on task_assignments:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'task_assignments' 
AND schemaname = 'public';

-- Check if the table has proper permissions
SELECT 'Checking table permissions:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public';

SELECT '✅ Database check completed! Review the results above to identify the issue.' as final_status;

