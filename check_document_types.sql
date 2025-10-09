-- Check allowed document types in worker_documents table
-- Run this in your Supabase SQL editor

-- 1. Check the constraint on document_type column
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.worker_documents'::regclass 
AND contype = 'c';

-- 2. Check current document types in the table
SELECT DISTINCT document_type, COUNT(*) as count
FROM public.worker_documents 
GROUP BY document_type
ORDER BY document_type;

-- 3. Check if the table exists and has the right structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'worker_documents' 
AND table_schema = 'public'
ORDER BY ordinal_position;



