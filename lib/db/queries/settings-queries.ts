import { db } from '@/lib/db';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Multi-tenant query helpers for school settings
 * All queries are automatically scoped by school ID for data isolation
 */

/**
 * Get school settings with multi-tenant scoping
 * @param schoolId - The school ID to query settings for
 * @returns School settings or null if not found
 */
export async function getSchoolSettings(schoolId: number) {
  try {
    const result = await db
      .select({
        schoolId: teams.id,
        schoolName: teams.name,
        defaultMonthlyFeeRon: teams.defaultMonthlyFeeRon,
        freeEnrollmentCount: teams.freeEnrollmentCount,
        settingsUpdatedAt: teams.settingsUpdatedAt,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .where(eq(teams.id, schoolId))
      .limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Error fetching school settings:', error);
    throw new Error('Failed to fetch school settings');
  }
}

/**
 * Get default monthly fee for a school (multi-tenant scoped)
 * @param schoolId - The school ID
 * @returns Default monthly fee as number (in RON)
 */
export async function getDefaultMonthlyFee(schoolId: number): Promise<number> {
  try {
    const result = await db
      .select({
        defaultMonthlyFeeRon: teams.defaultMonthlyFeeRon,
      })
      .from(teams)
      .where(eq(teams.id, schoolId))
      .limit(1);

    if (!result || result.length === 0) {
      return 0; // Default fallback
    }

    const feeString = result[0].defaultMonthlyFeeRon;
    return feeString ? parseFloat(feeString) : 0;
  } catch (error) {
    console.error('Error fetching default monthly fee:', error);
    return 0; // Fallback on error
  }
}

/**
 * Get free enrollment count for a school (multi-tenant scoped)
 * @param schoolId - The school ID
 * @returns Free enrollment count as number
 */
export async function getFreeEnrollmentCount(schoolId: number): Promise<number> {
  try {
    const result = await db
      .select({
        freeEnrollmentCount: teams.freeEnrollmentCount,
      })
      .from(teams)
      .where(eq(teams.id, schoolId))
      .limit(1);

    if (!result || result.length === 0) {
      return 0; // Default fallback
    }

    return result[0].freeEnrollmentCount ?? 0;
  } catch (error) {
    console.error('Error fetching free enrollment count:', error);
    return 0; // Fallback on error
  }
}

/**
 * Update school settings with multi-tenant scoping
 * @param schoolId - The school ID to update
 * @param settings - Settings to update
 * @returns Updated school settings
 */
export async function updateSchoolSettings(
  schoolId: number,
  settings: {
    defaultMonthlyFeeRon?: string;
    freeEnrollmentCount?: number;
  }
) {
  try {
    const updateData: Partial<typeof teams.$inferInsert> = {
      updatedAt: new Date(),
      settingsUpdatedAt: new Date(),
    };

    if (settings.defaultMonthlyFeeRon !== undefined) {
      updateData.defaultMonthlyFeeRon = settings.defaultMonthlyFeeRon;
    }

    if (settings.freeEnrollmentCount !== undefined) {
      updateData.freeEnrollmentCount = settings.freeEnrollmentCount;
    }

    const result = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, schoolId))
      .returning({
        schoolId: teams.id,
        defaultMonthlyFeeRon: teams.defaultMonthlyFeeRon,
        freeEnrollmentCount: teams.freeEnrollmentCount,
        settingsUpdatedAt: teams.settingsUpdatedAt,
      });

    if (!result || result.length === 0) {
      throw new Error('Failed to update school settings - school not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error updating school settings:', error);
    throw new Error('Failed to update school settings');
  }
}

/**
 * Verify if a school exists (multi-tenant check)
 * @param schoolId - The school ID to verify
 * @returns True if school exists, false otherwise
 */
export async function schoolExists(schoolId: number): Promise<boolean> {
  try {
    const result = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, schoolId))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error verifying school existence:', error);
    return false;
  }
}

/**
 * Get settings last updated timestamp (multi-tenant scoped)
 * @param schoolId - The school ID
 * @returns Last updated timestamp or null
 */
export async function getSettingsLastUpdated(schoolId: number): Promise<Date | null> {
  try {
    const result = await db
      .select({
        settingsUpdatedAt: teams.settingsUpdatedAt,
      })
      .from(teams)
      .where(eq(teams.id, schoolId))
      .limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0].settingsUpdatedAt;
  } catch (error) {
    console.error('Error fetching settings timestamp:', error);
    return null;
  }
}