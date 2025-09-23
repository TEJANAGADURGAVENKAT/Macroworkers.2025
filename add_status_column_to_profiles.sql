-- Add status column to profiles table for auto-redirect functionality
-- This will enable real-time status tracking for workers

-- Add the status column with ENUM values
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'document_upload_pending' 
CHECK (status IN ('document_upload_pending', 'verification_pending', 'interview_pending', 'interview_scheduled', 'accepted', 'rejected'));

-- Update existing workers to have the correct status based on their worker_status
UPDATE profiles 
SET status = CASE 
  WHEN worker_status = 'document_upload_pending' THEN 'document_upload_pending'
  WHEN worker_status = 'verification_pending' THEN 'verification_pending'
  WHEN worker_status = 'interview_pending' THEN 'interview_pending'
  WHEN worker_status = 'interview_scheduled' THEN 'interview_scheduled'
  WHEN worker_status = 'active_employee' THEN 'accepted'
  WHEN worker_status = 'rejected' THEN 'rejected'
  ELSE 'document_upload_pending'
END
WHERE role = 'worker';

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_status ON profiles(user_id, status);

-- Update RLS policies to allow workers to read their own status
DROP POLICY IF EXISTS "Users can view own profile status" ON profiles;
CREATE POLICY "Users can view own profile status" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Update RLS policies to allow employers to update worker status
DROP POLICY IF EXISTS "Employers can update worker status" ON profiles;
CREATE POLICY "Employers can update worker status" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles employer_profile 
      WHERE employer_profile.user_id = auth.uid() 
      AND employer_profile.role = 'employer'
    )
  );

-- Verify the changes
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
LIMIT 10;
