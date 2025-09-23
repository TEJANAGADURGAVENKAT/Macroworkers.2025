-- Update RLS policies for auto-redirect functionality
-- This ensures proper security for the new status column and realtime subscriptions

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile status" ON profiles;
DROP POLICY IF EXISTS "Employers can update worker status" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive RLS policies for profiles table

-- Policy 1: Users can view their own profile (including status)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Users can update their own profile (except status changes)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND (NEW.status IS NULL OR NEW.status = OLD.status)
  );

-- Policy 3: Employers can view worker profiles
CREATE POLICY "Employers can view worker profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles employer_profile 
      WHERE employer_profile.user_id = auth.uid() 
      AND employer_profile.role = 'employer'
    )
    AND role = 'worker'
  );

-- Policy 4: Employers can update worker status
CREATE POLICY "Employers can update worker status" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles employer_profile 
      WHERE employer_profile.user_id = auth.uid() 
      AND employer_profile.role = 'employer'
    )
    AND role = 'worker'
  );

-- Policy 5: System can update profiles (for triggers and functions)
CREATE POLICY "System can update profiles" ON profiles
  FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_worker_status ON profiles(worker_status);

-- Update worker_documents RLS policies
ALTER TABLE worker_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing worker_documents policies
DROP POLICY IF EXISTS "Workers can view own documents" ON worker_documents;
DROP POLICY IF EXISTS "Employers can view worker documents" ON worker_documents;
DROP POLICY IF EXISTS "Employers can update worker documents" ON worker_documents;

-- Create worker_documents policies
CREATE POLICY "Workers can view own documents" ON worker_documents
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Employers can view worker documents" ON worker_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles employer_profile 
      WHERE employer_profile.user_id = auth.uid() 
      AND employer_profile.role = 'employer'
    )
  );

CREATE POLICY "Employers can update worker documents" ON worker_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles employer_profile 
      WHERE employer_profile.user_id = auth.uid() 
      AND employer_profile.role = 'employer'
    )
  );

-- Update worker_interviews RLS policies
ALTER TABLE worker_interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing worker_interviews policies
DROP POLICY IF EXISTS "Workers can view own interviews" ON worker_interviews;
DROP POLICY IF EXISTS "Employers can manage interviews" ON worker_interviews;

-- Create worker_interviews policies
CREATE POLICY "Workers can view own interviews" ON worker_interviews
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Employers can manage interviews" ON worker_interviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles employer_profile 
      WHERE employer_profile.user_id = auth.uid() 
      AND employer_profile.role = 'employer'
    )
  );

-- Create a function to check if user is employer
CREATE OR REPLACE FUNCTION is_employer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is worker
CREATE OR REPLACE FUNCTION is_worker()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT, UPDATE ON worker_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON worker_interviews TO authenticated;

-- Test the policies
SELECT 'RLS policies updated successfully' as status;

