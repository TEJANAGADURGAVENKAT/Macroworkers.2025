-- Test the exact foreign key relationship name
-- This will help us identify the correct syntax for Supabase queries

-- Check foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='worker_interviews';

-- Test different query approaches
-- Approach 1: Direct join
SELECT 
    'APPROACH 1 - DIRECT JOIN' as test_type,
    wi.id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    e.full_name as employer_name
FROM worker_interviews wi
LEFT JOIN profiles e ON wi.employer_id = e.user_id
WHERE wi.result = 'selected'
LIMIT 3;

-- Approach 2: Test if the foreign key relationship works
-- This simulates what Supabase should do
SELECT 
    'APPROACH 2 - FOREIGN KEY TEST' as test_type,
    wi.id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    p.full_name as employer_name
FROM worker_interviews wi
LEFT JOIN profiles p ON wi.employer_id = p.user_id
WHERE wi.result = 'selected'
LIMIT 3;

