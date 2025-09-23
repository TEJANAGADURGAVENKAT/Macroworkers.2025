-- Comprehensive fix for auto-redirect issues
-- Run this script to ensure everything is set up correctly

-- Step 1: Ensure the status column exists and is properly configured
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN status TEXT DEFAULT 'document_upload_pending' 
        CHECK (status IN ('document_upload_pending', 'verification_pending', 'interview_pending', 'interview_scheduled', 'accepted', 'rejected'));
        
        RAISE NOTICE 'Added status column to profiles table';
    ELSE
        RAISE NOTICE 'Status column already exists';
    END IF;
END $$;

-- Step 2: Update existing workers to have the correct status
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
WHERE role = 'worker' AND (status IS NULL OR status = '');

-- Step 3: Enable RLS and create proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Employers can view worker profiles" ON profiles;
DROP POLICY IF EXISTS "Employers can update worker status" ON profiles;
DROP POLICY IF EXISTS "System can update profiles" ON profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND (NEW.status IS NULL OR NEW.status = OLD.status)
  );

CREATE POLICY "Employers can view worker profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles employer_profile 
      WHERE employer_profile.user_id = auth.uid() 
      AND employer_profile.role = 'employer'
    )
    AND role = 'worker'
  );

CREATE POLICY "Employers can update worker status" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles employer_profile 
      WHERE employer_profile.user_id = auth.uid() 
      AND employer_profile.role = 'employer'
    )
    AND role = 'worker'
  );

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_worker_status ON profiles(worker_status);

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Step 6: Test the setup
SELECT 
  'Setup completed successfully' as status,
  COUNT(*) as total_workers,
  COUNT(CASE WHEN status = 'interview_pending' THEN 1 END) as interview_pending_workers
FROM profiles 
WHERE role = 'worker';

-- Step 7: Show current worker statuses
SELECT 
  user_id,
  full_name,
  worker_status,
  status,
  created_at
FROM profiles 
WHERE role = 'worker'
ORDER BY created_at DESC
LIMIT 10;

