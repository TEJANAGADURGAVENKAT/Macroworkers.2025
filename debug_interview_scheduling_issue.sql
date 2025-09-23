-- Debug script to check why workers are not appearing in interview scheduling
-- Run this in Supabase SQL Editor to identify the issue

-- Step 1: Check current worker statuses and document counts
SELECT 
  p.user_id,
  p.full_name,
  p.role,
  p.worker_status,
  p.status,
  p.created_at,
  COUNT(wd.id) as total_documents,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_documents,
  COUNT(CASE WHEN wd.verification_status = 'pending' THEN 1 END) as pending_documents,
  COUNT(CASE WHEN wd.verification_status = 'rejected' THEN 1 END) as rejected_documents
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.role, p.worker_status, p.status, p.created_at
ORDER BY p.created_at DESC;

-- Step 2: Check which workers should be in interview_pending status
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  p.status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.worker_status, p.status
HAVING COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) = 5
ORDER BY p.created_at DESC;

-- Step 3: Check RLS policies on profiles table
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

-- Step 4: Check if there are any workers with interview_pending status
SELECT 
  user_id,
  full_name,
  worker_status,
  status,
  created_at
FROM profiles 
WHERE role = 'worker' 
AND (worker_status = 'interview_pending' OR status = 'interview_pending')
ORDER BY created_at DESC;

-- Step 5: Check recent document approvals
SELECT 
  wd.id,
  wd.worker_id,
  p.full_name,
  wd.document_type,
  wd.verification_status,
  wd.verified_at,
  p2.full_name as verified_by_name
FROM worker_documents wd
JOIN profiles p ON wd.worker_id = p.user_id
LEFT JOIN profiles p2 ON wd.verified_by = p2.user_id
WHERE wd.verification_status = 'approved'
ORDER BY wd.verified_at DESC
LIMIT 10;

