# Fix Employer Registration Email Issue

## Problem
When registering as an employer, the email address is not being saved in the database profiles table.

## Root Cause
The issue is likely due to RLS (Row Level Security) policies blocking profile creation or the profile creation process failing silently.

## Solution

### Step 1: Fix RLS Policies for Profile Creation

Run this SQL script in your Supabase SQL Editor:

```sql
-- Fix RLS policies for employer profile creation
BEGIN;

-- Drop existing policies that might be blocking profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies that allow profile creation and updates
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;
```

### Step 2: Test the Registration Process

1. **Open Browser Console** (F12 → Console tab)
2. **Go to registration page** and register as an employer
3. **Check the console** for these logs:
   - "Creating profile with data:" - Shows the profile data being created
   - "Profile created successfully" - Confirms successful creation
   - "Profile creation error:" - Shows any errors during creation
   - "Profile updated successfully" - Shows successful update (if insert failed)

### Step 3: Verify Profile Creation

Run this SQL to check if profiles are being created:

```sql
-- Check if employers have profiles
SELECT 
    u.id,
    u.email,
    u.role,
    u.created_at,
    p.full_name,
    p.email as profile_email,
    p.phone,
    p.category
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'employer'
ORDER BY u.created_at DESC;
```

### Step 4: Manual Profile Creation (If Needed)

If some users don't have profiles, run this SQL to create them:

```sql
-- Create profiles for users who don't have them
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    u.email,
    u.role,
    COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
    COALESCE(u.raw_user_meta_data->>'category', '') as category,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role IN ('employer', 'worker');
```

## What the Fix Does

1. **Fixes RLS Policies**: Ensures users can create and update their own profiles
2. **Adds Debugging**: Console logs show exactly what's happening during registration
3. **Handles Edge Cases**: Tries to update profile if insert fails (in case profile already exists)
4. **Manual Recovery**: Provides SQL to create missing profiles

## Expected Behavior After Fix

1. **Registration Process**:
   - User fills out registration form
   - Profile is created with email, name, phone, role, category
   - Console shows "Profile created successfully"
   - User is redirected to `/employer/verify`

2. **Database State**:
   - `auth.users` table has the user record
   - `public.profiles` table has the profile record with email
   - Both records are linked by `user_id`

3. **Admin Panel**:
   - Employers appear in the admin panel with their email addresses
   - Document verification works properly

## Troubleshooting

If the issue persists:

1. **Check Console Logs**: Look for "Profile creation error" messages
2. **Check RLS Policies**: Verify the policies were created successfully
3. **Check Database**: Run the test SQL to see if profiles exist
4. **Manual Creation**: Use the manual profile creation SQL if needed

## Files Modified

- `src/hooks/useAuth.tsx` - Added debugging logs to profile creation
- `fix_employer_profile_creation.sql` - Fixes RLS policies
- `test_employer_registration.sql` - Tests the registration process
- `manual_profile_creation.sql` - Creates missing profiles



