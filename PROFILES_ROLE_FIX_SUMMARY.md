# Profiles Role Constraint Fix Summary

## Problem
The error `"violates check constraint profiles_role_check"` was occurring because:
1. Some profiles had NULL, empty, or invalid role values
2. The database constraint only allowed 'worker', 'employer', and 'admin' roles
3. Code was not always ensuring valid role values when creating/updating profiles

## Solution Implemented

### 1. Database Fix (`fix_profiles_role_constraint.sql`)
- **Analyzes current roles** to identify invalid values
- **Drops existing constraint** temporarily
- **Fixes all invalid roles**:
  - NULL/empty → 'worker'
  - 'employee' → 'employer'
  - Other invalid values → 'worker'
- **Adds correct constraint** allowing 'worker', 'employer', 'admin'
- **Sets default value** for role column to 'worker'
- **Makes role column NOT NULL**
- **Verifies all profiles** have valid roles

### 2. Code Fixes

#### A. Profile Utilities (`src/lib/profile-utils.ts`)
Created utility functions to ensure valid roles:
- `validateRole()` - Validates and normalizes role values
- `createSafeProfileData()` - Creates safe profile data for insertion
- `createSafeProfileUpdateData()` - Creates safe profile data for updates
- `ensureValidProfileRole()` - Ensures profile objects have valid roles

#### B. Updated Components
Updated all profile-related components to use safe functions:

1. **useAuth.tsx** - Profile creation and updates during registration
2. **EmployerProfile.tsx** - Employer profile updates
3. **WorkerProfile.tsx** - Worker profile updates  
4. **AdminProfile.tsx** - Admin profile updates

### 3. Role Validation Logic
The validation function handles:
- **NULL/undefined values** → defaults to 'worker'
- **Empty strings** → defaults to 'worker'
- **'employee'** → converts to 'employer'
- **'worker', 'employer', 'admin'** → keeps as is
- **Any other value** → defaults to 'worker'

## Files Modified

### Database Scripts
- `fix_profiles_role_constraint.sql` - Comprehensive database fix
- `simple_fix_counts.sql` - Updated to handle admin role

### Code Files
- `src/lib/profile-utils.ts` - NEW: Profile validation utilities
- `src/hooks/useAuth.tsx` - Updated to use safe profile functions
- `src/pages/employer/EmployerProfile.tsx` - Updated to use safe updates
- `src/pages/worker/WorkerProfile.tsx` - Updated to use safe updates
- `src/pages/admin/AdminProfile.tsx` - Updated to use safe updates
- `src/pages/admin/AdminDashboard.tsx` - Enhanced to show admin counts

## Testing Steps

1. **Run the database fix**:
   ```sql
   -- Copy and paste fix_profiles_role_constraint.sql into Supabase SQL Editor
   ```

2. **Verify the fix**:
   - Check that all profiles have valid roles
   - Confirm constraint is working
   - Test profile creation/updates

3. **Test the application**:
   - Try creating new user accounts
   - Update existing profiles
   - Check Admin Dashboard counts

## Expected Results

After applying these fixes:
- ✅ No more constraint violation errors
- ✅ All profiles have valid roles ('worker', 'employer', 'admin')
- ✅ Profile creation/updates always include valid roles
- ✅ Admin Dashboard shows correct counts for all roles
- ✅ Default role is 'worker' for new profiles

## Prevention

The utility functions ensure that:
- All profile operations validate roles before database operations
- Invalid roles are automatically corrected
- Default values are provided when roles are missing
- Code is consistent across all profile-related components
