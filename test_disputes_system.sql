-- Test script for disputes system
-- Run this in your Supabase SQL Editor after creating the disputes system

-- 1. Test creating a dispute (replace with actual user IDs from your database)
/*
INSERT INTO public.disputes (
  raised_by,
  dispute_type,
  title,
  description
) VALUES (
  'USER_ID_HERE', -- Replace with actual user ID
  'payment',
  'Payment Issue',
  'Payment was promised within 3 days but it has been 2 weeks. The employer is not responding to messages.'
);
*/

-- 2. Check if disputes table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if RLS policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('disputes', 'dispute_attachments', 'dispute_comments')
ORDER BY tablename, policyname;

-- 4. Check if storage bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'dispute-attachments';

-- 5. Check if functions were created
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_dispute_id', 'set_dispute_id', 'update_updated_at_column');

-- 6. Check if triggers were created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'disputes';


