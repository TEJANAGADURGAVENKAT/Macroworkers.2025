-- Check the actual structure of the disputes table
-- This will help us understand what columns exist and fix the mismatch

-- Check if disputes table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the table exists at all
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_name = 'disputes' 
AND table_schema = 'public';

-- If table doesn't exist, let's see what tables we have
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%dispute%'
ORDER BY table_name;


