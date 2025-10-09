# Fix Authentication Issues

## Problem
Getting "400 (Bad Request)" error when trying to sign in, and employer email addresses not being saved during registration.

## Root Causes
1. **Email Confirmation**: Users might not have confirmed their email addresses
2. **RLS Policies**: Row Level Security policies might be blocking profile creation
3. **Profile Creation**: Profile creation might be failing silently during registration

## Solution

### Step 1: Fix RLS Policies for Profile Creation

Run this SQL in your Supabase SQL Editor:

```sql
-- Fix RLS policies for profile creation
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

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;
```

### Step 2: Fix Email Confirmation Issues

Run this SQL to check and fix email confirmation:

```sql
-- Check users with unconfirmed emails
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Manually confirm emails for existing users (if needed)
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
```

### Step 3: Fix Missing Profiles

Run this SQL to create profiles for users who don't have them:

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

### Step 4: Update Existing Profiles with Missing Email

Run this SQL to update profiles with missing email addresses:

```sql
-- Update existing profiles with missing email addresses
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '');
```

### Step 5: Test the Fix

1. **Open Browser Console** (F12 → Console tab)
2. **Try to sign in** with an existing employer account
3. **Check console logs** for:
   - "Attempting to sign in with email:" - Shows sign-in attempt
   - "Sign in successful:" - Shows successful authentication
   - "Sign in error:" - Shows any authentication errors

### Step 6: Test Registration

1. **Register a new employer** with a new email address
2. **Check console logs** for:
   - "Creating profile with data:" - Shows profile creation attempt
   - "Profile created successfully" - Shows successful profile creation
   - Any error messages if creation fails

## Expected Results

After running these fixes:

1. **Sign In**: Should work without 400 errors
2. **Registration**: Should create profiles with email addresses
3. **Admin Panel**: Should show employers with their email addresses
4. **Document Upload**: Should work properly for employers

## Troubleshooting

If issues persist:

1. **Check Console Logs**: Look for specific error messages
2. **Verify RLS Policies**: Ensure policies were created successfully
3. **Check Email Confirmation**: Ensure users have confirmed emails
4. **Check Database**: Verify profiles exist for all users

## Files Modified

- `src/hooks/useAuth.tsx` - Added debugging logs for sign-in and profile creation
- `fix_employer_profile_creation.sql` - Fixes RLS policies
- `fix_authentication_issues.sql` - Fixes authentication issues
- `test_authentication.sql` - Tests authentication setup
- `manual_profile_creation.sql` - Creates missing profiles



