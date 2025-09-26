import { db } from '../db/drizzle';
import { parentProfiles } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { NewParentProfile, ParentProfile } from '../db/schema';

export interface ParentProfileData {
  schoolId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: boolean;
}

/**
 * Find existing parent profile by email, or create new one if not found
 */
export async function findOrCreateParentProfile(
  data: ParentProfileData,
  tx?: any
): Promise<ParentProfile> {
  const dbInstance = tx || db;

  // First, try to find existing parent profile by email within the same school
  const existingResults = await dbInstance
    .select()
    .from(parentProfiles)
    .where(and(
      eq(parentProfiles.email, data.email),
      eq(parentProfiles.schoolId, data.schoolId)
    ))
    .limit(1);

  if (existingResults.length > 0) {
    return existingResults[0];
  }

  // If not found, create new parent profile
  const newParentData: NewParentProfile = {
    schoolId: data.schoolId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    emergencyContact: data.emergencyContact ?? true,
  };

  const results = await dbInstance
    .insert(parentProfiles)
    .values(newParentData)
    .returning();

  return results[0];
}

/**
 * Find existing parent profile by email (without creating)
 */
export async function findParentByEmail(
  email: string,
  schoolId: number,
  tx?: any
): Promise<ParentProfile | null> {
  const dbInstance = tx || db;

  const results = await dbInstance
    .select()
    .from(parentProfiles)
    .where(and(
      eq(parentProfiles.email, email),
      eq(parentProfiles.schoolId, schoolId)
    ))
    .limit(1);

  return results[0] || null;
}

/**
 * Validate parent profile data
 */
export function validateParentData(data: Partial<ParentProfileData>): string[] {
  const errors: string[] = [];

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }

  if (!data.schoolId) {
    errors.push('School ID is required');
  }

  // Phone format validation (if provided)
  if (data.phone && data.phone.trim().length > 0) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push('Invalid phone number format');
    }
  }

  return errors;
}

/**
 * Check if parent email already exists in school
 */
export async function parentEmailExists(
  email: string,
  schoolId: number,
  excludeId?: string
): Promise<boolean> {
  let whereCondition = and(
    eq(parentProfiles.email, email),
    eq(parentProfiles.schoolId, schoolId)
  );

  if (excludeId) {
    // This would need to be implemented if we support parent profile updates
    // For now, we only create new profiles or link existing ones
  }

  const results = await db
    .select({ id: parentProfiles.id })
    .from(parentProfiles)
    .where(whereCondition)
    .limit(1);

  return results.length > 0;
}