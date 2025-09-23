-- Test script to check if auto-redirect setup is working
-- Run this in Supabase SQL Editor to verify the setup

-- Check if status column exists
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'status';

-- Check current worker statuses
SELECT 
  user_id,
  full_name,
  role,
  worker_status,
  status,
  created_at
FROM profiles 
WHERE role = 'worker'
ORDER BY created_at DESC
LIMIT 5;

-- Check if RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test realtime subscription capability
SELECT 
  schemaname,
  tablename,
  hasrls
FROM pg_tables 
WHERE tablename = 'profiles';

