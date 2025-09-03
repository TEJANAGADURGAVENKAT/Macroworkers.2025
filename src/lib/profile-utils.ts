// Profile utilities to ensure valid role values

export type ValidRole = 'worker' | 'employer' | 'admin';

/**
 * Validates and normalizes a role value
 * @param role - The role to validate
 * @param defaultRole - Default role if the provided role is invalid
 * @returns A valid role value
 */
export function validateRole(role: string | null | undefined, defaultRole: ValidRole = 'worker'): ValidRole {
  if (!role || typeof role !== 'string') {
    return defaultRole;
  }
  
  const normalizedRole = role.toLowerCase().trim();
  
  switch (normalizedRole) {
    case 'worker':
    case 'employer':
    case 'admin':
      return normalizedRole as ValidRole;
    case 'employee':
      return 'employer';
    default:
      return defaultRole;
  }
}

/**
 * Ensures a profile object has a valid role
 * @param profile - The profile object to validate
 * @param defaultRole - Default role if the profile doesn't have a valid role
 * @returns The profile with a valid role
 */
export function ensureValidProfileRole(profile: any, defaultRole: ValidRole = 'worker') {
  if (!profile) return profile;
  
  return {
    ...profile,
    role: validateRole(profile.role, defaultRole)
  };
}

/**
 * Creates a safe profile insert object with validated role
 * @param profileData - The profile data to insert
 * @param defaultRole - Default role if not provided
 * @returns Safe profile data for insertion
 */
export function createSafeProfileData(profileData: any, defaultRole: ValidRole = 'worker') {
  const safeData = {
    ...profileData,
    role: validateRole(profileData.role, defaultRole),
    created_at: profileData.created_at || new Date().toISOString(),
    updated_at: profileData.updated_at || new Date().toISOString()
  };
  
  return safeData;
}

/**
 * Creates a safe profile update object with validated role
 * @param profileData - The profile data to update
 * @param defaultRole - Default role if not provided
 * @returns Safe profile data for update
 */
export function createSafeProfileUpdateData(profileData: any, defaultRole: ValidRole = 'worker') {
  const safeData = {
    ...profileData,
    updated_at: new Date().toISOString()
  };
  
  // Only validate role if it's being updated
  if (profileData.role !== undefined) {
    safeData.role = validateRole(profileData.role, defaultRole);
  }
  
  return safeData;
}
